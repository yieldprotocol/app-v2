import { ethers } from 'ethers';
import { useContext } from 'react';
import { buyBase, calculateSlippage } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS, USDT } from '../../../config/assets';
import { HistoryContext } from '../../../contexts/HistoryContext';
import { SettingsContext } from '../../../contexts/SettingsContext';
import { UserContext } from '../../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions } from '../../../types';
import { cleanValue, getTxCode } from '../../../utils/appUtils';
import { ONE_BN } from '../../../utils/constants';

import { useChain } from '../../useChain';
import { useAddRemoveEth } from '../useAddRemoveEth';
import useTimeTillMaturity from '../../useTimeTillMaturity';
import { Address, useBalance, useProvider } from 'wagmi';
import useContracts from '../../useContracts';
import useAccountPlus from '../../useAccountPlus';
import { ContractNames } from '../../../config/contracts';
import useAllowAction from '../../useAllowAction';
import { MAX_256 } from '@yield-protocol/ui-math';
import useChainId from '../../useChainId';
import useVYTokens from '../../entities/useVYTokens';
import { VYToken__factory } from '../../../contracts';

/* Lend Actions Hook */
export const useClosePositionVR = () => {
  const {
    settingsState: { slippageTolerance },
  } = useContext(SettingsContext);

  const { userState, userActions } = useContext(UserContext);
  const { assetMap, selectedBase, selectedVR } = userState;
  const { address: account } = useAccountPlus();
  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.address as Address,
  });
  const { refetch: refetchVyTokenBal } = useBalance({
    address: account,
    token: selectedBase?.VYTokenProxyAddress as Address,
  });
  const contracts = useContracts();
  const chainId = useChainId();
  const provider = useProvider();

  const { data: vyTokens } = useVYTokens();

  const { updateAssets } = userActions;
  const {
    historyActions: { updateTradeHistory },
  } = useContext(HistoryContext);

  const { sign, transact } = useChain();
  const { removeEth } = useAddRemoveEth();
  const { getTimeTillMaturity } = useTimeTillMaturity();
  const { isActionAllowed } = useAllowAction();

  const closePositionVR = async (
    input: string | undefined,
    getValuesFromNetwork: boolean = true // get market values by network call or offline calc (default: NETWORK)
  ) => {
    if (!contracts) return;
    if (!isActionAllowed(ActionCodes.CLOSE_POSITION)) return; // return if action is not allowed

    const txCode = getTxCode(ActionCodes.CLOSE_POSITION, 'VR');
    const base = assetMap?.get(selectedBase!.id)!;
    const cleanedInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanedInput, base.decimals) : ethers.constants.Zero;

    const selectedVyToken = vyTokens?.get(base?.VYTokenAddress!.toLowerCase());
    const vyTokenProxyAddr = selectedVyToken?.proxyAddress.toLowerCase();

    if (!vyTokenProxyAddr) return console.error('vyTokenProxyAddr not found');
    const vyTokenProxyContract = VYToken__factory.connect(vyTokenProxyAddr, provider);

    const { address, joinAddressVR } = base;
    const ladleAddress = contracts.get(ContractNames.VR_LADLE)?.address;

    /* calculate slippage on the base token expected to recieve ie. input */
    const _inputWithSlippage = calculateSlippage(_input, slippageTolerance.toString(), true);

    /* if ethBase */
    const isEthBase = ETH_BASED_ASSETS.includes(base.id);

    /* if approveMAx, check if signature is required */
    const alreadyApproved = (await base.getAllowance(account, ladleAddress!)).gte(_input);

    const permitCallData: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          amount: base.id === USDT && chainId !== 42161 ? MAX_256 : _input,
          ignoreIf: alreadyApproved === true,
        },
      ],
      txCode
    );

    const removeEthCallData = isEthBase ? removeEth(ONE_BN) : [];

    const calls: ICallData[] = [
      ...permitCallData,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [
          vyTokenProxyAddr, //vyToken amount
          vyTokenProxyAddr, // select destination based on maturity
          _input,
        ] as LadleActions.Args.TRANSFER,
        ignoreIf: false, // never ignore, even after maturity because we go through the ladle.
      },

      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _input] as RoutedActions.Args.REDEEM_VR,
        fnName: RoutedActions.Fn.REDEEM,
        targetContract: vyTokenProxyContract,
        ignoreIf: false,
      },

      ...removeEthCallData, // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)
    ];
    await transact(calls, txCode);
    refetchBaseBal();
    refetchVyTokenBal();
    updateAssets([base]);
    // updateTradeHistory([series]);
  };

  return closePositionVR;
};
