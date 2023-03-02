import { ethers } from 'ethers';
import { useContext } from 'react';
import { calculateSlippage, MAX_256, sellBase, WAD_BN } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS, USDT } from '../../config/assets';
import { HistoryContext } from '../../contexts/HistoryContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';
import { useAddRemoveEth } from './useAddRemoveEth';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { Address, useAccount, useBalance } from 'wagmi';
import useContracts, { ContractNames } from '../useContracts';
import useChainId from '../useChainId';
import useAccountPlus from '../useAccountPlus';
import { AssertActions, useAssert } from './useAssert';

/* Lend Actions Hook */
export const useLend = () => {
  const {
    settingsState: { slippageTolerance },
  } = useContext(SettingsContext);

  const { userState, userActions } = useContext(UserContext);
  const { assetMap, selectedSeries, selectedBase } = userState;
  const { updateSeries, updateAssets } = userActions;
  const { address: account } = useAccountPlus();
  const chainId = useChainId();

  const { refetch: refetchFyTokenBal } = useBalance({ address: account, token: selectedSeries?.address as Address });
  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.address as Address,
  });

  const {
    historyActions: { updateTradeHistory },
  } = useContext(HistoryContext);

  const { sign, transact } = useChain();
  const { addEth } = useAddRemoveEth();
  const { getTimeTillMaturity } = useTimeTillMaturity();
  const contracts = useContracts();

  const { assert, encodeBalanceCall } = useAssert();

  const lend = async (input: string | undefined, series: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.LEND, series.id);

    const base = assetMap?.get(series.baseId)!;
    const cleanedInput = cleanValue(input, base?.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanedInput, base?.decimals) : ethers.constants.Zero;

    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;

    const _inputAsFyToken = sellBase(
      series.sharesReserves,
      series.fyTokenReserves,
      series.getShares(_input), // convert base input to shares
      getTimeTillMaturity(series.maturity),
      series.ts,
      series.g1,
      series.decimals,
      series.c,
      series.mu
    );

    const _inputAsFyTokenWithSlippage = calculateSlippage(_inputAsFyToken, slippageTolerance.toString(), true);

    /* if approveMAx, check if signature is required */
    const alreadyApproved = (await base.getAllowance(account!, ladleAddress!)).gte(_input);

    /* ETH is used as a base */
    const isEthBase = ETH_BASED_ASSETS.includes(series.baseId);

    const permitCallData: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          amount: base.id === USDT && chainId !== 42161 ? MAX_256 : _input, // USDT allowance when non-zero needs to be set to 0 explicitly before settting to a non-zero amount; instead of having multiple approvals, we approve max from the outset on mainnet
          ignoreIf: alreadyApproved === true,
        },
      ],
      txCode
    );

    const addEthCallData = () => {
      if (isEthBase) return addEth(_input, series.poolAddress);
      return [];
    };

    /* Add in an Assert call : fyToken balance is 10% higher than what they inputed (as fyTokens) */
    const assertCallData: ICallData[] = assert(
      series.fyTokenContract.address,
      encodeBalanceCall(series.fyTokenContract.address, undefined),
      AssertActions.Fn.ASSERT_EQ_REL,
      series.fyTokenBalance!.add(_inputAsFyToken),
      WAD_BN.mul('10') // 10% relative tolerance
    );

    const calls: ICallData[] = [
      ...permitCallData,
      ...addEthCallData(),
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: isEthBase,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _inputAsFyTokenWithSlippage] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract: series.poolContract,
        ignoreIf: false,
      },
      ...assertCallData,
    ];

    await transact(calls, txCode);
    refetchBaseBal();
    refetchFyTokenBal();
    updateSeries([series]);
    updateAssets([base]);
    updateTradeHistory([series]);
  };

  return lend;
};
