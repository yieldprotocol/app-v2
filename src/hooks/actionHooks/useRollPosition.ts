import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import {
  ICallData,
  SignType,
  ISeries,
  ActionCodes,
  LadleActions,
  RoutedActions,
  IUserContextState,
} from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../../utils/constants';
import { buyBase, buyFYToken, calculateSlippage, secondsToFrom, sellBase, sellFYToken } from '../../utils/yieldMath';
import { useChain } from '../useChain';


/* Lend Actions Hook */
export const useRollPosition = () => {

  const { userState, userActions } = useContext(UserContext);
  const { activeAccount:account, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;

  const { sign, transact } = useChain();

  const rollPosition = async (input: string | undefined, fromSeries: ISeries, toSeries: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ROLL_POSITION, fromSeries.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const base = assetMap.get(fromSeries.baseId);

    const _inputAsFyToken = sellBase(
      fromSeries.baseReserves,
      fromSeries.fyTokenReserves,
      _input,
      secondsToFrom(fromSeries.maturity.toString())
    );
    const _inputAsFyTokenWithSlippage = calculateSlippage(
      _inputAsFyToken,
      userState.slippageTolerance.toString(),
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

      // TODO check if mininumums are the is the correct way around 
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _inputAsFyTokenWithSlippage] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract:toSeries.poolContract,
        ignoreIf: fromSeries.seriesIsMature,
      },

      /* AFTER MATURITY */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [fromSeries.address, toSeries.address, _inputAsFyToken] as LadleActions.Args.TRANSFER,
        ignoreIf: !fromSeries.seriesIsMature,
      },
      {
        // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
        operation: LadleActions.Fn.REDEEM,
        args: [toSeries.poolAddress, _inputAsFyToken] as LadleActions.Args.REDEEM,
        ignoreIf: !fromSeries.seriesIsMature,
      },
      {
        // ladle.sellBaseAction(series2Id, receiver, minimumFYTokenToReceive)
        operation: LadleActions.Fn.ROUTE,
        args: [account, _inputAsFyTokenWithSlippage] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract:toSeries.poolContract,
        ignoreIf: !fromSeries.seriesIsMature,
      },
    ];
    await transact(calls, txCode);
    updateSeries([fromSeries, toSeries]);
    updateAssets([base]);
  };

  return rollPosition

};
