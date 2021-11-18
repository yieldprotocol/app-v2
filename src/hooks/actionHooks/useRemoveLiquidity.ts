import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import {
  ICallData,
  ISeries,
  ActionCodes,
  LadleActions,
  RoutedActions,
  IVault,
  ISettingsContext,
  IStrategy,
  IAsset,
  IUserContext,
  IUserContextState,
  IUserContextActions,
} from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';
import { ChainContext } from '../../contexts/ChainContext';
import { HistoryContext } from '../../contexts/HistoryContext';
import { burn, burnFromStrategy, calcPoolRatios, newPoolState, sellFYToken } from '../../utils/yieldMath';
import { ZERO_BN } from '../../utils/constants';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';

/*
                                                                            +---------+  DEFUNCT PATH
                                                                       +--> |OPTION 2.1 |  ( unique call: SELL_FYTOKEN) 
                                                                NEVER  |    +---------+
                                                                       |
                                 +------------------> sell Token supported
                                 |Y                                    |
                                 |                               Y/  N |    +--------------------+
               +------> FyTokenRecieved > Debt                        +--->|OPTION 2.2 (no trade) | (unique call:  none of others ) 
               |                 |                    +-----------+         +--------------------+
               |Y                +------------------> | OPTION 1  |
               |                  N                   +-----------+
               |                                             ( unique call: CLOSE_FROM_LADLE)
    +----> has Vault?
    |N         |        +--------+
    |          +------> |OPTION 4|.  ----------> (unique call: BURN_FOR_BASE )
is Mature?        N     +--------+
    |
    |
    |Y         +-----------+
    +--------->| OPTION 3  | (unique call: REDEEM )
               +-----------+
 */

export const useRemoveLiquidity = () => {
  const {
    settingsState: { approveMax, diagnostics },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;
  const { activeAccount: account, assetMap, selectedStrategy } = userState;

  const { updateSeries, updateAssets, updateStrategies } = userActions;
  const { sign, transact } = useChain();

  const {
    historyActions: { updateStrategyHistory },
  } = useContext(HistoryContext);

  const removeLiquidity = async (
    input: string,
    series: ISeries,
    matchingVault: IVault | undefined,
    tradeFyToken: boolean = true
  ) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_LIQUIDITY, series.id);

    const _base: IAsset = assetMap.get(series.baseId)!;
    const _strategy: any = selectedStrategy!; 
    const _input = ethers.utils.parseUnits(input, _base.decimals);

    const ladleAddress = contractMap.get('Ladle').address;

    const [cachedBaseReserves, cachedFyTokenReserves] = await series.poolContract.getCache();
    const cachedRealReserves = cachedFyTokenReserves.sub(series.totalSupply);

    const lpReceived = burnFromStrategy(_strategy.poolTotalSupply!, _strategy.strategyTotalSupply!, _input);

    const [_baseTokenReceived, _fyTokenReceived] = burn(
      series.baseReserves,
      series.fyTokenRealReserves,
      series.totalSupply,
      lpReceived
    );

    const _newPool = newPoolState(
      _baseTokenReceived.mul(-1),
      _fyTokenReceived.mul(-1),
      series.baseReserves,
      series.fyTokenRealReserves,
      series.totalSupply
    );

    const fyTokenTrade = sellFYToken(
      _newPool.baseReserves,
      _newPool.fyTokenVirtualReserves,
      _fyTokenReceived,
      series.getTimeTillMaturity(),
      series.decimals
    );

    diagnostics && console.log('fyTokenTrade value: ', fyTokenTrade.toString());
    const fyTokenTradeSupported = fyTokenTrade.gt(ethers.constants.Zero);

    const matchingVaultId: string | undefined = matchingVault?.id;
    const matchingVaultDebt: BigNumber = matchingVault?.art || ZERO_BN;
    // Choose use use matching vault:
    const useMatchingVault: boolean = !!matchingVault && matchingVaultDebt.gt(ethers.constants.Zero);
    // const useMatchingVault: boolean = !!matchingVault && ( _fyTokenReceived.lte(matchingVaultDebt) || !tradeFyToken) ;

    const [minRatio, maxRatio] = calcPoolRatios(cachedBaseReserves, cachedRealReserves);
    const fyTokenReceivedGreaterThanDebt: boolean = _fyTokenReceived.gt(matchingVaultDebt); // i.e. debt below fytoken

    const extrafyTokenTrade: BigNumber = sellFYToken(
      series.baseReserves,
      series.fyTokenReserves,
      _fyTokenReceived.sub(matchingVaultDebt),
      series.getTimeTillMaturity(),
      series.decimals
    );
    /* if valid extraTrade > 0 and user selected to tradeFyToken */
    const extraTradeSupported = extrafyTokenTrade.gt(ethers.constants.Zero) && tradeFyToken;

    /* Diagnostics */
    diagnostics && console.log('Strategy: ', _strategy);
    diagnostics && console.log('Vault to use for removal: ', matchingVaultId);
    diagnostics && console.log('vaultDebt', matchingVaultDebt.toString());
    diagnostics && console.log(useMatchingVault);
    diagnostics && console.log('input', _input.toString());
    diagnostics && console.log('lpTokens recieved from strategy token burn:', lpReceived.toString());
    diagnostics && console.log('fyToken recieved from lpTokenburn: ', _fyTokenReceived.toString());
    diagnostics && console.log('Debt: ', matchingVaultDebt?.toString());
    diagnostics && console.log('Is FyToken Recieved Greater Than Debt: ', fyTokenReceivedGreaterThanDebt);
    diagnostics && console.log('Is FyToken tradable?: ', extraTradeSupported);
    diagnostics && console.log('extrafyTokentrade value: ', extrafyTokenTrade);

    const alreadyApprovedStrategy =
      approveMax && !!_strategy
        ? (await _strategy.strategyContract.allowance(account!, ladleAddress)).gt(_input)
        : false;
    const alreadyApprovedPool =
      approveMax && !_strategy ? (await series.poolContract.allowance(account!, ladleAddress)).gt(_input) : false;


    const permits: ICallData[] = await sign(
      [
        /* give strategy permission to sell tokens to pool */
        {
          target: _strategy,
          spender: 'LADLE',
          amount: _input,
          ignoreIf: !_strategy || alreadyApprovedStrategy === true,
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
          amount: _input,
          ignoreIf: !!_strategy || alreadyApprovedPool === true,
        },
      ],
      txCode
    );

    // const unwrapping: ICallData[] = await unwrapAsset(_base, account)

    const calls: ICallData[] = [
      ...permits,

      /* FOR ALL REMOVES (when using a strategy) > move tokens from strategy to pool tokens  */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_strategy.address, _strategy.address, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: !_strategy,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [series.poolAddress] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
        targetContract: _strategy ? _strategy.strategyContract : undefined,
        ignoreIf: !_strategy,
      },

      /* FOR ALL REMOVES NOT USING STRATEGY >  move tokens to poolAddress  : */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [series.poolAddress, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: _strategy || series.seriesIsMature,
      },

      /**
       *
       * BEFORE MATURITY
       *
       * */

      /* OPTION 1. Remove liquidity and repay - BEFORE MATURITY + VAULT + FYTOKEN<DEBT */

      // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
      // ladle.routeAction(pool, ['burn', [ladle, ladle, minBaseReceived, minFYTokenReceived]),
      // ladle.repayFromLadleAction(vaultId, receiver),
      // ladle.closeFromLadleAction(vaultId, receiver),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [ladleAddress, ladleAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: series.seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },
      {
        operation: LadleActions.Fn.REPAY_FROM_LADLE,
        args: [matchingVaultId, account] as LadleActions.Args.REPAY_FROM_LADLE,
        ignoreIf: series.seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },
      {
        operation: LadleActions.Fn.CLOSE_FROM_LADLE,
        args: [matchingVaultId, account] as LadleActions.Args.CLOSE_FROM_LADLE,
        ignoreIf: series.seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },

      /* OPTION 2.Remove liquidity, repay and sell - BEFORE MATURITY  + VAULT + FYTOKEN>DEBT */

      // 2.1 doTrade 2.2 !doTrade

      // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
      // ladle.routeAction(pool, ['burn', [receiver, ladle, 0, 0]),
      // ladle.repayFromLadleAction(vaultId, pool),
      // ladle.routeAction(pool, ['sellBase', [receiver, minBaseReceived]),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, ladleAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: series.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },
      {
        operation: LadleActions.Fn.REPAY_FROM_LADLE,
        args: [matchingVaultId, account] as LadleActions.Args.REPAY_FROM_LADLE,
        ignoreIf: series.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },


      /* OPTION 4. Remove Liquidity and sell  - BEFORE MATURITY +  NO VAULT */

      // 4.1
      // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
      // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, minRatio, maxRatio] as RoutedActions.Args.BURN_FOR_BASE,
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        targetContract: series.poolContract,
        ignoreIf: series.seriesIsMature || useMatchingVault || !fyTokenTradeSupported,
      },

      // 4.2
      // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
      // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, account, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: series.seriesIsMature || useMatchingVault || fyTokenTradeSupported,
      },

      /**
       *
       * AFTER MATURITY
       *
       * */

      /* OPTION 3. remove Liquidity and redeem  - AFTER MATURITY */ // FIRST CHOICE after maturity

      // (ladle.transferAction(pool, pool, lpTokensBurnt),  ^^^^ DONE ABOVE^^^^)
      // ladle.routeAction(pool, ['burn', [receiver, fyToken, minBaseReceived, minFYTokenReceived]),
      // ladle.redeemAction(seriesId, receiver, 0),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, series.fyTokenAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: !series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, account, '0'] as LadleActions.Args.REDEEM,
        ignoreIf: !series.seriesIsMature,
      },

    ];

    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([_base]);
    updateStrategies([_strategy]);
    updateStrategyHistory([_strategy]);
  };

  return removeLiquidity;
};
