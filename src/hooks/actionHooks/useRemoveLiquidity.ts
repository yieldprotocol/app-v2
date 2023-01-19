import { useSWRConfig } from 'swr';
import { ethers } from 'ethers';
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
import { ICallData, ActionCodes, LadleActions, RoutedActions, IVault } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';
import { HistoryContext } from '../../contexts/HistoryContext';
import { ONE_BN, ZERO_BN } from '../../utils/constants';
import { ETH_BASED_ASSETS } from '../../config/assets';
import { useAddRemoveEth } from './useAddRemoveEth';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useAccount } from 'wagmi';
import useContracts, { ContractNames } from '../useContracts';
import useStrategy from '../useStrategy';
import useAsset from '../useAsset';
import useVault from '../useVault';
import useSeriesEntity from '../useSeriesEntity';

/*
                                                                            +---------+  DEFUNCT PATH
                                                                       +--> |OPTION 2.1 |  (unique call: SELL_FYTOKEN) 
                                                                NEVER  |    +---------+
                                                                       |
                                 +------------------> sell Token supported
                                 |Y                                    |
                                 |                               Y/  N |    +--------------------+
               +------> FyTokenRecieved > Debt                        +--->|OPTION 2.2 (no trade) | (unique call: none of others) 
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

export const useRemoveLiquidity = (matchingVault: IVault | undefined) => {
  const { mutate } = useSWRConfig();
  const { userState } = useContext(UserContext);
  const { selectedStrategy } = userState;
  const {
    historyActions: { updateStrategyHistory },
  } = useContext(HistoryContext);
  const {
    settingsState: { diagnostics, slippageTolerance },
  } = useContext(SettingsContext);

  const { data: matchingVaultToUse, key: matchingVaultKey } = useVault(matchingVault?.id);
  const { data: seriesEntity, key: seriesEntityKey } = useSeriesEntity(selectedStrategy?.currentSeriesId!);

  const { sign, transact } = useChain();
  const { removeEth } = useAddRemoveEth();
  const { getTimeTillMaturity } = useTimeTillMaturity();

  const { data: strategy, key: strategyKey } = useStrategy(selectedStrategy?.address!);
  const { data: base, key: baseKey } = useAsset(selectedStrategy?.baseId!);
  const { address: account } = useAccount();
  const contracts = useContracts();

  const removeLiquidity = async (input: string) => {
    if (!strategy) throw new Error('no strategy detected in remove liq');
    if (!account) throw new Error('no account detected in remove liq');
    if (!base) throw new Error('no base detected in remove liq');
    if (!seriesEntity) throw new Error('no seriesEntity detected in remove liq');

    const poolTotalSupply = seriesEntity.totalSupply.value;
    const strategyTotalSupply = strategy.totalSupply.value;

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_LIQUIDITY, seriesEntity.id);

    const _input = ethers.utils.parseUnits(input, base.decimals);

    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;
    const [[cachedSharesReserves, cachedFyTokenReserves]] = await Promise.all([seriesEntity.poolContract.getCache()]);
    const cachedRealReserves = cachedFyTokenReserves.sub(poolTotalSupply.sub(ONE_BN));
    const [minRatio, maxRatio] = calcPoolRatios(cachedSharesReserves, cachedRealReserves);

    const lpReceived = burnFromStrategy(poolTotalSupply, strategyTotalSupply, _input);

    const [_sharesReceived, _fyTokenReceived] = burn(
      cachedSharesReserves,
      cachedRealReserves,
      poolTotalSupply,
      lpReceived
    );

    const _newPool = newPoolState(
      _sharesReceived.mul(-1),
      _fyTokenReceived.mul(-1),
      cachedSharesReserves,
      cachedFyTokenReserves,
      poolTotalSupply
    );

    /**
     * Without vault
     */
    // without vault, assess if we can call burnForBase (auto sell fyToken to shares)
    const fyTokenTrade = sellFYToken(
      _newPool.sharesReserves,
      _newPool.fyTokenVirtualReserves,
      _fyTokenReceived,
      getTimeTillMaturity(seriesEntity.maturity),
      seriesEntity.ts,
      seriesEntity.g2,
      seriesEntity.decimals,
      seriesEntity.c,
      seriesEntity.mu
    );

    const burnForBaseSupported = fyTokenTrade.gt(ethers.constants.Zero);

    /**
     * With vault
     */
    const matchingVaultId = matchingVaultToUse?.id;
    const matchingVaultDebt = matchingVaultToUse?.accruedArt.value || ZERO_BN;
    // Choose use matching vault:
    const useMatchingVault = !!matchingVaultToUse && matchingVaultDebt.gt(ethers.constants.Zero);

    const fyTokenReceivedGreaterThanDebt = _fyTokenReceived.gt(matchingVaultDebt); // i.e. debt below fytoken

    // if user has matching vault debt
    // estimate if we can sell fyToken after repaying vault debt
    // use the difference between the amount of fyToken received from burn and debt (which is repaid) to assess whether we can call sell
    // potentially use network preview here to be more exact
    const extrafyTokenTrade = sellFYToken(
      _newPool.sharesReserves,
      _newPool.fyTokenVirtualReserves,
      _fyTokenReceived.sub(matchingVaultDebt),
      getTimeTillMaturity(seriesEntity.maturity),
      seriesEntity.ts,
      seriesEntity.g2,
      seriesEntity.decimals,
      seriesEntity.c,
      seriesEntity.mu
    );

    // if extra fyToken trade is possible, estimate min base user to receive (convert shares to base)
    const minBaseToReceive = calculateSlippage(
      seriesEntity.getBase(extrafyTokenTrade),
      slippageTolerance.toString(),
      true
    );

    /* if extra trade is possible (extraTrade > 0), we can auto sell fyToken after burning lp tokens and getting back excess (greater than vault debt) fyToken */
    const extraTradeSupported = extrafyTokenTrade.gt(ethers.constants.Zero) && useMatchingVault;

    /* Diagnostics parsed into without and with vault scenarios */
    !useMatchingVault &&
      diagnostics &&
      console.log(
        '\n',
        'Strategy: ',
        strategy,
        '\n',
        '\n',
        'fyTokenTrade estimated value...',
        '\n',
        'to check if we can call burnForBase: ',
        formatUnits(fyTokenTrade, seriesEntity.decimals),
        '\n',
        'burnForBase supported (without vault debt): ',
        burnForBaseSupported,
        '\n',
        'input: ',
        formatUnits(_input, seriesEntity.decimals),
        '\n',
        'lpTokens received from strategy token burn: ',
        formatUnits(lpReceived, seriesEntity.decimals),
        '\n',
        'fyToken received from lpToken burn: ',
        formatUnits(_fyTokenReceived, seriesEntity.decimals),
        '\n',
        'base received from lpToken burn: ',
        formatUnits(seriesEntity.getBase(_sharesReceived), seriesEntity.decimals)
      );

    useMatchingVault &&
      diagnostics &&
      console.log(
        '\n',
        'Strategy: ',
        strategy,
        '\n',
        '\n',
        'extraFyTokenTrade (fyTokenReceived minus debt) estimated value...',
        '\n',
        'to check if we can sell fyToken (with vault debt): ',
        formatUnits(extrafyTokenTrade, seriesEntity.decimals),
        '\n',
        'sellFyToken supported with vault debt: ',
        extraTradeSupported,
        '\n',
        'Vault to use for removal: ',
        matchingVaultId,
        '\n',
        'vaultDebt: ',
        formatUnits(matchingVaultDebt, seriesEntity.decimals),
        '\n',
        'input: ',
        formatUnits(_input, seriesEntity.decimals),
        '\n',
        'lpTokens received from strategy token burn: ',
        formatUnits(lpReceived, seriesEntity.decimals),
        '\n',
        'fyToken received from lpToken burn: ',
        formatUnits(_fyTokenReceived, seriesEntity.decimals),
        '\n',
        'base received from lpToken burn: ',
        formatUnits(seriesEntity.getBase(_sharesReceived), seriesEntity.decimals),
        '\n',
        'debt: ',
        formatUnits(matchingVaultDebt, seriesEntity.decimals),
        '\n',
        'Is FyToken Received Greater Than Debt: ',
        fyTokenReceivedGreaterThanDebt,
        '\n',
        'Is FyToken tradable after repaying vault debt?: ',
        extraTradeSupported,
        '\n',
        'extrafyTokentrade value (in base): ',
        formatUnits(seriesEntity.getBase(extrafyTokenTrade), seriesEntity.decimals)
      );

    if (!ladleAddress) throw new Error('no ladle address detected in remove liq');

    const alreadyApprovedStrategy = strategy
      ? (await strategy.strategyContract.allowance(account, ladleAddress)).gte(_input)
      : false;
    const alreadyApprovedPool = !strategy
      ? (await seriesEntity.poolContract.allowance(account, ladleAddress)).gte(_input)
      : false;

    const isEthBase = ETH_BASED_ASSETS.includes(base.proxyId);
    const toAddress = isEthBase ? ladleAddress : account;

    // when the user has a vault and the fyToken received from burn is greater than debt,
    // if extra trade is supported after repaying debt,
    // then we send fyToken to the pool to sell
    // else we give the fyTokens back to the user directly
    const repayToAddress = extraTradeSupported ? seriesEntity.poolAddress : account;

    /* handle removing eth Base tokens:  */
    // NOTE: REMOVE ETH FOR ALL PATHS/OPTIONS (exit_ether sweeps all the eth out the ladle, so exact amount is not important -> just greater than zero)
    const removeEthCallData: ICallData[] = isEthBase ? removeEth(ONE_BN) : [];

    const permitCallData: ICallData[] = await sign(
      [
        /* give strategy permission to sell tokens to pool */
        {
          target: strategy,
          spender: 'LADLE',
          amount: _input,
          ignoreIf: !strategy || alreadyApprovedStrategy === true,
        },

        /* give pool permission to sell tokens */
        {
          target: {
            address: seriesEntity.poolAddress,
            name: seriesEntity.poolName,
            version: seriesEntity.poolVersion,
            symbol: seriesEntity.poolSymbol,
          },
          spender: 'LADLE',
          amount: _input,
          ignoreIf: !!strategy || alreadyApprovedPool === true,
        },
      ],
      txCode
    );

    // const unwrapping: ICallData[] = await unwrapAsset(base, account)
    const calls: ICallData[] = [
      ...permitCallData,

      /* FOR ALL REMOVES (when using a strategy) > move tokens from strategy to pool tokens  */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [strategy.address, strategy.address, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: !strategy,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [seriesEntity.poolAddress] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
        targetContract: strategy ? strategy.strategyContract : undefined,
        ignoreIf: !strategy,
      },

      /* FOR ALL REMOVES NOT USING STRATEGY >  move tokens to poolAddress  : */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [seriesEntity.poolAddress, seriesEntity.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: !!strategy || seriesEntity.seriesIsMature,
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
        targetContract: seriesEntity.poolContract,
        ignoreIf: seriesEntity.seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },
      {
        operation: LadleActions.Fn.REPAY_FROM_LADLE,
        args: [matchingVaultId, toAddress] as LadleActions.Args.REPAY_FROM_LADLE,
        ignoreIf: seriesEntity.seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },
      {
        operation: LadleActions.Fn.CLOSE_FROM_LADLE,
        args: [matchingVaultId, toAddress] as LadleActions.Args.CLOSE_FROM_LADLE,
        ignoreIf: seriesEntity.seriesIsMature || fyTokenReceivedGreaterThanDebt || !useMatchingVault,
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
        targetContract: seriesEntity.poolContract,
        ignoreIf: seriesEntity.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },

      {
        operation: LadleActions.Fn.REPAY_FROM_LADLE,
        args: [matchingVaultId, toAddress] as LadleActions.Args.REPAY_FROM_LADLE,
        ignoreIf: seriesEntity.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault,
      },
      // {
      //   operation: LadleActions.Fn.ROUTE,
      //   args: [toAddress, minBaseToReceive] as RoutedActions.Args.SELL_FYTOKEN,
      //   fnName: RoutedActions.Fn.SELL_FYTOKEN,
      //   targetContract: seriesEntity.poolContract,
      //   ignoreIf: seriesEntity.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault || !extraTradeSupported,
      // },

      /* PATCH!!! if removing ETH-BASE, retrieve fyETH as to not leave it in the ladle  */
      {
        operation: LadleActions.Fn.RETRIEVE,
        args: [seriesEntity.fyTokenAddress, account] as LadleActions.Args.RETRIEVE,
        ignoreIf: seriesEntity.seriesIsMature || !fyTokenReceivedGreaterThanDebt || !useMatchingVault || !isEthBase,
      },

      /* OPTION 4. Remove Liquidity and sell - BEFORE MATURITY + NO VAULT */

      // 4.1
      // ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
      // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [toAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_FOR_BASE,
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        targetContract: seriesEntity.poolContract,
        ignoreIf: seriesEntity.seriesIsMature || useMatchingVault || !burnForBaseSupported,
      },

      // 4.2
      // ladle.transferAction(pool, pool, lpTokensBurnt), ^^^^ DONE ABOVE ^^^^
      // ladle.routeAction(pool, ['burnForBase', [receiver, minBaseReceived]),
      {
        operation: LadleActions.Fn.ROUTE,
        args: [toAddress, account, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: seriesEntity.poolContract,
        ignoreIf: seriesEntity.seriesIsMature || useMatchingVault || burnForBaseSupported,
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
        args: [toAddress, seriesEntity.fyTokenAddress, minRatio, maxRatio] as RoutedActions.Args.BURN_POOL_TOKENS,
        fnName: RoutedActions.Fn.BURN_POOL_TOKENS,
        targetContract: seriesEntity.poolContract,
        ignoreIf: !seriesEntity.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.REDEEM,
        args: [seriesEntity.id, toAddress, '0'] as LadleActions.Args.REDEEM,
        ignoreIf: !seriesEntity.seriesIsMature,
      },

      ...removeEthCallData,
    ];

    await transact(calls, txCode);

    mutate(strategyKey);
    mutate(seriesEntityKey);
    mutate(baseKey);
    mutate(matchingVaultKey);

    updateStrategyHistory([strategy]);
  };

  return removeLiquidity;
};
