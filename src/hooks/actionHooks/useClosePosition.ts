import { useSWRConfig } from 'swr';
import { ethers } from 'ethers';
import { useContext } from 'react';
import { buyBase, calculateSlippage } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS } from '../../config/assets';
import { HistoryContext } from '../../contexts/HistoryContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { ONE_BN } from '../../utils/constants';

import { useChain } from '../useChain';
import { useAddRemoveEth } from './useAddRemoveEth';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { useAccount } from 'wagmi';
import useContracts, { ContractNames } from '../useContracts';
import useAsset from '../useAsset';

/* Lend Actions Hook */
export const useClosePosition = () => {
  const { mutate } = useSWRConfig();
  const {
    settingsState: { slippageTolerance },
  } = useContext(SettingsContext);

  const {
    userActions,
    userState: { selectedSeries: series },
  } = useContext(UserContext);
  const { address: account } = useAccount();
  const contracts = useContracts();
  const { updateSeries } = userActions;
  const {
    historyActions: { updateTradeHistory },
  } = useContext(HistoryContext);

  const { data: base, key: baseKey } = useAsset(series?.baseId!);

  const { sign, transact } = useChain();
  const { removeEth } = useAddRemoveEth();
  const { getTimeTillMaturity } = useTimeTillMaturity();

  const closePosition = async (input: string | undefined) => {
    if (!account) throw new Error('no account detected in close position');
    if (!series) throw new Error('no series detected in close position');
    if (!base) throw new Error('no base detected in close position');

    const txCode = getTxCode(ActionCodes.CLOSE_POSITION, series.id);
    const cleanedInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanedInput, base.decimals) : ethers.constants.Zero;

    const { fyTokenAddress, poolAddress, seriesIsMature } = series;
    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;
    if (!ladleAddress) throw new Error('no ladle address detected in close position');

    /* assess how much fyToken is needed to buy base amount (input) */
    /* after maturity, fytoken === base (input) value */
    const _fyTokenValueOfInput = seriesIsMature
      ? _input
      : buyBase(
          series.sharesReserves,
          series.fyTokenReserves,
          series.getShares(_input),
          getTimeTillMaturity(series.maturity),
          series.ts,
          series.g2,
          series.decimals,
          series.c,
          series.mu
        );

    /* calculate slippage on the base token expected to recieve ie. input */
    const _inputWithSlippage = calculateSlippage(_input, slippageTolerance.toString(), true);

    /* if ethBase */
    const isEthBase = ETH_BASED_ASSETS.includes(series.baseId);

    /* if approveMAx, check if signature is required */
    const alreadyApproved = (await series.fyTokenContract.allowance(account, ladleAddress)).gte(_fyTokenValueOfInput);

    const permitCallData = await sign(
      [
        {
          target: series,
          spender: 'LADLE',
          amount: _fyTokenValueOfInput,
          ignoreIf: alreadyApproved === true,
        },
      ],
      txCode
    );

    const removeEthCallData = isEthBase ? removeEth(ONE_BN) : [];

    /* Set the transferTo address based on series maturity */
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
        targetContract: series.poolContract,
        ignoreIf: seriesIsMature,
      },

      /* AFTER MATURITY */
      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, receiverAddress(), _fyTokenValueOfInput] as LadleActions.Args.REDEEM,
        ignoreIf: !seriesIsMature,
      },

      ...removeEthCallData, // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)
    ];
    await transact(calls, txCode);

    mutate(baseKey);
    updateSeries([series]);
    updateTradeHistory([series]);
  };

  return closePosition;
};
