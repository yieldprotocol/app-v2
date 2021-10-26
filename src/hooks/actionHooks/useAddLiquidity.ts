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
} from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT } from '../../utils/constants';
import { useChain } from '../useChain';

import { calcPoolRatios, calculateSlippage, fyTokenForMint, splitLiquidity } from '../../utils/yieldMath';
import { HistoryContext } from '../../contexts/HistoryContext';

export const useAddLiquidity = () => {
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, assetMap, seriesMap, slippageTolerance } = userState;
  const { updateVaults, updateSeries, updateAssets, updateStrategies } = userActions;
  const { sign, transact } = useChain();
  const {
    historyActions: { updateStrategyHistory },
  } = useContext(HistoryContext);

  const addLiquidity = async (
    input: string,
    strategy: IStrategy,
    method: AddLiquidityType = AddLiquidityType.BUY,
    matchingVault: IVault | undefined = undefined
  ) => {
    const txCode = getTxCode(ActionCodes.ADD_LIQUIDITY, strategy.id);
    const series: ISeries = seriesMap.get(strategy.currentSeriesId);
    const base: IAsset = assetMap.get(series.baseId);

    const matchingVaultId: string | undefined = matchingVault ? matchingVault.id : undefined;
    const cleanInput = cleanValue(input, base.decimals);

    const _input = ethers.utils.parseUnits(cleanInput, base.decimals);
    const _inputLessSlippage = calculateSlippage(_input, slippageTolerance, true);

    const [cachedBaseReserves, cachedFyTokenReserves] = await series.poolContract.getCache();
    const cachedRealReserves = cachedFyTokenReserves.sub(series.totalSupply);

    const _fyTokenToBeMinted = fyTokenForMint(
      cachedBaseReserves,
      cachedRealReserves,
      cachedFyTokenReserves,
      _inputLessSlippage,
      series.getTimeTillMaturity(),
      series.decimals,
      slippageTolerance
    );

    const [minRatio, maxRatio] = calcPoolRatios(cachedBaseReserves, cachedRealReserves);

    const [_baseToPool, _baseToFyToken] = splitLiquidity(
      cachedBaseReserves,
      cachedRealReserves,
      _inputLessSlippage,
      true
    ) as [BigNumber, BigNumber];

    const _baseToPoolWithSlippage = BigNumber.from(calculateSlippage(_baseToPool, slippageTolerance));

    // /* DIAGNOSITCS */
    // console.log(
    //   'input: ',
    //   _input.toString(),
    //   'inputLessSlippage: ',
    //   _inputLessSlippage.toString(),
    //   'base: ',
    //   cachedBaseReserves.toString(),
    //   'real: ',
    //   cachedRealReserves.toString(),
    //   'virtual: ',
    //   cachedFyTokenReserves.toString(),
    //   '>> baseSplit: ',
    //   _baseToPool.toString(),
    //   '>> fyTokenSplit: ',
    //   _baseToFyToken.toString(),
    //   '>> baseSplitWithSlippage: ',
    //   _baseToPoolWithSlippage.toString(),
    //   '>> minRatio',
    //   minRatio.toString(),
    //   '>> maxRatio',
    //   maxRatio.toString()
    // );

    /**
     * GET SIGNTURE/APPROVAL DATA
     * */
    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          amount: _input,
          ignoreIf: false, // never ignore
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
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BUY, // ingore if not BUY and POOL
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
        targetContract: series.poolContract,
        ignoreIf: method !== AddLiquidityType.BUY, // ingore if not BUY and POOL
      },

      /**
       * Provide liquidity by BORROWING:
       * */
      {
        operation: LadleActions.Fn.BUILD,
        args: [series.id, base.id, '0'] as LadleActions.Args.BUILD,
        ignoreIf: !!matchingVaultId && method !== AddLiquidityType.BORROW, // ingore if not BORROW and POOL
      },
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, base.joinAddress, _baseToFyToken] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BORROW,
      },
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _baseToPoolWithSlippage] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== AddLiquidityType.BORROW,
      },
      {
        operation: LadleActions.Fn.POUR,
        args: [
          matchingVaultId || BLANK_VAULT,
          series.poolAddress,
          _baseToFyToken,
          _baseToFyToken,
        ] as LadleActions.Args.POUR,
        ignoreIf: method !== AddLiquidityType.BORROW,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [strategy.id || account, account, minRatio, maxRatio] as RoutedActions.Args.MINT_POOL_TOKENS,
        fnName: RoutedActions.Fn.MINT_POOL_TOKENS,
        targetContract: series.poolContract,
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
    updateSeries([series]);
    updateAssets([base]);
    updateStrategies([strategy]);
    updateStrategyHistory([strategy]);
    updateVaults([]);
  };

  return addLiquidity;
};
