import { ethers } from 'ethers';
import { useContext } from 'react';
import { HistoryContext } from '../../contexts/HistoryContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { buyBase, calculateSlippage } from '../../utils/yieldMath';
import { useChain } from '../useChain';

/* Lend Actions Hook */
export const useClosePosition = () => {
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;
  const { historyActions: { updateTradeHistory } } = useContext(HistoryContext);

  const { sign, transact } = useChain();

  const closePosition = async (input: string | undefined, series: ISeries) => {
    const txCode = getTxCode(ActionCodes.CLOSE_POSITION, series.id);
    const base = assetMap.get(series.baseId);
    const cleanedInput = cleanValue(input, base.decimals)
    const _input = input ? ethers.utils.parseUnits(cleanedInput, base.decimals) : ethers.constants.Zero;

    const { fyTokenAddress, poolAddress, seriesIsMature } = series;

    /* buy fyToken value ( after maturity  fytoken === base value ) */
    const _fyTokenValueOfInput = seriesIsMature
      ? _input
      : buyBase(series.baseReserves, series.fyTokenReserves, _input, series.getTimeTillMaturity(), series.decimals);

    /* calculate slippage on the base token expected to recieve ie. input */ 
    const _inputWithSlippage = calculateSlippage(
      _input,
      userState.slippageTolerance.toString(),
      true
    );

    const permits: ICallData[] = await sign(
      [
        {
          target: series,
          spender: 'LADLE',
          amount: _fyTokenValueOfInput,
          ignoreIf: false, // never ignore
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [
          fyTokenAddress,
          seriesIsMature ? fyTokenAddress : poolAddress, // select dest based on maturity
          _fyTokenValueOfInput,
        ] as LadleActions.Args.TRANSFER,
        ignoreIf: false, // never ignore even after maturity because we go through the ladle.
      },

      /* BEFORE MATURITY */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _inputWithSlippage] as RoutedActions.Args.SELL_FYTOKEN,
        fnName: RoutedActions.Fn.SELL_FYTOKEN,
        targetContract: series.poolContract,
        ignoreIf: seriesIsMature,
      },

      /* AFTER MATURITY */
      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, account, _fyTokenValueOfInput] as LadleActions.Args.REDEEM,
        ignoreIf: !seriesIsMature,
      },
    ];
    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
    updateTradeHistory([series]);
  };

  return closePosition;
};
