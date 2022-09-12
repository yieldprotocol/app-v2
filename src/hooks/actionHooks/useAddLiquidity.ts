import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { calcPoolRatios, calculateSlippage, fyTokenForMint, MAX_256, splitLiquidity, ZERO_BN } from '@yield-protocol/ui-math';

import { formatUnits } from 'ethers/lib/utils';
import { UserContext } from '../../contexts/UserContext';
import {
  ICallData,
  ISeries,
  ActionCodes,
  LadleActions,
  RoutedActions,
  IAsset,
  IStrategy,
  AddLiquidityType,
  IVault,
  IUserContext,
  IUserContextActions,
  IUserContextState,
  ISettingsContext,
} from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, ONE_BN } from '../../utils/constants';

import { useChain } from '../useChain';

import { HistoryContext } from '../../contexts/HistoryContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ChainContext } from '../../contexts/ChainContext';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ETH_BASED_ASSETS } from '../../config/assets';
import useTimeTillMaturity from '../useTimeTillMaturity';

export const useAddLiquidity = () => {
  const {
    settingsState: { slippageTolerance },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    chainState: { contractMap },
  } = useContext(ChainContext);
  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;
  const { activeAccount: account, assetMap, seriesMap } = userState;
  const { updateVaults, updateSeries, updateAssets, updateStrategies } = userActions;

  const { sign, transact } = useChain();
  const {
    historyActions: { updateStrategyHistory },
  } = useContext(HistoryContext);

  const { addEth } = useAddRemoveEth();
  const { getTimeTillMaturity } = useTimeTillMaturity();

  const addLiquidity = async (
    input: string,
    strategy: IStrategy,
    method: AddLiquidityType = AddLiquidityType.BUY,
    matchingVault: IVault | undefined = undefined
  ) => {
    const txCode = getTxCode(ActionCodes.ADD_LIQUIDITY, strategy.id);
    const _series: ISeries = seriesMap.get(strategy.currentSeriesId)!;
    const _base: IAsset = assetMap.get(_series?.baseId!)!;

    const ladleAddress = contractMap.get('Ladle').address;

    const matchingVaultId: string | undefined = matchingVault ? matchingVault.id : undefined;
    const cleanInput = cleanValue(input, _base?.decimals!);

    const _input = ethers.utils.parseUnits(cleanInput, _base?.decimals);
    const inputToShares = _series.getShares(_input);

    const [[cachedSharesReserves, cachedFyTokenReserves], totalSupply] = await Promise.all([
      _series.poolContract.getCache(),
      _series.poolContract.totalSupply(),
    ]);

    const cachedRealReserves = cachedFyTokenReserves.sub(totalSupply.sub(ONE_BN));

    // const [minRatio, maxRatio] = calcPoolRatios(cachedSharesReserves, cachedRealReserves, slippageTolerance) ;
    const [minRatio, maxRatio] = [calcPoolRatios(cachedSharesReserves, cachedRealReserves, slippageTolerance)[0], MAX_256]; 

    /* if approveMax, check if signature is still required */
    const alreadyApproved = (await _base.getAllowance(account!, ladleAddress)).gte(_input);

    /* if ethBase */
    const isEthBase = ETH_BASED_ASSETS.includes(_base.proxyId);

    /* Add liquidity by buying */
    const [fyTokenToBuy] = fyTokenForMint(
      cachedSharesReserves,
      cachedRealReserves,
      cachedFyTokenReserves,
      inputToShares,
      getTimeTillMaturity(_series.maturity),
      _series.ts,
      _series.g1,
      _series.decimals,
      slippageTolerance,
      _series.c,
      _series.mu
    );

    /* Add liquidity by borrowing */
    const [sharesToPool, fyTokenToBorrow] = splitLiquidity(
      cachedSharesReserves,
      cachedRealReserves,
      inputToShares,
      true
    ) as [BigNumber, BigNumber];

    const fyTokenToBorrowWithSlippage = BigNumber.from(
      calculateSlippage(fyTokenToBorrow, slippageTolerance.toString(), true)
    );

    /* convert shares to be pooled (when borrowing and pooling) to base, since we send in base */
    const baseToPool = _series.getBase(sharesToPool);

    /* DIAGNOSITCS */
    method === AddLiquidityType.BUY &&
      console.log(
        '\n',
        'method: ',
        method,
        '\n',
        'input: ',
        formatUnits(_input, strategy.decimals),
        '\n',
        'shares reserves: ',
        formatUnits(cachedSharesReserves, strategy.decimals),
        '\n',
        'real: ',
        formatUnits(cachedRealReserves, strategy.decimals),
        '\n',
        'virtual: ',
        formatUnits(cachedFyTokenReserves, strategy.decimals),
        '\n',
        'fyToken to buy: ',
        formatUnits(fyTokenToBuy, strategy.decimals),
        '\n',
        'minRatio',
        formatUnits(minRatio, strategy.decimals),
        '\n',
        'maxRatio',
        formatUnits(maxRatio, strategy.decimals)
      );

    method === AddLiquidityType.BORROW &&
      console.log(
        '\n',
        'method: ',
        method,
        '\n',
        'input: ',
        formatUnits(_input, strategy.decimals),
        '\n',
        'shares reserves: ',
        formatUnits(cachedSharesReserves, strategy.decimals),
        '\n',
        'real: ',
        formatUnits(cachedRealReserves, strategy.decimals),
        '\n',
        'virtual: ',
        formatUnits(cachedFyTokenReserves, strategy.decimals),
        '\n',
        'minRatio',
        formatUnits(minRatio, strategy.decimals),
        '\n',
        'maxRatio',
        formatUnits(maxRatio, strategy.decimals),
        '\n',
        'base to pool',
        formatUnits(baseToPool, strategy.decimals),
        '\n',
        'fyToken to be borrowed',
        formatUnits(fyTokenToBorrowWithSlippage, strategy.decimals),
        '\n',
        'matching vault id',
        matchingVaultId
      );

    /**
     * GET SIGNATURE/APPROVAL DATA
     * */
    const permitCallData: ICallData[] = await sign(
      [
        {
          target: _base,
          spender: 'LADLE',
          amount: _input,
          ignoreIf: alreadyApproved === true,
        },
      ],
      txCode
    );

    /* if  Eth base, build the correct add ethCalls */
    const addEthCallData = () => {
      /* BUY send WETH to  poolAddress */
      if (isEthBase && method === AddLiquidityType.BUY) return addEth(_input, _series.poolAddress);
      /* BORROW send WETH to both basejoin and poolAddress */
      if (isEthBase && method === AddLiquidityType.BORROW)
        return [...addEth(fyTokenToBorrowWithSlippage, _base.joinAddress), ...addEth(baseToPool, _series.poolAddress)];
      return []; // sends back an empty array [] if not eth base
    };

    /**
     * BUILD CALL DATA ARRAY
     * */
    const calls: ICallData[] = [
      ...permitCallData,

      /* addETh calldata */

      ...addEthCallData(),

      /**
       * Provide liquidity by BUYING :
       * */

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_base.address, _series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BUY || isEthBase, // ignore if not BUY and POOL or isETHbase
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          strategy.id || account, // NOTE GOTCHA: receiver is _strategyAddress (if it exists) or else account
          account,
          fyTokenToBuy,
          minRatio,
          maxRatio,
        ] as RoutedActions.Args.MINT_WITH_BASE,
        fnName: RoutedActions.Fn.MINT_WITH_BASE,
        targetContract: _series.poolContract,
        ignoreIf: method !== AddLiquidityType.BUY, // ignore if not BUY and POOL
      },

      /**
       * Provide liquidity by BORROWING:
       * */
      {
        operation: LadleActions.Fn.BUILD,
        args: [_series.id, _base.proxyId, '0'] as LadleActions.Args.BUILD,
        ignoreIf: method !== AddLiquidityType.BORROW ? true : !!matchingVaultId, // ignore if not BORROW and POOL
      },

      /* First transfer: sends base asset corresponding to the fyToken portion (with slippage) of the split liquidity to the respective join to mint fyToken directly to the pool */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_base.address, _base.joinAddress, fyTokenToBorrowWithSlippage] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BORROW || isEthBase,
      },
      /* Second transfer: sends the shares portion (converted to base) of the split liquidity directly to the pool */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_base.address, _series.poolAddress, baseToPool] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BORROW || isEthBase,
      },

      {
        operation: LadleActions.Fn.POUR,
        args: [
          matchingVaultId || BLANK_VAULT,
          _series.poolAddress,
          fyTokenToBorrowWithSlippage,
          fyTokenToBorrowWithSlippage,
        ] as LadleActions.Args.POUR,
        ignoreIf: method !== AddLiquidityType.BORROW,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [strategy.id || account, account, minRatio, maxRatio] as RoutedActions.Args.MINT_POOL_TOKENS,
        fnName: RoutedActions.Fn.MINT_POOL_TOKENS,
        targetContract: _series.poolContract,
        ignoreIf: method !== AddLiquidityType.BORROW,
      },

      /**
       *
       * STRATEGY TOKEN MINTING
       * for all AddLiquidity recipes that use strategy >
       * if strategy address is provided, and is found in the strategyMap, use that address
       *
       * */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account] as RoutedActions.Args.MINT_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.MINT_STRATEGY_TOKENS,
        targetContract: strategy.strategyContract,
        ignoreIf: !strategy,
      },
    ];

    await transact(calls, txCode);
    updateSeries([_series]);
    updateAssets([_base]);
    updateStrategies([strategy]);
    updateStrategyHistory([strategy]);
    updateVaults([]);
  };

  return addLiquidity;
};
