import { useSWRConfig } from 'swr';
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
import useAsset from '../useAsset';
import useSeriesEntity from '../useSeriesEntity';

/* Roll Lend Position Action Hook */
export const useRollPosition = (toSeriesId: string) => {
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const {
    settingsState: { slippageTolerance, diagnostics },
  } = useContext(SettingsContext);

  const {
    userState: { selectedSeries },
  } = useContext(UserContext);

  const { data: fromSeriesEntity, key: fromSeriesEntityKey } = useSeriesEntity(selectedSeries?.id!);
  const { data: toSeriesEntity, key: toSeriesEntityKey } = useSeriesEntity(toSeriesId);
  const { data: base, key: baseKey } = useAsset(fromSeriesEntity?.baseId!);
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
   */
  const rollPosition = async (input: string | undefined) => {
    if (!account) throw new Error('no account detected in roll position');
    if (!fromSeriesEntity) throw new Error('no from series detected in roll position');
    if (!toSeriesEntity) throw new Error('no to series detected in roll position');
    if (!base) throw new Error('no base detected in roll position');

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ROLL_POSITION, fromSeriesEntity.id);
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;

    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;
    if (!ladleAddress) throw new Error('no ladle address detected in roll position');

    // estimate how much fyToken you could sell given the input (base), using the from series
    const _fyTokenValueOfInputIn = fromSeriesEntity.seriesIsMature
      ? _input
      : buyBase(
          fromSeriesEntity.sharesReserves.value,
          fromSeriesEntity.fyTokenReserves.value,
          fromSeriesEntity.getShares(_input),
          getTimeTillMaturity(fromSeriesEntity.maturity),
          fromSeriesEntity.ts,
          fromSeriesEntity.g2,
          fromSeriesEntity.decimals,
          fromSeriesEntity.c,
          fromSeriesEntity.mu
        );

    // estimate how much fyToken you can get given input (base), using the to series
    const _fyTokenValueOfInputOut = sellBase(
      toSeriesEntity.sharesReserves.value,
      toSeriesEntity.fyTokenReserves.value,
      toSeriesEntity.getShares(_input),
      getTimeTillMaturity(toSeriesEntity.maturity),
      toSeriesEntity.ts,
      toSeriesEntity.g1,
      toSeriesEntity.decimals,
      toSeriesEntity.c,
      toSeriesEntity.mu
    );

    // the minimum amount of base to receive when swapping fyToken to base within "from" pool
    const _minimumBaseReceived = calculateSlippage(_input, slippageTolerance.toString(), true);

    // the minimum amount of fyToken to receive when swapping from base to fyToken in "to" pool (the fyToken output "rolled" amount)
    const _minimumFYTokenReceived = calculateSlippage(_fyTokenValueOfInputOut, slippageTolerance.toString(), true);

    diagnostics &&
      console.log(
        '\n',
        'fyToken value of input in (from series): ',
        formatUnits(_fyTokenValueOfInputIn, fromSeriesEntity.decimals),
        '\n',
        'fyToken value of input out (to series): ',
        formatUnits(_fyTokenValueOfInputOut, toSeriesEntity.decimals),
        '\n',
        'minimum base to receive (from series)',
        formatUnits(_minimumBaseReceived, fromSeriesEntity.decimals),
        '\n',
        'minimum fyToken to receive out (to series)',
        formatUnits(_minimumFYTokenReceived, toSeriesEntity.decimals)
      );

    const alreadyApproved = (await fromSeriesEntity.fyTokenContract.allowance(account, ladleAddress)).gte(_input);

    const permitCallData = await sign(
      [
        {
          target: fromSeriesEntity,
          spender: 'LADLE',
          amount: _fyTokenValueOfInputIn,
          ignoreIf: alreadyApproved === true,
        },
      ],
      txCode
    );

    /* Reciever of transfer (based on maturity) the series maturity */
    const transferToAddress = () => {
      if (fromSeriesEntity.seriesIsMature) return fromSeriesEntity.fyTokenAddress;
      return fromSeriesEntity.poolAddress;
    };

    const calls: ICallData[] = [
      ...permitCallData,

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [
          fromSeriesEntity.fyTokenAddress,
          transferToAddress(),
          _fyTokenValueOfInputIn,
        ] as LadleActions.Args.TRANSFER,
        ignoreIf: false, // never ignore
      },

      /* BEFORE MATURITY */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [toSeriesEntity.poolAddress, _minimumBaseReceived] as RoutedActions.Args.SELL_FYTOKEN,
        fnName: RoutedActions.Fn.SELL_FYTOKEN,
        targetContract: fromSeriesEntity.poolContract,
        ignoreIf: fromSeriesEntity.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _minimumFYTokenReceived] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract: toSeriesEntity.poolContract,
        ignoreIf: fromSeriesEntity.seriesIsMature,
      },

      /* AFTER MATURITY */
      {
        // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
        operation: LadleActions.Fn.REDEEM,
        args: [fromSeriesEntity.id, toSeriesEntity.poolAddress, _minimumBaseReceived] as LadleActions.Args.REDEEM,
        ignoreIf: !fromSeriesEntity.seriesIsMature,
      },
      {
        // ladle.sellBaseAction(series2Id, receiver, minimumFYTokenToReceive)
        operation: LadleActions.Fn.ROUTE,
        args: [account, _minimumFYTokenReceived] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract: toSeriesEntity.poolContract,
        ignoreIf: !fromSeriesEntity.seriesIsMature,
      },
    ];

    const res = (await transact(calls, txCode)) as Promise<ethers.ContractReceipt | null> | void;

    mutate(baseKey);
    mutate(fromSeriesEntityKey);
    mutate(toSeriesEntityKey);
    updateTradeHistory([fromSeriesEntity, toSeriesEntity]);

    res && router.replace(`/lendposition/${toSeriesEntity.id}`);
  };

  return rollPosition;
};
