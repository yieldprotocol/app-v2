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
export const useRollLiquidity = () => {

  const { chainState: {strategyRootMap} } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, selectedIlkId, selectedSeriesId, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;
  const { sign, transact } = useChain();

  const rollLiquidity = async (input: string, fromSeries: ISeries, toSeries: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ROLL_LIQUIDITY, fromSeries.id);
    const _input = ethers.utils.parseEther(input);
    const base = assetMap.get(fromSeries.baseId);
    const seriesMature = fromSeries.seriesIsMature;

    const _fyTokenToBuy = fyTokenForMint(
      toSeries.baseReserves,
      toSeries.fyTokenRealReserves,
      toSeries.fyTokenReserves,
      _input,
      toSeries.getTimeTillMaturity()
    );

    const permits: ICallData[] = await sign(
      [
        /* BEFORE MATURITY */
        {
          // router.forwardPermitAction(pool.address, pool.address, router.address, allowance, deadline, v, r, s )
          target: {
            id: fromSeries.id,
            address: fromSeries.poolAddress,
            name: fromSeries.poolName,
            version: fromSeries.poolVersion,
          },
          spender: 'LADLE',
          series: fromSeries,
          message: 'Signing ERC20 Token approval',
          ignoreIf: seriesMature,
        },
        
        /* AFTER MATURITY */
        {
          // ladle.forwardPermitAction(seriesId, false, ladle.address, allowance, deadline, v, r, s)
          target: fromSeries,
          spender: 'LADLE',
          series: fromSeries,
          message: 'Signing ERC20 Token approval',
          ignoreIf: !fromSeries.seriesIsMature,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      /* BEFORE MATURITY */

      {
        // router.transferToPool(base.address, fyToken1.address, pool1.address, WAD)
        operation: LadleActions.Fn.TRANSFER,
        args: [
          // fromSeries.getBaseAddress(),
          fromSeries.fyTokenAddress,
          fromSeries.poolAddress,
          _input,
        ] as LadleActions.Args.TRANSFER,
        ignoreIf: seriesMature,
      },
      {
        // router.burnForBase(pool.address, pool2.address, minBaseReceived)
        operation: LadleActions.Fn.ROUTE,
        args: [toSeries.poolAddress, _input] as RoutedActions.Args.BURN_FOR_BASE,
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        targetContract: fromSeries.poolContract,
        ignoreIf: seriesMature,
      },
      {
        // router.mintWithBase( base.address, fyToken2.address, receiver, fyTokenToBuy, minLPReceived)
        operation: LadleActions.Fn.ROUTE,
        args: [account, _fyTokenToBuy, ethers.constants.Zero] as RoutedActions.Args.MINT_WITH_BASE,
        fnName: RoutedActions.Fn.MINT_WITH_BASE,
        targetContract: toSeries.poolContract,
        ignoreIf: seriesMature,
      },

      /* AFTER MATURITY */

      {
        // ladle.transferToFYTokenAction(seriesId, fyTokenToRoll)
        operation: LadleActions.Fn.TRANSFER,
        args: [account, fromSeries.id, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: !fromSeries.seriesIsMature,
      },
      {
        // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
        operation: LadleActions.Fn.REDEEM,
        args: [toSeries.poolAddress, _input] as LadleActions.Args.REDEEM,
        ignoreIf: !fromSeries.seriesIsMature,
      },
      {
        // ladle.mintWithBase(series2Id, receiver, fyTokenToBuy, minLPReceived),
        operation: LadleActions.Fn.ROUTE,
        args: [account, _input, ethers.constants.Zero] as RoutedActions.Args.MINT_WITH_BASE,
        fnName: RoutedActions.Fn.MINT_WITH_BASE,
        targetContract: toSeries.poolContract,
        ignoreIf: !seriesMature,
      },
    ];

    await transact(calls, txCode);
    updateSeries([fromSeries, toSeries]);
    updateAssets([base]);
  };

  return rollLiquidity;
};
