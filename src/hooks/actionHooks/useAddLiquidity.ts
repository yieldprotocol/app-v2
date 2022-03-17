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
import { BLANK_VAULT, ONE_BN, ZERO_BN } from '../../utils/constants';

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
    const _inputLessSlippage = calculateSlippage(_input, slippageTolerance.toString(), true);

    const [cachedBaseReserves, cachedFyTokenReserves] = await _series?.poolContract.getCache()!;
    const cachedRealReserves = cachedFyTokenReserves.sub(_series?.totalSupply!.sub(ONE_BN));

    const [_fyTokenToBeMinted] = fyTokenForMint(
      cachedBaseReserves,
      cachedRealReserves,
      cachedFyTokenReserves,
      _inputLessSlippage,
      _series.getTimeTillMaturity(),
      _series.ts,
      _series.g1,
      _series.decimals,
      slippageTolerance
    );

    const [minRatio, maxRatio] = calcPoolRatios(cachedBaseReserves, cachedRealReserves);

    const [_baseToPool, _baseToFyToken] = splitLiquidity(
      cachedBaseReserves,
      cachedRealReserves,
      _inputLessSlippage,
      true
    ) as [BigNumber, BigNumber];

    const _baseToPoolWithSlippage = BigNumber.from(calculateSlippage(_baseToPool, slippageTolerance.toString()));

    /* if approveMAx, check if signature is still required */
    const alreadyApproved = (await _base.getAllowance(account!, ladleAddress)).gte(_input);

    /* if ethBase */
    const isEthBase = ETH_BASED_ASSETS.includes(_base.id);

    /* DIAGNOSITCS */
    console.log(
      'input: ',
      _input.toString(),
      'inputLessSlippage: ',
      _inputLessSlippage.toString(),
      'base: ',
      cachedBaseReserves.toString(),
      'real: ',
      cachedRealReserves.toString(),
      'virtual: ',
      cachedFyTokenReserves.toString(),
      '>> baseSplit: ',
      _baseToPool.toString(),

      '>> fyTokenSplit: ',
      _baseToFyToken.toString(),

      '>> baseSplitWithSlippage: ',
      _baseToPoolWithSlippage.toString(),

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
    const permits: ICallData[] = await sign(
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

    /**
     * BUILD CALL DATA ARRAY
     * */
    const calls: ICallData[] = [
      ...permits,

      /**
       * Provide liquidity by BUYING :
       * */

      /* addETh to poolAddress if isEthBase and using BUY method */
      ...addEth(isEthBase && method === AddLiquidityType.BUY ? _input : ZERO_BN, _series.poolAddress),
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_base.address, _series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BUY || isEthBase, // ingore if not BUY and POOL or isETHbase
      },

      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          strategy.id || account, // receiver is _strategyAddress (if it exists) or else account
          account,
          _fyTokenToBeMinted,
          minRatio,
          maxRatio,
        ] as RoutedActions.Args.MINT_WITH_BASE,
        fnName: RoutedActions.Fn.MINT_WITH_BASE,
        targetContract: _series.poolContract,
        ignoreIf: method !== AddLiquidityType.BUY, // ingore if not BUY and POOL
      },

      /**
       * Provide liquidity by BORROWING:
       * */
      {
        operation: LadleActions.Fn.BUILD,
        args: [_series.id, _base.idToUse, '0'] as LadleActions.Args.BUILD,
        ignoreIf: method !== AddLiquidityType.BORROW ? true : !!matchingVaultId, // ingore if not BORROW and POOL
      },

      /* addETh to joinAddress and poolAddress if isEthBase and using BORROW method */
      ...addEth(isEthBase && method === AddLiquidityType.BORROW ? _baseToFyToken : ZERO_BN, _base.joinAddress),
      ...addEth(
        isEthBase && method === AddLiquidityType.BORROW ? _baseToPoolWithSlippage : ZERO_BN,
        _series.poolAddress
      ),

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_base.address, _base.joinAddress, _baseToFyToken] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BORROW || isEthBase,
      },
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_base.address, _series.poolAddress, _baseToPoolWithSlippage] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BORROW || isEthBase,
      },

      {
        operation: LadleActions.Fn.POUR,
        args: [
          matchingVaultId || BLANK_VAULT,
          _series.poolAddress,
          _baseToFyToken,
          _baseToFyToken,
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
       * (for all AddLiquididy recipes that use strategy >
       *  if strategy address is provided, and is found in the strategyMap, use that address
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
