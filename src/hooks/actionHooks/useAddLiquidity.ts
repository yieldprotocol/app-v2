import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
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

import { calcPoolRatios, calculateSlippage, fyTokenForMint, splitLiquidity } from '../../utils/yieldMath';
import { HistoryContext } from '../../contexts/HistoryContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ChainContext } from '../../contexts/ChainContext';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ETH_BASED_ASSETS } from '../../config/assets';

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
    const inputToShares = _series.getShares(BigNumber.from(_input));
    const _inputLessSlippage = calculateSlippage(inputToShares, slippageTolerance.toString(), true);

    const [[, cachedSharesReserves, cachedFyTokenReserves]] = await Promise.all([_series.poolContract.getCache()]);
    const cachedRealReserves = cachedFyTokenReserves.sub(_series?.totalSupply!.sub(ONE_BN));

    const [_fyTokenToBeMinted] = fyTokenForMint(
      cachedSharesReserves,
      cachedRealReserves,
      cachedFyTokenReserves,
      _inputLessSlippage,
      _series.getTimeTillMaturity(),
      _series.ts,
      _series.g1,
      _series.decimals,
      slippageTolerance,
      _series.c,
      _series.mu
    );

    const [minRatio, maxRatio] = calcPoolRatios(cachedSharesReserves, cachedRealReserves);

    const [_sharesToPool, _sharesToFyToken] = splitLiquidity(
      cachedSharesReserves,
      cachedRealReserves,
      inputToShares,
      true
    ) as [BigNumber, BigNumber];

    const _sharesToPoolWithSlippage = BigNumber.from(calculateSlippage(_sharesToPool, slippageTolerance.toString()));

    /* if approveMAx, check if signature is still required */
    const alreadyApproved = (await _base.getAllowance(account!, ladleAddress)).gte(_input);

    /* if ethBase */
    const isEthBase = ETH_BASED_ASSETS.includes(_base.proxyId);

    /* DIAGNOSITCS */
    console.log(
      'input: ',
      _input.toString(),
      'inputLessSlippage: ',
      _inputLessSlippage.toString(),
      'base: ',
      cachedSharesReserves.toString(),
      'real: ',
      cachedRealReserves.toString(),
      'virtual: ',
      cachedFyTokenReserves.toString(),
      '>> baseSplit: ',
      _sharesToPool.toString(),

      '>> fyTokenSplit: ',
      _sharesToFyToken.toString(),

      '>> baseSplitWithSlippage: ',
      _sharesToPoolWithSlippage.toString(),

      '>> minRatio',
      minRatio.toString(),
      '>> maxRatio',
      maxRatio.toString(),
      'matching vault id',
      matchingVaultId
    );

    /**
     * GET SIGNTURE/APPROVAL DATA
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
        return [
          ...addEth(_sharesToFyToken, _base.joinAddress),
          ...addEth(_sharesToPoolWithSlippage, _series.poolAddress),
        ];
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
          _fyTokenToBeMinted,
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

      /* Note: two transfers */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_base.address, _base.joinAddress, _sharesToFyToken] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BORROW || isEthBase,
      },
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_base.address, _series.poolAddress, _sharesToPoolWithSlippage] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BORROW || isEthBase,
      },

      {
        operation: LadleActions.Fn.POUR,
        args: [
          matchingVaultId || BLANK_VAULT,
          _series.poolAddress,
          _sharesToFyToken,
          _sharesToFyToken,
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
