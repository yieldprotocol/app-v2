import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import {
  ICallData,
  SignType,
  ISeries,
  ActionCodes,
  LadleActions,
  RoutedActions,
  IUserContextState,
} from '../types';
import { getTxCode } from '../utils/appUtils';
import { DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../utils/constants';
import { buyBase, buyFYToken, calculateSlippage, secondsToFrom, sellBase, sellFYToken } from '../utils/yieldMath';
import { useChain } from './useChain';

/* Lend Actions Hook */
export const useClosePosition = () => {

  const { userState, userActions } = useContext(UserContext);
  const { activeAccount:account, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;

  const { sign, transact } = useChain();

  const closePosition = async (input: string | undefined, series: ISeries) => {

    const txCode = getTxCode(ActionCodes.CLOSE_POSITION, series.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const base = assetMap.get(series.baseId);
    const { fyTokenAddress, poolAddress } = series;

    const _inputAsFyToken = buyBase(
      series.baseReserves,
      series.fyTokenReserves,
      _input,
      secondsToFrom(series.maturity.toString())
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
          ignore: false,
        },
      ],
      txCode,
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [fyTokenAddress, poolAddress, _inputAsFyToken] as LadleActions.Args.TRANSFER,
        ignore: false,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _inputAsFyTokenWithSlippage] as RoutedActions.Args.SELL_FYTOKEN, // TODO calc min transfer slippage
        fnName: RoutedActions.Fn.SELL_FYTOKEN,
        targetContract:series.poolContract,
        ignore: false,
      },
    ];
    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };

  return closePosition
};
