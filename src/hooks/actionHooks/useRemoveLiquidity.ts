import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import {
  burn,
  burnFromStrategy,
  calcPoolRatios,
  calculateSlippage,
  newPoolState,
  sellFYToken,
} from '@yield-protocol/ui-math';

import { formatUnits } from 'ethers/lib/utils';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions, IVault, IAsset } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { TxContext } from '../../contexts/TxContext';
import { HistoryContext } from '../../contexts/HistoryContext';
import { ONE_BN, WAD_BN, ZERO_BN } from '../../utils/constants';
import { ETH_BASED_ASSETS, WETH } from '../../config/assets';
import { useAddRemoveEth } from './useAddRemoveEth';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useProvider, useBalance, Address } from 'wagmi';
import useContracts from '../useContracts';
import { StrategyV2__factory, StrategyV2_1__factory, } from '../../contracts';
import { StrategyType } from '../../config/strategies';
import useAccountPlus from '../useAccountPlus';
import { ContractNames } from '../../config/contracts';
import useAllowAction from '../useAllowAction';
import { AssertActions, useAssert } from './useAssert';
import { min } from 'date-fns';
import useChainId from '../useChainId';
import { useChain } from '../useChain';

/*
                                                                            +---------+  DEFUNCT PATH
                                                                       +--> |OPTION 2.1 |  (unique call: SELL_FYTOKEN) 
                                       Repay from ladle              NEVER  |    +---------+
                                                                       |
                                 +------------------> sell Token supported (> fytoken left >0 && selltoken supported)
                                 |Y                                    |
                                 |                               Y/  N |    +--------------------+
               +------> FyTokenRecieved > 0                                 +--->|OPTION 2.2 (no trade) | (unique call: none of others) 
               |                 |                    +-----------+         +--------------------+
               |Y                +------------------> | OPTION 1  |
               |                  N                   +-----------+
               |                                             (unique call: CLOSE_FROM_LADLE)
    +----> has Vault?
    |N         |        +--------+
    |          +------> |OPTION 4|.  ----------> (unique call: BURN_FOR_BASE)
is Mature?        N     +--------+
    |
    |
    |Y         +-----------+
    +--------->| OPTION 3  | (unique call: REDEEM)
               +-----------+
 */

export const useRemoveLiquidity = () => {
  const provider = useProvider();
  const { address: account } = useAccountPlus();

  const { userState, userActions } = useContext(UserContext);
  const { assetMap, selectedStrategy, selectedBase } = userState;

  const { updateSeries, updateAssets, updateStrategies } = userActions;
  const { sign, transact } = useChain();
  const { removeEth } = useAddRemoveEth();
  const { isActionAllowed } = useAllowAction();

  const chainId = useChainId();

  const contracts = useContracts();
  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.address as Address,
  });
  const { refetch: refetchStrategyBal } = useBalance({
    address: account,
    token: selectedStrategy?.address as Address,
  });

  const {
    historyActions: { updateStrategyHistory },
  } = useContext(HistoryContext);

  const removeLiquidity = async (input: string, series: ISeries, matchingVault: IVault | undefined) => {

    if (!contracts) return;

    if (!isActionAllowed(ActionCodes.REMOVE_LIQUIDITY, series))
      return console.error('useRemoveLiquidity: action not allowed'); // return if action is not allowed

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_LIQUIDITY, series.id);

    const _base: IAsset = assetMap?.get(series.baseId)!;
    const _strategy: any = selectedStrategy!;
    const _input = ethers.utils.parseUnits(input, _base.decimals);

    if (chainId === 1 && _strategy.type !== StrategyType.V2_1 ) {
      console.error('UPGRADE TO V2.1 REQUIRED');
      return;
    };

    const associated_V2_Contract = _strategy.associatedStrategy?.V2
      ? StrategyV2__factory.connect(_strategy.associatedStrategy.V2, provider)
      : undefined;

    const associated_V2_1_Contract = _strategy.associatedStrategy?.V2_1
      ? StrategyV2_1__factory.connect(_strategy.associatedStrategy.V2_1, provider)
      : undefined;

    // const currentPoolContract = Pool__factory.connect(_strategy.currentPoolAddr, provider)

    /* some saftey */
    if (associated_V2_Contract === undefined && _strategy.type === StrategyType.V1)
      return console.error('useRemoveLiquidity: associated_V2_Contract is undefined and strategy is V1'); // abort if strat 1 and no associated v2 strategy
    if (associated_V2_1_Contract === undefined && _strategy.type !== StrategyType.V2_1)
      return console.error('useRemoveLiquidity: associated_V2_1_Contract is undefined and strategy is not V2_1'); // abort if not strat 2.1 and no associated strategy

    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;

    // console.log( currentPoolContract )

    // const [[cachedSharesReserves, cachedFyTokenReserves], totalSupply] = await Promise.all([
    //   currentPoolContract.getCache(),
    //   currentPoolContract.totalSupply(),
    // ]);
    // const cachedRealReserves = cachedFyTokenReserves.sub(totalSupply.sub(ONE_BN));
    // const [minRatio, maxRatio] = calcPoolRatios(cachedSharesReserves, cachedRealReserves);
    
    // const lpReceived = burnFromStrategy(_strategy.poolTotalSupply!, _strategy.strategyTotalSupply!, _input);
    // const [_sharesReceived, _fyTokenReceived] = burn(cachedSharesReserves, cachedRealReserves, totalSupply, lpReceived);

    // const _newPool = newPoolState(
    //   _sharesReceived.mul(-1),
    //   _fyTokenReceived.mul(-1),
    //   cachedSharesReserves,
    //   cachedFyTokenReserves,
    //   totalSupply
    // );

    /**
     * Without vault
     */
    /** without vault, assess if we can call burnForBase (auto sell fyToken to shares) 
    **/
    // const fyTokenTrade = sellFYToken(
    //   _newPool.sharesReserves,
    //   _newPool.fyTokenVirtualReserves,
    //   _fyTokenReceived,
    //   getTimeTillMaturity(series.maturity),
    //   series.ts,
    //   series.g2,
    //   series.decimals,
    //   series.c,
    //   series.mu
    // );
    // const burnForBaseSupported = fyTokenTrade.gt(ethers.constants.Zero);

    /**
     * With vault
     */
    // const matchingVaultId: string | undefined = matchingVault?.id;
    // const matchingVaultDebt: BigNumber = matchingVault?.accruedArt || ZERO_BN;

    // Choose use matching vault:
    // const useMatchingVault: boolean = !!matchingVault && matchingVaultDebt.gt(ethers.constants.Zero);
    // const fyTokenReceivedGreaterThanDebt: boolean = _fyTokenReceived.gt(matchingVaultDebt); // i.e. debt below fytoken

    /** if user has matching vault debt
    // estimate if we can sell fyToken after repaying vault debt
    // use the difference between the amount of fyToken received from burn and debt (which is repaid) to assess whether we can call sell
    // potentially use network preview here to be more exact
    **/
    // const extrafyTokenTrade = sellFYToken(
    //   _newPool.sharesReserves,
    //   _newPool.fyTokenVirtualReserves,
    //   _fyTokenReceived.sub(matchingVaultDebt),
    //   getTimeTillMaturity(series.maturity),
    //   series.ts,
    //   series.g2,
    //   series.decimals,
    //   series.c,
    //   series.mu
    // );

    /* if extra fyToken trade is possible, estimate min base user to receive (convert shares to base) */
    // const minBaseToReceive = calculateSlippage(series.getBase(extrafyTokenTrade), slippageTolerance.toString(), true);
    
    /* if extra trade is possible (extraTrade > 0), we can auto sell fyToken after burning lp tokens and getting back excess (greater than vault debt) fyToken */
    // const extraTradeSupported = extrafyTokenTrade.gt(ethers.constants.Zero) && useMatchingVault;

    const alreadyApprovedStrategy = _strategy
      ? (await _strategy.strategyContract.allowance(account!, ladleAddress)).gte(_input)
      : false;
    const alreadyApprovedPool = !_strategy
      ? (await series.poolContract.allowance(account!, ladleAddress!)).gte(_input)
      : false;

    const isEthBase = ETH_BASED_ASSETS.includes(_base.proxyId);
    const toAddress = isEthBase ? ladleAddress : account;

    /** when the user has a vault and the fyToken received from burn is greater than debt,
    if extra trade is supported after repaying debt,
    then we send fyToken to the pool to sell
    else we give the fyTokens back to the user directly
    **/
    // const repayToAddress = extraTradeSupported ? series.poolAddress : account;

    /* handle removing eth Base tokens:  */
    // NOTE: REMOVE ETH FOR ALL PATHS/OPTIONS (exit_ether sweeps all the eth out the ladle, so exact amount is not important -> just greater than zero)
    const removeEthCallData: ICallData[] = isEthBase ? removeEth(ONE_BN) : [];
    const permitCallData: ICallData[] = await sign(
      [
        /* Give strategy permission to sell tokens to pool */
        {
          target: _strategy,
          spender: 'LADLE',
          amount: _input,
          ignoreIf: !_strategy || alreadyApprovedStrategy === true,
        },

        /* Give pool permission to sell tokens */
        {
          target: {
            address: series.poolAddress,
            name: series.poolName,
            version: '1',
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
      ...permitCallData,

      /* FOR ALL REMOVES NOT USING STRATEGY */
      // {
      //   operation: LadleActions.Fn.TRANSFER,
      //   args: [series.poolAddress, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
      //   ignoreIf: _strategy || series.seriesIsMature,
      // },

      /* FOR ALL REMOVES (when using a STRATEGY) > move tokens from strategy */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_strategy.address, _strategy.address, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: !_strategy,
      },

      /**
       * MIGRATE FROM V1 STRATEGY
       * If removing from a V1 strategy, we need to
       * 1. burn the tokens to the associated v2 strategy
       * 2. burn v2 strategies to the associated v2.1 strategy
       * */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [_strategy.associatedStrategy?.V2] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
        targetContract: _strategy.strategyContract, // v1 in this case
        ignoreIf: !_strategy || _strategy.type !== StrategyType.V1,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [_strategy.associatedStrategy?.V2_1] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
        targetContract: associated_V2_Contract,
        ignoreIf: !_strategy || _strategy.type !== StrategyType.V1,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        // args: [_strategy.currentPoolAddr] as RoutedActions.Args.BURN_STRATEGY_TOKENS, 
        args: [toAddress] as RoutedActions.Args.BURN_STRATEGY_TOKENS, 
        fnName: RoutedActions.Fn.BURN_DIVESTED,
        targetContract: associated_V2_1_Contract,
        ignoreIf: !_strategy || _strategy.type !== StrategyType.V1,
      },

      /**
       * MIGRATE FROM V2 STRATEGY
       * If removing from a V2 strategy, we need to
       * 1. burn v2 strategies to the associated v2.1 strategy
       * */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [_strategy.associatedStrategy?.V2_1] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
        targetContract: _strategy.strategyContract, // v2 in this case
        ignoreIf: !_strategy || _strategy.type !== StrategyType.V2,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        // args: [_strategy.currentPoolAddr] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        args: [toAddress] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_DIVESTED,
        targetContract: associated_V2_1_Contract,
        ignoreIf: !_strategy || _strategy.type !== StrategyType.V2,
      },

      /**
       * If removing DIRECTLY from a V2.1 strategy, simply burn from strategy to the pool address / user address
       * */
      {
        operation: LadleActions.Fn.ROUTE,
        // args: [series.poolAddress] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        args: [toAddress] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_DIVESTED,
        targetContract: _strategy.strategyContract, // v2.1 in this case
        ignoreIf: !_strategy || _strategy.type !== StrategyType.V2_1,
      },


      /**
       *
       * BEFORE MATURITY
       *
       * */

      /** 
       *  OPTION 1. Remove liquidity and repay - BEFORE MATURITY + VAULT + FYTOKEN < DEBT
       * ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
          ladle.routeAction(pool, ['burn', [ladle, ladle, minBaseReceived, minFYTokenReceived]),
          ladle.repayFromLadleAction(vaultId, receiver),
          ladle.closeFromLadleAction(vaultId, receiver),
         **/
      
      // {
      //   operation: LadleActions.Fn.ROUTE,
      //   args: [ladleAddress, ladleAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
      //   fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
      //   targetContract: series.poolContract,
      //   ignoreIf: series.seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      // },
      // {
      //   operation: LadleActions.Fn.REPAY_FROM_LADLE,
      //   args: [matchingVaultId, toAddress] as LadleActions.Args.REPAY_FROM_LADLE,
      //   ignoreIf: series.seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      // },
      // {
      //   operation: LadleActions.Fn.CLOSE_FROM_LADLE,
      //   args: [matchingVaultId, toAddress] as LadleActions.Args.CLOSE_FROM_LADLE,
      //   ignoreIf: series.seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      // },

      /* OPTION 2.Remove liquidity, repay and sell - BEFORE MATURITY + VAULT + FYTOKEN > DEBT */

       /** 
        * 2.1 doTrade 2.2 !doTrade
        *  ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
       ladle.routeAction(pool, ['burn', [receiver, ladle, 0, 0]),
      ladle.repayFromLadleAction(vaultId, pool),
      ladle.routeAction(pool, ['sellFYToken', [receiver, minBaseReceived]),
      **/
      
      // {
      //   operation: LadleActions.Fn.ROUTE,
      //   args: [toAddress, ladleAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
      //   fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
      //   targetContract: series.poolContract,
      //   ignoreIf: series.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      // },

      // {
      //   operation: LadleActions.Fn.REPAY_FROM_LADLE,
      //   args: [matchingVaultId, toAddress] as LadleActions.Args.REPAY_FROM_LADLE,
      //   ignoreIf: series.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      // },

      // {
      //   operation: LadleActions.Fn.ROUTE,
      //   args: [toAddress, minBaseToReceive] as RoutedActions.Args.SELL_FYTOKEN,
      //   fnName: RoutedActions.Fn.SELL_FYTOKEN,
      //   targetContract: series.poolContract,
      //   ignoreIf: series.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault || !extraTradeSupported,
      // },

      /* PATCH!!! if removing ETH-BASE, retrieve fyETH as to not leave it in the ladle  */
      // {
      //   operation: LadleActions.Fn.RETRIEVE,
      //   args: [series.address, account] as LadleActions.Args.RETRIEVE,
      //   ignoreIf: series.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault || !isEthBase,
      // },

      /* OPTION 4. Remove Liquidity and sell - BEFORE MATURITY + NO VAULT */

       /**  4.1
       ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
       ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
      **/
      
      // {
      //   operation: LadleActions.Fn.ROUTE,
      //   args: [toAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_FOR_BASE,
      //   fnName: RoutedActions.Fn.BURN_FOR_BASE,
      //   targetContract: series.poolContract,
      //   ignoreIf: series.seriesIsMature || useMatchingVault || !burnForBaseSupported,
      // },

      /**  4.2
       ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
       ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
      **/
      
      // {
      //   operation: LadleActions.Fn.ROUTE,
      //   args: [toAddress, account, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
      //   fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
      //   targetContract: series.poolContract,
      //   ignoreIf: series.seriesIsMature || useMatchingVault || burnForBaseSupported,
      // },

      /**
       *
       * AFTER MATURITY
       *
       * */

      /* OPTION 3. remove Liquidity and redeem  - AFTER MATURITY */ // FIRST CHOICE after maturity

      /* ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
      // ladle.routeAction(pool, ['burn', [receiver, fyToken, minBaseReceived, minFYTokenReceived]),
      // ladle.redeemAction(seriesId, receiver, 0),
      **/

      // {
      //   operation: LadleActions.Fn.ROUTE,
      //   args: [toAddress, series.address, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
      //   fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
      //   targetContract: currentPoolContract, 
      //   ignoreIf: !series.seriesIsMature,
      // },
      // {
      //   operation: LadleActions.Fn.REDEEM,
      //   args: [series.id, toAddress, '0'] as LadleActions.Args.REDEEM,
      //   ignoreIf: !series.seriesIsMature,
      // },

      ...removeEthCallData,
    ];

    await transact(calls, txCode);

    /* Isolate a particular user case if required */
    // if (true) {
    //   toast.warn('Liquidity withdrawal temporarily disabled')
    //   resetProcess(txCode);
    // } else {
    //   await transact(calls, txCode);
    // }

    if (selectedBase?.proxyId !== WETH) refetchBaseBal();
    refetchStrategyBal();
    updateSeries([series]);
    updateAssets([_base]);
    updateStrategies([_strategy]);
    updateStrategyHistory([_strategy]);
  };



  return removeLiquidity;
};
