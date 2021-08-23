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
export const useRedeemPosition = () => {

  const { userState, userActions } = useContext(UserContext);
  const { activeAccount:account, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;
  const { sign, transact } = useChain();

  /* NB TO DO */
  const redeem = async (series: ISeries, input: string | undefined) => {
    const txCode = getTxCode(ActionCodes.REDEEM, series.id);
    const base = assetMap.get(series.baseId);
    const _input = input ? ethers.utils.parseEther(input) : series.fyTokenBalance || ethers.constants.Zero;
    
    const permits: ICallData[] = await sign(
      [
        /* AFTER MATURITY */
        {
          target: series,
          spender: 'LADLE',
          series,
          message: 'Signing ERC20 Token approval',
          ignore: !series.seriesIsMature,
        },
      ],
      txCode,
    );

    const calls: ICallData[] = [
      ...permits,

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [ series.poolAddress, account, _input] as LadleActions.Args.TRANSFER,
        ignore: false,
      },
      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, account, ethers.utils.parseEther('1')] as LadleActions.Args.REDEEM,
        ignore: false,
      },
    ];
    transact(calls, txCode);
    updateAssets([base]);
  };

  return redeem;
};
