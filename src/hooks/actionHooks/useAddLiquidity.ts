import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, SignType, ISeries, ActionCodes, LadleActions, RoutedActions, IAsset, IStrategy } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../../utils/constants';
import { useChain } from '../useChain';

import { calculateSlippage, fyTokenForMint, mint, mintWithBase, splitLiquidity } from '../../utils/yieldMath';
import { ChainContext } from '../../contexts/ChainContext';
import { HistoryContext } from '../../contexts/HistoryContext';

/* Hook for chain transactions */
export const useAddLiquidity = () => {
  const {
    chainState: { strategyRootMap },
  } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, assetMap, seriesMap, slippageTolerance } = userState;
  const { updateSeries, updateAssets, updateStrategies } = userActions;
  const { sign, transact } = useChain();

  const {
    historyActions: { updateStrategyHistory },
  } = useContext(HistoryContext);

  const addLiquidity = async (input: string, strategy: IStrategy, method: 'BUY' | 'BORROW' | string = 'BUY') => {
    // const ladleAddress = contractMap.get('Ladle').address;
    const txCode = getTxCode(ActionCodes.ADD_LIQUIDITY, strategy.id);
    const series: ISeries = seriesMap.get(strategy.currentSeriesId);
    const base: IAsset = assetMap.get(series.baseId);

    const cleanInput = cleanValue(input, base.decimals);
    const _input = ethers.utils.parseUnits(cleanInput, base.decimals);
    // const _inputWithSlippage = calculateSlippage(_input, slippageTolerance);
    const _inputLessSlippage = calculateSlippage(_input, slippageTolerance, true);

    console.log(_inputLessSlippage.toString())

    console.log('pool TotalSupply :', (await series.poolContract.totalSupply()).toString());
    const _fyTokenToBuy = fyTokenForMint(
      series.baseReserves,
      series.fyTokenRealReserves,
      series.fyTokenReserves,
      _inputLessSlippage,
      series.getTimeTillMaturity(),
      series.decimals
    );

    const [_baseToPool, _baseToFyToken] = splitLiquidity(
      series.baseReserves,
      series.fyTokenReserves,
      _inputLessSlippage
    );

    const [_mintedWithBase] = mintWithBase(
      series.baseReserves,
      series.fyTokenReserves,
      series.fyTokenRealReserves,
      series.totalSupply,
      _fyTokenToBuy,
      series.getTimeTillMaturity()
    );
    const _mintedWithBaseWithSlippage = calculateSlippage(_mintedWithBase, slippageTolerance, true);
    console.log('mintedWithBase', _mintedWithBase.toString());
    console.log('_mintedWithBaseWithSlippage: ', _mintedWithBaseWithSlippage.toString());

    // const [_minted, ] = mint(series.baseReserves, series.fyTokenRealReserves, series.totalSupply, _input);
    // const _mintedWithSlippage = calculateSlippage(_minted, slippageTolerance, true);
    // console.log('minted', _minted.toString());
    // console.log('_mintedWithSlippage: ', _mintedWithSlippage.toString());

    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          message: 'Signing ERC20 Token approval',
          ignoreIf: method === 'BORROW',
        },
        {
          target: base,
          spender: base.joinAddress,
          amount: _input,
          ignoreIf: method === 'BUY',
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,
      /**
       * Provide liquidity by BUYING :
       * */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== 'BUY',
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          strategy.id || account, // receiver is _strategyAddress (if it exists) or else account
          _fyTokenToBuy,
          // _mintedWithBaseWithSlippage,
          ethers.constants.Zero, // TODO  comment for prod
        ] as RoutedActions.Args.MINT_WITH_BASE,
        fnName: RoutedActions.Fn.MINT_WITH_BASE,
        targetContract: series.poolContract,
        ignoreIf: method !== 'BUY',
      },

      /**
       * Provide liquidity by BORROWING:
       * */
      {
        operation: LadleActions.Fn.BUILD,
        args: [series.id, base.id, '0'] as LadleActions.Args.BUILD,
        ignoreIf: method !== 'BORROW',
      },
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, base.joinAddress, _baseToFyToken] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== 'BORROW',
      },
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _baseToPool] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== 'BORROW',
      },
      {
        operation: LadleActions.Fn.POUR,
        args: [BLANK_VAULT, series.poolAddress, _baseToFyToken, _baseToFyToken] as LadleActions.Args.POUR,
        ignoreIf: method !== 'BORROW',
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          strategy.id || account,
          true,
          // _mintedWithSlippage,
          ethers.constants.Zero, // TODO  comment for prod
        ] as RoutedActions.Args.MINT_POOL_TOKENS, // receiver is _strategyAddr (if it exists) or account
        fnName: RoutedActions.Fn.MINT_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: method !== 'BORROW',
      },

      // /* STRATEGY MINTING if strategy address is provided, and is found in the strategyMap, use that address */
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
    updateStrategies([strategyRootMap.get(strategy.id)]);
    updateStrategyHistory([strategyRootMap.get(strategy.id)]);
  };

  return addLiquidity;
};
