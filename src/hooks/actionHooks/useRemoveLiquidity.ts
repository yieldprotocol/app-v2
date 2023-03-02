import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import {
  burn,
  burnFromStrategy,
  calcPoolRatios,
  calculateSlippage,
  newPoolState,
  sellFYToken,
  WAD_BN,
} from '@yield-protocol/ui-math';

import { formatUnits } from 'ethers/lib/utils';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions, IVault, IAsset } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';
import { TxContext } from '../../contexts/TxContext';
import { HistoryContext } from '../../contexts/HistoryContext';
import { ONE_BN, ZERO_BN } from '../../utils/constants';
import { ETH_BASED_ASSETS, WETH } from '../../config/assets';
import { useAddRemoveEth } from './useAddRemoveEth';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useAccount, useProvider, useBalance, Address } from 'wagmi';
import useContracts, { ContractNames } from '../useContracts';
import { Strategy__factory } from '../../contracts';
import { StrategyType } from '../../config/strategies';
import useAccountPlus from '../useAccountPlus';
import { AssertActions, useAssert } from './useAssert';

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

  const { txActions } = useContext(TxContext);
  const { resetProcess } = txActions;

  const { userState, userActions } = useContext(UserContext);
  const { assetMap, selectedStrategy, selectedBase } = userState;

  const { updateSeries, updateAssets, updateStrategies } = userActions;
  const { sign, transact } = useChain();
  const { removeEth } = useAddRemoveEth();
  const { getTimeTillMaturity } = useTimeTillMaturity();

  const { assert, encodeBalanceCall } = useAssert();

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

  const {
    settingsState: { diagnostics, slippageTolerance },
  } = useContext(SettingsContext);

  const removeLiquidity = async (input: string, series: ISeries, matchingVault: IVault | undefined) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_LIQUIDITY, series.id);

    const _base: IAsset = assetMap?.get(series.baseId)!;
    const _strategy: any = selectedStrategy!;
    const _input = ethers.utils.parseUnits(input, _base.decimals);

    const _associatedStrategyContract = _strategy.associatedStrategy
      ? Strategy__factory.connect(_strategy.associatedStrategy, provider)
      : undefined;

    // const ladleAddress = contractMap.get('Ladle').address;
    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;

    const [[cachedSharesReserves, cachedFyTokenReserves], totalSupply] = await Promise.all([
      series.poolContract.getCache(),
      series.poolContract.totalSupply(),
    ]);
    const cachedRealReserves = cachedFyTokenReserves.sub(totalSupply.sub(ONE_BN));
    const [minRatio, maxRatio] = calcPoolRatios(cachedSharesReserves, cachedRealReserves);
    const lpReceived = burnFromStrategy(_strategy.poolTotalSupply!, _strategy.strategyTotalSupply!, _input);
    const [_sharesReceived, _fyTokenReceived] = burn(cachedSharesReserves, cachedRealReserves, totalSupply, lpReceived);

    const _newPool = newPoolState(
      _sharesReceived.mul(-1),
      _fyTokenReceived.mul(-1),
      cachedSharesReserves,
      cachedFyTokenReserves,
      totalSupply
    );

    /**
     * Without vault
     */
    // without vault, assess if we can call burnForBase (auto sell fyToken to shares)
    const fyTokenTrade = sellFYToken(
      _newPool.sharesReserves,
      _newPool.fyTokenVirtualReserves,
      _fyTokenReceived,
      getTimeTillMaturity(series.maturity),
      series.ts,
      series.g2,
      series.decimals,
      series.c,
      series.mu
    );

    const burnForBaseSupported = fyTokenTrade.gt(ethers.constants.Zero);

    /**
     * With vault
     */
    const matchingVaultId: string | undefined = matchingVault?.id;
    const matchingVaultDebt: BigNumber = matchingVault?.accruedArt || ZERO_BN;

    // Choose use matching vault:
    const useMatchingVault: boolean = !!matchingVault && matchingVaultDebt.gt(ethers.constants.Zero);

    const fyTokenReceivedGreaterThanDebt: boolean = _fyTokenReceived.gt(matchingVaultDebt); // i.e. debt below fytoken

    // if user has matching vault debt
    // estimate if we can sell fyToken after repaying vault debt
    // use the difference between the amount of fyToken received from burn and debt (which is repaid) to assess whether we can call sell
    // potentially use network preview here to be more exact
    const extrafyTokenTrade = sellFYToken(
      _newPool.sharesReserves,
      _newPool.fyTokenVirtualReserves,
      _fyTokenReceived.sub(matchingVaultDebt),
      getTimeTillMaturity(series.maturity),
      series.ts,
      series.g2,
      series.decimals,
      series.c,
      series.mu
    );

    // if extra fyToken trade is possible, estimate min base user to receive (convert shares to base)
    const minBaseToReceive = calculateSlippage(series.getBase(extrafyTokenTrade), slippageTolerance.toString(), true);
    /* if extra trade is possible (extraTrade > 0), we can auto sell fyToken after burning lp tokens and getting back excess (greater than vault debt) fyToken */
    const extraTradeSupported = extrafyTokenTrade.gt(ethers.constants.Zero) && useMatchingVault;

    /* Diagnostics parsed into without and with vault scenarios */
    !useMatchingVault &&
      diagnostics &&
      console.log(
        '\n',
        'Strategy: ',
        _strategy,
        '\n',
        '\n',
        'fyTokenTrade estimated value...',
        '\n',
        'to check if we can call burnForBase: ',
        formatUnits(fyTokenTrade, series.decimals),
        '\n',
        'burnForBase supported (without vault debt): ',
        burnForBaseSupported,
        '\n',
        'input: ',
        formatUnits(_input, series.decimals),
        '\n',
        'lpTokens received from strategy token burn: ',
        formatUnits(lpReceived, series.decimals),
        '\n',
        'fyToken received from lpToken burn: ',
        formatUnits(_fyTokenReceived, series.decimals),
        '\n',
        'base received from lpToken burn: ',
        formatUnits(series.getBase(_sharesReceived), series.decimals)
      );

    useMatchingVault &&
      diagnostics &&
      console.log(
        '\n',
        'Strategy: ',
        _strategy,
        '\n',
        '\n',
        'extraFyTokenTrade (fyTokenReceived minus debt) estimated value...',
        '\n',
        'to check if we can sell fyToken (with vault debt): ',
        formatUnits(extrafyTokenTrade, series.decimals),
        '\n',
        'sellFyToken supported with vault debt: ',
        extraTradeSupported,
        '\n',
        'Vault to use for removal: ',
        matchingVaultId,
        '\n',
        'vaultDebt: ',
        formatUnits(matchingVaultDebt, series.decimals),
        '\n',
        'input: ',
        formatUnits(_input, series.decimals),
        '\n',
        'lpTokens received from strategy token burn: ',
        formatUnits(lpReceived, series.decimals),
        '\n',
        'fyToken received from lpToken burn: ',
        formatUnits(_fyTokenReceived, series.decimals),
        '\n',
        'base received from lpToken burn: ',
        formatUnits(series.getBase(_sharesReceived), series.decimals),
        '\n',
        'debt: ',
        formatUnits(matchingVaultDebt, series.decimals),
        '\n',
        'Is FyToken Received Greater Than Debt: ',
        fyTokenReceivedGreaterThanDebt,
        '\n',
        'Is FyToken tradable after repaying vault debt?: ',
        extraTradeSupported,
        '\n',
        'extrafyTokentrade value (in base): ',
        formatUnits(series.getBase(extrafyTokenTrade), series.decimals)
      );

    const alreadyApprovedStrategy = _strategy
      ? (await _strategy.strategyContract.allowance(account!, ladleAddress)).gte(_input)
      : false;
    const alreadyApprovedPool = !_strategy
      ? (await series.poolContract.allowance(account!, ladleAddress!)).gte(_input)
      : false;

    const isEthBase = ETH_BASED_ASSETS.includes(_base.proxyId);
    const toAddress = isEthBase ? ladleAddress : account;

    // when the user has a vault and the fyToken received from burn is greater than debt,
    // if extra trade is supported after repaying debt,
    // then we send fyToken to the pool to sell
    // else we give the fyTokens back to the user directly
    const repayToAddress = extraTradeSupported ? series.poolAddress : account;

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

    /* Add in an Assert call : Base received + fyToken received within 10% of strategy tokens held.   */
    const assertCallData_base: ICallData[] = assert(
      _base.address,
      encodeBalanceCall(_base.address, _base.tokenIdentifier),
      AssertActions.Fn.ASSERT_EQ_REL,
      _base.balance!.add( series.getBase(_sharesReceived) ),
      WAD_BN.mul('10') // 10% relative tolerance
    );
    /* Add in an Assert call : Base received + fyToken received within 10% of strategy tokens held.   */
    const assertCallData_fyToken: ICallData[] = _fyTokenReceived.gt(ZERO_BN) ? assert(
      series.address,
      encodeBalanceCall(series.address, undefined),
      AssertActions.Fn.ASSERT_EQ_REL,
      series.fyTokenBalance!.add(_fyTokenReceived),
      WAD_BN.mul('10') // 10% relative tolerance
    ) : [];

    // const unwrapping: ICallData[] = await unwrapAsset(_base, account)
    const calls: ICallData[] = [
      ...permitCallData,

      /* FOR ALL REMOVES NOT USING STRATEGY */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [series.poolAddress, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: _strategy || series.seriesIsMature,
      },

      /* FOR ALL REMOVES (when using a STRATEGY) > move tokens from strategy to pool tokens  */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_strategy.address, _strategy.address, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: !_strategy,
      },

      /** If removing from a V1 strategy, we need to burn the tokens to either the associated v2 strategy or the pool if the is no associatedStrategy */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [_strategy.associatedStrategy || series.poolAddress] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
        targetContract: _strategy.strategyContract,
        ignoreIf: !_strategy || _strategy.type === StrategyType.V2,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [series.poolAddress] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
        targetContract: _associatedStrategyContract,
        ignoreIf: !_strategy || _strategy.type === StrategyType.V2 || !_associatedStrategyContract,
      },

      /* If removing from a V2 strategy, simply burn fromm strategy to the pool address */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [series.poolAddress] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
        targetContract: _strategy.strategyContract,
        ignoreIf: !_strategy || _strategy.type === StrategyType.V1,
      },

      /**
       *
       * BEFORE MATURITY
       *
       * */

      /* OPTION 1. Remove liquidity and repay - BEFORE MATURITY + VAULT + FYTOKEN < DEBT */

      // ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
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
        args: [matchingVaultId, toAddress] as LadleActions.Args.REPAY_FROM_LADLE,
        ignoreIf: series.seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },
      {
        operation: LadleActions.Fn.CLOSE_FROM_LADLE,
        args: [matchingVaultId, toAddress] as LadleActions.Args.CLOSE_FROM_LADLE,
        ignoreIf: series.seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },

      /* OPTION 2.Remove liquidity, repay and sell - BEFORE MATURITY + VAULT + FYTOKEN > DEBT */

      // 2.1 doTrade 2.2 !doTrade

      // ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
      // ladle.routeAction(pool, ['burn', [receiver, ladle, 0, 0]),
      // ladle.repayFromLadleAction(vaultId, pool),
      // ladle.routeAction(pool, ['sellFYToken', [receiver, minBaseReceived]),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [toAddress, ladleAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: series.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },

      {
        operation: LadleActions.Fn.REPAY_FROM_LADLE,
        args: [matchingVaultId, toAddress] as LadleActions.Args.REPAY_FROM_LADLE,
        ignoreIf: series.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },
      // {
      //   operation: LadleActions.Fn.ROUTE,
      //   args: [toAddress, minBaseToReceive] as RoutedActions.Args.SELL_FYTOKEN,
      //   fnName: RoutedActions.Fn.SELL_FYTOKEN,
      //   targetContract: series.poolContract,
      //   ignoreIf: series.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault || !extraTradeSupported,
      // },

      /* PATCH!!! if removing ETH-BASE, retrieve fyETH as to not leave it in the ladle  */
      {
        operation: LadleActions.Fn.RETRIEVE,
        args: [series.address, account] as LadleActions.Args.RETRIEVE,
        ignoreIf: series.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault || !isEthBase,
      },

      /* OPTION 4. Remove Liquidity and sell - BEFORE MATURITY + NO VAULT */

      // 4.1
      // ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
      // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [toAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_FOR_BASE,
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        targetContract: series.poolContract,
        ignoreIf: series.seriesIsMature || useMatchingVault || !burnForBaseSupported,
      },

      // 4.2
      // ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
      // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [toAddress, account, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: series.seriesIsMature || useMatchingVault || burnForBaseSupported,
      },

      /**
       *
       * AFTER MATURITY
       *
       * */

      /* OPTION 3. remove Liquidity and redeem  - AFTER MATURITY */ // FIRST CHOICE after maturity

      // ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
      // ladle.routeAction(pool, ['burn', [receiver, fyToken, minBaseReceived, minFYTokenReceived]),
      // ladle.redeemAction(seriesId, receiver, 0),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [toAddress, series.address, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: !series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, toAddress, '0'] as LadleActions.Args.REDEEM,
        ignoreIf: !series.seriesIsMature,
      },

      ...removeEthCallData,
      
      ...assertCallData_base,
      ...assertCallData_fyToken,
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
