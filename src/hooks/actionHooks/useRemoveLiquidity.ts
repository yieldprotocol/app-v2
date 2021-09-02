import { ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';
import { ChainContext } from '../../contexts/ChainContext';

export const usePool = (input: string | undefined) => {
  const poolMax = input;
  return { poolMax };
};

/* Hook for chain transactions */
export const useRemoveLiquidity = () => {
  const {
    chainState: { strategyRootMap, contractMap },
  } = useContext(ChainContext);
  const ladleAddress = contractMap?.get('Ladle')?.address;

  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, assetMap, selectedStrategyAddr } = userState;
  const { updateSeries, updateAssets } = userActions;
  const { sign, transact } = useChain();

  const removeLiquidity = async (input: string, series: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_LIQUIDITY, series.id);

    const base = assetMap.get(series.baseId);
    const _input = ethers.utils.parseUnits(input, base.decimals);

    const _strategy = strategyRootMap.get(selectedStrategyAddr);

    const permits: ICallData[] = await sign(
      [
        /* give strategy permission to sell tokens to pool */
        {
          // router.forwardPermitAction(strategy, ladle, strategyTokensBurnt, deadline, v, r, s),
          target: _strategy,
          spender: 'LADLE',
          message: 'Authorize moving tokens out of the strategy',
          ignoreIf: !_strategy,
          asRoute: true,
        },

        /* give pool permission to sell tokens */
        {
          // router.forwardPermitAction(pool.address, pool.address, router.address, allowance, deadline, v, r, s),
          target: {
            address: series.poolAddress,
            name: series.poolName,
            version: series.poolVersion,
            symbol: series.poolSymbol,
          },
          spender: 'LADLE',
          message: 'Authorize selling of LP tokens ',
          ignoreIf: false,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      /* FIRST BURN STRATEGY BURNING if strategy address is provided, and is found in the strategyMap, use that address */

      // ladle.forwardPermitAction(
      //   strategy, ladle, strategyTokensBurnt, deadline, v, r, s
      // ),
      // ladle.transferAction(strategy, strategy, strategyTokensBurnt),
      // ladle.routeAction(strategy, ['burn', [pool, 0]),
      // ladle.routeAction(pool, ['burn', [ladle, ladle, minBaseReceived, minFYTokenReceived]),

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [selectedStrategyAddr, selectedStrategyAddr, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: !_strategy,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
        targetContract: _strategy.strategyContract,
        ignoreIf: !_strategy,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [ladleAddress, ladleAddress, '0', '0'] as RoutedActions.Args.BURN_POOL_TOKENS, // TODO minimuums
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: !_strategy,
      },

      /* ALL REMOVES FIRST USE : */

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [series.poolAddress, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: series.seriesIsMature, // ALL 'removeLiquidity methods' use this tx
      },

      /* BEFORE MATURITY */

      /* OPTION 1. Remove liquidity and repay - BEFORE MATURITY  */
      // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
      // ladle.routeAction(pool, ['burn', [ladle, ladle, minBaseReceived, minFYTokenReceived]),
      // ladle.repayFromLadleAction(vaultId, receiver),
      // ladle.closeFromLadleAction(vaultId, receiver),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          ladleAddress,
          ladleAddress,
          ethers.constants.Zero,
          ethers.constants.Zero,
        ] as RoutedActions.Args.BURN_POOL_TOKENS, // TODO slippage
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: true || series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.REPAY_FROM_LADLE,
        args: ['vaultId', account] as LadleActions.Args.REPAY_FROM_LADLE, // TODO slippage
        ignoreIf: true || series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.CLOSE_FROM_LADLE,
        args: ['vaultId', account] as LadleActions.Args.CLOSE_FROM_LADLE, // TODO slippage
        ignoreIf: true || series.seriesIsMature,
      },

      /* OPTION 2.Remove liquidity, repay and sell - BEFORE MATURITY */
      // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
      // ladle.routeAction(pool, ['burn', [receiver, ladle, 0, 0]),
      // ladle.repayFromLadleAction(vaultId, pool),
      // ladle.routeAction(pool, ['sellBase', [receiver, minBaseReceived]),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          account,
          ladleAddress,
          ethers.constants.Zero,
          ethers.constants.Zero,
        ] as RoutedActions.Args.BURN_POOL_TOKENS,
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: true || series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.REPAY_FROM_LADLE,
        args: ['vaultId', account] as LadleActions.Args.REPAY_FROM_LADLE,
        ignoreIf: true || series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.SELL_BASE, // TODO slippage
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract: series.poolContract,
        ignoreIf: true || series.seriesIsMature,
      },

      /* OPTION 4. Remove Liquidity and sell  - BEFORE MATURITY */
      // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
      // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.BURN_FOR_BASE, // TODO slippage
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        targetContract: series.poolContract,
        ignoreIf: series.seriesIsMature,
      },

      /* AFTER MATURITY REMOVES */

      /* OPTION 3. remove Liquidity and redeem  - AFTER MATURITY */
      // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
      // ladle.routeAction(pool, ['burn', [receiver, fyToken, minBaseReceived, minFYTokenReceived]),
      // ladle.redeemAction(seriesId, receiver, 0),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          account,
          series.fyTokenAddress,
          ethers.constants.Zero,
          ethers.constants.Zero,
        ] as RoutedActions.Args.BURN_POOL_TOKENS, // TODO slippages
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: !series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, account, '0'] as LadleActions.Args.REDEEM, // TODO slippage
        ignoreIf: !series.seriesIsMature,
      },

      /* OPTION 5. remove Liquidity, redeem and Close - AFTER MATURITY */
      // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
      // ladle.routeAction(pool, ['burn', [ladle, fyToken, minBaseReceived, minFYTokenReceived]),
      // ladle.redeemAction(seriesId, ladle, 0),
      // ladle.closeFromLadleAction(vaultId, receiver),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          ladleAddress,
          series.fyTokenAddress,
          ethers.constants.Zero,
          ethers.constants.Zero,
        ] as RoutedActions.Args.BURN_POOL_TOKENS, // TODO slippages
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: !series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.BURN_FOR_BASE, // TODO slippage
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        targetContract: series.poolContract,
        ignoreIf: !series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, ladleAddress, '0'] as LadleActions.Args.REDEEM, // TODO slippage
        ignoreIf: !series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.CLOSE_FROM_LADLE,
        args: ['vaultId', account] as LadleActions.Args.CLOSE_FROM_LADLE, // TODO slippage
        ignoreIf: !series.seriesIsMature,
      },

    ];

    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };

  return removeLiquidity;
};
