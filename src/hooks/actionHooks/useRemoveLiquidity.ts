import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions, IStrategy, IVault } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';
import { ChainContext } from '../../contexts/ChainContext';
import { HistoryContext } from '../../contexts/HistoryContext';
import { buyBase, calculateSlippage, sellFYToken, splitLiquidity } from '../../utils/yieldMath';

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
  const { updateSeries, updateAssets, updateStrategies } = userActions;
  const { sign, transact } = useChain();

  const { historyActions: { updateStrategyHistory } } = useContext(HistoryContext);

  const removeLiquidity = async (input: string, series: ISeries, matchingVault: IVault|undefined ) => {
    
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_LIQUIDITY, series.id);

    const base = assetMap.get(series.baseId);
    const _input = ethers.utils.parseUnits(input, base.decimals);
    const _strategy = strategyRootMap.get(selectedStrategyAddr);

    const [_basePortion, _fyTokenPortion] =  splitLiquidity(
      series.baseReserves,
      series.fyTokenReserves,
      _input
    )

    const matchingVaultId: string|undefined = matchingVault?.id;
    const vaultDebt: BigNumber|undefined = matchingVault?.art;
    const vaultAvailable: boolean = !!matchingVault || vaultDebt?.lt(_fyTokenPortion)!; // ignore vault flag if  matchign vaults is undefined or debt less than required fyToken

    console.log(matchingVaultId, vaultDebt?.toString(), _fyTokenPortion.toString(),  );
    console.log('Strategy :', _strategy);
    console.log('Vault to use for removal :', matchingVaultId);

    const permits: ICallData[] = await sign(
      [
        /* give strategy permission to sell tokens to pool */
        {
          target: _strategy!,
          spender: 'LADLE',
          message: 'Authorize moving tokens out of the strategy',
          ignoreIf: !_strategy,
          // asRoute: true,
        },

        /* give pool permission to sell tokens */
        {
          target: {
            address: series.poolAddress,
            name: series.poolName,
            version: series.poolVersion,
            symbol: series.poolSymbol,
          },
          spender: 'LADLE',
          message: 'Authorize selling of LP tokens ',
          ignoreIf: _strategy,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      /* FOR ALL REMOVES (when using a strategy) > move tokens from stragegy to pool tokens  */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [selectedStrategyAddr, selectedStrategyAddr, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: !_strategy,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [ series.poolAddress ] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
        targetContract: _strategy ? _strategy.strategyContract : undefined,
        ignoreIf: !_strategy,
      },

      /* FOR ALL REMOVES (if not using a strategy) >  move tokens to poolAddress  : */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [series.poolAddress, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: _strategy || series.seriesIsMature,
      },

      /* BEFORE MATURITY */

      /* OPTION 1. NOT RECOMMENDED FOR NOW . Remove liquidity and repay - BEFORE MATURITY  */
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
        ignoreIf: true, // disabled
      },
      {
        operation: LadleActions.Fn.REPAY_FROM_LADLE,
        args: ['vaultId', account] as LadleActions.Args.REPAY_FROM_LADLE, // TODO slippage
        ignoreIf: true, // disabled
      },
      {
        operation: LadleActions.Fn.CLOSE_FROM_LADLE,
        args: ['vaultId', account] as LadleActions.Args.CLOSE_FROM_LADLE, // TODO slippage
        ignoreIf: true, // disabled
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
        ignoreIf: series.seriesIsMature || !vaultAvailable,
      },
      {
        operation: LadleActions.Fn.REPAY_FROM_LADLE,
        args: [matchingVaultId, account] as LadleActions.Args.REPAY_FROM_LADLE,
        ignoreIf: series.seriesIsMature || !vaultAvailable,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.SELL_FYTOKEN, // TODO slippage
        fnName: RoutedActions.Fn.SELL_FYTOKEN,
        targetContract: series.poolContract,
        ignoreIf: series.seriesIsMature || !vaultAvailable,
      },
      {
        operation: LadleActions.Fn.POUR,
        args: [matchingVaultId, account, vaultDebt?.mul(-1), ethers.constants.Zero] as LadleActions.Args.POUR,
        ignoreIf: series.seriesIsMature || !vaultAvailable,
      },

      /* OPTION 4. Remove Liquidity and sell  - BEFORE MATURITY */
      // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
      // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.BURN_FOR_BASE, // TODO slippage minBase Recieved
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        targetContract: series.poolContract,
        ignoreIf: series.seriesIsMature || vaultAvailable,
      },

      /**
       * 
       * AFTER MATURITY  ( DIRECT POOL REMOVES ONLY ) 
       * 
       * */
 
      /* OPTION 3. remove Liquidity and redeem  - AFTER MATURITY */  // FIRST CHOICE after maturity
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

      /* OPTION 5. NOT RECOMMENDEDFOR NOW  remove Liquidity, redeem and Close - AFTER MATURITY */
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
        ignoreIf: true || _strategy || !series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.BURN_FOR_BASE, // TODO slippage
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        targetContract: series.poolContract,
        ignoreIf: true || _strategy || !series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, ladleAddress, '0'] as LadleActions.Args.REDEEM, // TODO slippage
        ignoreIf: true || _strategy || !series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.CLOSE_FROM_LADLE,
        args: ['vaultId', account] as LadleActions.Args.CLOSE_FROM_LADLE, // TODO slippage
        ignoreIf: true || _strategy || !series.seriesIsMature,
      },
    ];

    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
    updateStrategies([_strategy]);
    updateStrategyHistory([_strategy]);
  };

  return removeLiquidity;
};
