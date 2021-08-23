import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, SignType, ISeries, ActionCodes, LadleActions, RoutedActions, IAsset } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../../utils/constants';
import { useChain } from '../useChain';

import { calculateSlippage, fyTokenForMint, mint, mintWithBase, sellBase, splitLiquidity } from '../../utils/yieldMath';
import { ChainContext } from '../../contexts/ChainContext';
import SeriesSelector from '../../components/selectors/SeriesSelector';

export const usePool = (input: string | undefined) => {
  const poolMax = input;
  return { poolMax };
};

/* Hook for chain transactions */
export const useRemoveLiquidity = () => {

  const { chainState: {strategyRootMap} } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, selectedIlkId, selectedSeriesId, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;
  const { sign, transact } = useChain();

  const removeLiquidity = async (input: string, series: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_LIQUIDITY, series.id);
    const _input = ethers.utils.parseEther(input);
    const base = assetMap.get(series.baseId);

    const permits: ICallData[] = await sign(
      [
        {
          // router.forwardPermitAction(pool.address, pool.address, router.address, allowance, deadline, v, r, s),
          target: {
            id: series.id,
            address: series.poolAddress,
            name: series.poolName,
            version: series.poolVersion,
          },
          series,
          spender: 'POOLROUTER',
          message: 'Signing ERC20 Token approval',
          ignore: false,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      {
        // router.transferToPool(base.address, fyToken1.address, pool1.address, WAD)
        operation: LadleActions.Fn.TRANSFER,
        args: [series.fyTokenAddress, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignore: series.seriesIsMature,
      },

      // BEFORE MATURITY
      {
        // burnForBase(receiver, minBaseReceived),
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.BURN_FOR_BASE,
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        ignore: series.seriesIsMature,
      },

      // AFTER MATURITY
      {
        // router.transferToPool(base.address, fyToken1.address, pool1.address, WAD)
        operation: LadleActions.Fn.TRANSFER,
        args: [series.fyTokenAddress, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignore: !series.seriesIsMature,
      },
      {
        // burnForBase(receiver, minBaseReceived),
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.BURN_FOR_BASE,
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        ignore: !series.seriesIsMature,
      },
    ];
    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };

  return removeLiquidity
};
