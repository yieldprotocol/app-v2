import { ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import {
  ICallData,
  ISeries,
  ActionCodes,
  LadleActions,
  RoutedActions,
} from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { calculateSlippage, sellBase } from '../../utils/yieldMath';
import { useChain } from '../useChain';

/* Lend Actions Hook */
export const useRollPosition = () => {

  const { userState, userActions } = useContext(UserContext);
  const { activeAccount:account, assetMap, slippageTolerance } = userState;
  const { updateSeries, updateAssets } = userActions;

  const { sign, transact } = useChain();

  const rollPosition = async (input: string | undefined, fromSeries: ISeries, toSeries: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ROLL_POSITION, fromSeries.id);
    const base = assetMap.get(fromSeries.baseId);
    const _input = input ? ethers.utils.parseUnits(input, base.decimals) : ethers.constants.Zero;

    const _inputAsFyToken = sellBase(
      fromSeries.baseReserves,
      fromSeries.fyTokenReserves,
      _input,
      fromSeries.getTimeTillMaturity()
    );

    const _minimumFYTokenReceived = calculateSlippage(
      _inputAsFyToken,
      slippageTolerance.toString(),
      true
    );

    const permits: ICallData[] = await sign(
      [
        {
          target: fromSeries,
          spender: 'LADLE',
          series: fromSeries,
          message: 'Signing ERC20 Token approval',
          ignoreIf: false,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      /* BEFORE MATURITY */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [fromSeries.fyTokenAddress, fromSeries.poolAddress, _inputAsFyToken] as LadleActions.Args.TRANSFER,
        ignoreIf: fromSeries.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [toSeries.poolAddress, ethers.constants.Zero] as RoutedActions.Args.SELL_FYTOKEN,
        fnName: RoutedActions.Fn.SELL_FYTOKEN,
        targetContract:fromSeries.poolContract,
        ignoreIf: fromSeries.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _minimumFYTokenReceived] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract:toSeries.poolContract,
        ignoreIf: fromSeries.seriesIsMature,
      },

      /* AFTER MATURITY */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [fromSeries.address, fromSeries.address, _inputAsFyToken] as LadleActions.Args.TRANSFER,
        ignoreIf: !fromSeries.seriesIsMature,
      },
      {
        // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
        operation: LadleActions.Fn.REDEEM,
        args: [fromSeries.id, toSeries.poolAddress, _inputAsFyToken] as LadleActions.Args.REDEEM,
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

    await transact(calls, txCode);

    updateSeries([fromSeries, toSeries]);
    updateAssets([base]);
  };

  return rollPosition

};
