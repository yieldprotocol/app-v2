import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import {
  ICallData,
  ISeries,
  ActionCodes,
  LadleActions,
  RoutedActions,
} from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { buyBase, calculateSlippage } from '../../utils/yieldMath';
import { useChain } from '../useChain';

/* Lend Actions Hook */
export const useClosePosition = () => {

  const { userState, userActions } = useContext(UserContext);
  const { activeAccount:account, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;

  const { sign, transact } = useChain();

  const closePosition = async (input: string | undefined, series: ISeries) => {

    const txCode = getTxCode(ActionCodes.CLOSE_POSITION, series.id);

    const base = assetMap.get(series.baseId);
    const _input = input ? ethers.utils.parseUnits(input, base.decimals) : ethers.constants.Zero;

    const { fyTokenAddress, poolAddress, seriesIsMature } = series;

    const _inputAsFyToken = buyBase(
      series.baseReserves,
      series.fyTokenReserves,
      _input,
      series.getTimeTillMaturity()
    );

    const _inputAsFyTokenWithSlippage = calculateSlippage(
      _inputAsFyToken,
      userState.slippageTolerance.toString(),
      true
    );

    const permits: ICallData[] = await sign(
      [
        {
          target: series,
          spender: 'LADLE',
          series,
          message: 'Signing ERC20 Token approval',
          ignoreIf: series.seriesIsMature,
        },
      ],
      txCode,
    );

      console.log('sereis mature: ' , seriesIsMature )

    const calls: ICallData[] = [
      ...permits,

      /* BEFORE MATURITY */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [fyTokenAddress, poolAddress, _inputAsFyToken] as LadleActions.Args.TRANSFER,
        ignoreIf: seriesIsMature,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _inputAsFyTokenWithSlippage] as RoutedActions.Args.SELL_FYTOKEN, 
        fnName: RoutedActions.Fn.SELL_FYTOKEN,
        targetContract: series.poolContract,
        ignoreIf: seriesIsMature,
      },

      /* AFTER MATURITY */ // TODO 
      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, account, _inputAsFyToken] as LadleActions.Args.REDEEM, 
        ignoreIf: !seriesIsMature,
      },

    ];
    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };

  return closePosition
};
