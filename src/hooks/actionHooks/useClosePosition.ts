import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { buyBase, calculateSlippage, sellFYToken } from '../../utils/yieldMath';
import { useChain } from '../useChain';

/* Lend Actions Hook */
export const useClosePosition = () => {
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;

  const { sign, transact } = useChain();

  const closePosition = async (input: string | undefined, series: ISeries) => {
    const txCode = getTxCode(ActionCodes.CLOSE_POSITION, series.id);

    const base = assetMap.get(series.baseId);
    const _input = input ? ethers.utils.parseUnits(input, base.decimals) : ethers.constants.Zero;

    const { fyTokenAddress, poolAddress, seriesIsMature } = series;

    // buy fyToken value ( after maturity  fytoken === base value )
    const _fyTokenValueOfInput = seriesIsMature
      ? _input
      : buyBase(series.baseReserves, series.fyTokenReserves, _input, series.getTimeTillMaturity());

    const _fyTokenValueOfInputWithSlippage = calculateSlippage(
      _fyTokenValueOfInput,
      userState.slippageTolerance.toString(),
      true
    );

    const permits: ICallData[] = await sign(
      [
        {
          target: series,
          spender: 'LADLE',
          message: 'Allow Ladle to move your fyTokens',
          ignoreIf: false, // never ignore
        },
      ],
      txCode
    );

    console.log('series mature: ', seriesIsMature);

    const calls: ICallData[] = [
      ...permits,

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [
          fyTokenAddress,
          seriesIsMature ? fyTokenAddress : poolAddress, // select dest based on maturity
          _fyTokenValueOfInput,
        ] as LadleActions.Args.TRANSFER,
        ignoreIf: false, // never ignore
      },

      /* BEFORE MATURITY */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _fyTokenValueOfInputWithSlippage] as RoutedActions.Args.SELL_FYTOKEN,
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
  };

  return closePosition;
};
