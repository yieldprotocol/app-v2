import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, SignType, ISeries, ActionCodes, LadleActions, RoutedActions, IUserContextState } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../../utils/constants';
import { useChain } from '../useChain';

/* Lend Actions Hook */
export const useRedeemPosition = () => {
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;
  const { sign, transact } = useChain();

  // TODO will fail if balance of join is less than amount
  
  const redeem = async (series: ISeries, input: string | undefined) => {
    const txCode = getTxCode(ActionCodes.REDEEM, series.id);

    const base = assetMap.get(series.baseId);
    const _input = input ? ethers.utils.parseUnits(input, base.decimals) : ethers.constants.Zero;

    const permits: ICallData[] = await sign(
      [
        /* AFTER MATURITY */
        {
          target: series,
          spender: 'LADLE',
          message: 'Signing ERC20 Token approval',
          ignoreIf: !series.isMature(),
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [series.poolAddress, account, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: !series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, account, ethers.utils.parseUnits('1', series.decimals)] as LadleActions.Args.REDEEM,
        ignoreIf: !series.seriesIsMature,
      },
    ];
    transact(calls, txCode);
    updateAssets([base]);
  };

  return redeem;
};


