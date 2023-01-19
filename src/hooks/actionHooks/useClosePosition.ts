import { useSWRConfig } from 'swr';
import { ethers } from 'ethers';
import { useContext } from 'react';
import { buyBase, calculateSlippage } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS } from '../../config/assets';
import { HistoryContext } from '../../contexts/HistoryContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ActionCodes, LadleActions, RoutedActions } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { ONE_BN } from '../../utils/constants';

import { useChain } from '../useChain';
import { useAddRemoveEth } from './useAddRemoveEth';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { useAccount } from 'wagmi';
import useContracts, { ContractNames } from '../useContracts';
import useAsset from '../useAsset';
import useSeriesEntity from '../useSeriesEntity';

/* Lend Actions Hook */
export const useClosePosition = () => {
  const { mutate } = useSWRConfig();
  const {
    settingsState: { slippageTolerance },
  } = useContext(SettingsContext);

  const {
    userState: { selectedSeries },
  } = useContext(UserContext);
  const { address: account } = useAccount();
  const contracts = useContracts();
  const {
    historyActions: { updateTradeHistory },
  } = useContext(HistoryContext);

  const { data: seriesEntity, key: seriesEntityKey } = useSeriesEntity(selectedSeries?.id!);
  const { data: base, key: baseKey } = useAsset(seriesEntity?.baseId!);

  const { sign, transact } = useChain();
  const { removeEth } = useAddRemoveEth();
  const { getTimeTillMaturity } = useTimeTillMaturity();

  const closePosition = async (input: string | undefined) => {
    if (!account) throw new Error('no account detected in close position');
    if (!seriesEntity) throw new Error('no seriesEntity detected in close position');
    if (!base) throw new Error('no base detected in close position');

    const txCode = getTxCode(ActionCodes.CLOSE_POSITION, seriesEntity.id);
    const cleanedInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanedInput, base.decimals) : ethers.constants.Zero;

    const { fyTokenAddress, poolAddress, seriesIsMature } = seriesEntity;
    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;
    if (!ladleAddress) throw new Error('no ladle address detected in close position');

    const { sharesReserves, fyTokenReserves, getShares, ts, g2, decimals, c, mu } = seriesEntity;

    /* assess how much fyToken is needed to buy base amount (input) */
    /* after maturity, fytoken === base (input) value */
    const _fyTokenValueOfInput = seriesIsMature
      ? _input
      : buyBase(
          sharesReserves.value,
          fyTokenReserves.value,
          getShares(_input),
          getTimeTillMaturity(seriesEntity.maturity),
          ts,
          g2,
          decimals,
          c,
          mu
        );

    /* calculate slippage on the base token expected to recieve ie. input */
    const _inputWithSlippage = calculateSlippage(_input, slippageTolerance.toString(), true);

    /* if ethBase */
    const isEthBase = ETH_BASED_ASSETS.includes(seriesEntity.baseId);

    /* if approveMAx, check if signature is required */
    const alreadyApproved = (await seriesEntity.fyTokenContract.allowance(account, ladleAddress)).gte(
      _fyTokenValueOfInput
    );

    const permitCallData = await sign(
      [
        {
          target: seriesEntity,
          spender: 'LADLE',
          amount: _fyTokenValueOfInput,
          ignoreIf: alreadyApproved === true,
        },
      ],
      txCode
    );

    const removeEthCallData = isEthBase ? removeEth(ONE_BN) : [];

    /* Set the transferTo address based on seriesEntity maturity */
    const transferToAddress = () => {
      if (seriesIsMature) return fyTokenAddress;
      return poolAddress;
    };

    /* receiver based on whether base is ETH (- or wrapped Base) */
    const receiverAddress = () => {
      if (isEthBase) return ladleAddress;
      // if ( unwrapping) return unwrapHandlerAddress;
      return account;
    };

    const calls: ICallData[] = [
      ...permitCallData,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [
          fyTokenAddress,
          transferToAddress(), // select destination based on maturity
          _fyTokenValueOfInput,
        ] as LadleActions.Args.TRANSFER,
        ignoreIf: false, // never ignore, even after maturity because we go through the ladle.
      },

      /* BEFORE MATURITY */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [receiverAddress(), _inputWithSlippage] as RoutedActions.Args.SELL_FYTOKEN,
        fnName: RoutedActions.Fn.SELL_FYTOKEN,
        targetContract: seriesEntity.poolContract,
        ignoreIf: seriesIsMature,
      },

      /* AFTER MATURITY */
      {
        operation: LadleActions.Fn.REDEEM,
        args: [seriesEntity.id, receiverAddress(), _fyTokenValueOfInput] as LadleActions.Args.REDEEM,
        ignoreIf: !seriesIsMature,
      },

      ...removeEthCallData, // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)
    ];
    await transact(calls, txCode);

    mutate(baseKey);
    mutate(seriesEntityKey);
    updateTradeHistory([seriesEntity]);
  };

  return closePosition;
};
