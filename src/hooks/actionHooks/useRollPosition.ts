import { ethers } from 'ethers';
import { useContext } from 'react';
import { buyBase, calculateSlippage, sellBase } from '@yield-protocol/ui-math';

import { formatUnits } from 'ethers/lib/utils';
import { HistoryContext } from '../../contexts/HistoryContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions, IAsset } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import useContracts, { ContractNames } from '../useContracts';

/* Roll Lend Position Action Hook */
export const useRollPosition = () => {
  const router = useRouter();
  const {
    settingsState: { slippageTolerance, diagnostics },
  } = useContext(SettingsContext);

  const { userState, userActions } = useContext(UserContext);
  const { assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;

  const { address: account } = useAccount();
  const contracts = useContracts();

  const {
    historyActions: { updateTradeHistory },
  } = useContext(HistoryContext);

  const { sign, transact } = useChain();
  const { getTimeTillMaturity } = useTimeTillMaturity();

  /**
   * Transfer fyToken to the "from" pool to sell for base, then send base to "to" pool and sell base for fyToken
   * @param input in base (i.e.: 100 USDC)
   * @param fromSeries the series fyToken is rolled from
   * @param toSeries the series fyToken is rolled to
   */
  const rollPosition = async (input: string | undefined, fromSeries: ISeries, toSeries: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ROLL_POSITION, fromSeries.id);
    const base: IAsset = assetMap?.get(fromSeries.baseId)!;
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;

    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;

    // estimate how much fyToken you could sell given the input (base), using the from series
    const _fyTokenValueOfInputIn = fromSeries.seriesIsMature
      ? _input
      : buyBase(
          fromSeries.sharesReserves,
          fromSeries.fyTokenReserves,
          fromSeries.getShares(_input),
          getTimeTillMaturity(fromSeries.maturity),
          fromSeries.ts,
          fromSeries.g2,
          fromSeries.decimals,
          fromSeries.c,
          fromSeries.mu
        );

    // estimate how much fyToken you can get given input (base), using the to series
    const _fyTokenValueOfInputOut = sellBase(
      toSeries.sharesReserves,
      toSeries.fyTokenReserves,
      toSeries.getShares(_input),
      getTimeTillMaturity(toSeries.maturity),
      toSeries.ts,
      toSeries.g1,
      toSeries.decimals,
      toSeries.c,
      toSeries.mu
    );

    // the minimum amount of base to receive when swapping fyToken to base within "from" pool
    const _minimumBaseReceived = calculateSlippage(_input, slippageTolerance.toString(), true);

    // the minimum amount of fyToken to receive when swapping from base to fyToken in "to" pool (the fyToken output "rolled" amount)
    const _minimumFYTokenReceived = calculateSlippage(_fyTokenValueOfInputOut, slippageTolerance.toString(), true);

    diagnostics &&
      console.log(
        '\n',
        'fyToken value of input in (from series): ',
        formatUnits(_fyTokenValueOfInputIn, fromSeries.decimals),
        '\n',
        'fyToken value of input out (to series): ',
        formatUnits(_fyTokenValueOfInputOut, toSeries.decimals),
        '\n',
        'minimum base to receive (from series)',
        formatUnits(_minimumBaseReceived, fromSeries.decimals),
        '\n',
        'minimum fyToken to receive out (to series)',
        formatUnits(_minimumFYTokenReceived, toSeries.decimals)
      );

    const alreadyApproved = (await fromSeries.fyTokenContract.allowance(account!, ladleAddress!)).gte(_input);

    const permitCallData: ICallData[] = await sign(
      [
        {
          target: fromSeries,
          spender: 'LADLE',
          amount: _fyTokenValueOfInputIn,
          ignoreIf: alreadyApproved === true,
        },
      ],
      txCode
    );

    /* Reciever of transfer (based on maturity) the series maturity */
    const transferToAddress = () => {
      if (fromSeries.seriesIsMature) return fromSeries.fyTokenAddress;
      return fromSeries.poolAddress;
    };

    const calls: ICallData[] = [
      ...permitCallData,

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [fromSeries.fyTokenAddress, transferToAddress(), _fyTokenValueOfInputIn] as LadleActions.Args.TRANSFER,
        ignoreIf: false, // never ignore
      },

      /* BEFORE MATURITY */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [toSeries.poolAddress, _minimumBaseReceived] as RoutedActions.Args.SELL_FYTOKEN,
        fnName: RoutedActions.Fn.SELL_FYTOKEN,
        targetContract: fromSeries.poolContract,
        ignoreIf: fromSeries.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _minimumFYTokenReceived] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract: toSeries.poolContract,
        ignoreIf: fromSeries.seriesIsMature,
      },

      /* AFTER MATURITY */
      {
        // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
        operation: LadleActions.Fn.REDEEM,
        args: [fromSeries.id, toSeries.poolAddress, _minimumBaseReceived] as LadleActions.Args.REDEEM,
        ignoreIf: !fromSeries.seriesIsMature,
      },
      {
        // ladle.sellBaseAction(series2Id, receiver, minimumFYTokenToReceive)
        operation: LadleActions.Fn.ROUTE,
        args: [account, _minimumFYTokenReceived] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract: toSeries.poolContract,
        ignoreIf: !fromSeries.seriesIsMature,
      },
    ];

    const res = (await transact(calls, txCode)) as Promise<ethers.ContractReceipt | null> | void;
    updateSeries([fromSeries, toSeries]);
    updateAssets([base]);
    updateTradeHistory([fromSeries, toSeries]);
    res && router.replace(`/lendposition/${toSeries.id}`);
  };

  return rollPosition;
};
