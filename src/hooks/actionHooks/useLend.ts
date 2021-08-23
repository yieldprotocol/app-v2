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
export const useLend = () => {

  const { userState, userActions } = useContext(UserContext);
  const { activeAccount:account, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;

  const { sign, transact } = useChain();

  const lend = async (input: string | undefined, series: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.LEND, series.id);

    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const base = assetMap.get(series.baseId);

    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          series,
          message: 'Signing ERC20 Token approval',
          ignore: false, // ignore if user has previously signed. base.
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [
          base.address,
          series.poolAddress,
          _input.toString(),
        ] as LadleActions.Args.TRANSFER,
        ignore: false,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.SELL_BASE, // TODO calc minFYToken recieved >  transfer slippage
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract:series.poolContract,
        ignore: false,
      },
    ];

    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };

  return lend
};
