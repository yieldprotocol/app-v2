import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, SignType, ISeries, ActionCodes, LadleActions, RoutedActions, IAsset, IStrategy } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../../utils/constants';
import { useChain } from '../useChain';

import { calculateSlippage, fyTokenForMint, mintWithBase, splitLiquidity } from '../../utils/yieldMath';
import { ChainContext } from '../../contexts/ChainContext';
import { HistoryContext } from '../../contexts/HistoryContext';

/* Hook for chain transactions */
export const useAddLiquidity = () => {
  const {
    chainState: { contractMap, strategyRootMap },
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

    const _input = ethers.utils.parseUnits(input, base.decimals);

    const _fyTokenToBuy = fyTokenForMint(
      series.baseReserves,
      series.fyTokenRealReserves,
      series.fyTokenReserves,
      _input,
      series.getTimeTillMaturity(),
      series.decimals
    );

    const [, _minted]= mintWithBase(
      series.baseReserves,
      series.fyTokenReserves,
      series.fyTokenRealReserves,
      series.totalSupply,
      _input,
      series.getTimeTillMaturity(),
    )

    console.log('minted', _minted.toString())

    const [basePortion, fyTokenPortion] = splitLiquidity(series.baseReserves, series.fyTokenReserves, _input);  
    // const _baseToPool = _input.sub(baseProportion);
    // const _baseToFyToken = baseProportion; // just put in the rest of the provided input
    // const _inputWithSlippage = calculateSlippage(_input, slippageTolerance , true);
    const _baseToPool = basePortion;
    const _baseToFyToken = fyTokenPortion; // just put in the rest of the provided input

    const _inputWithSlippage = calculateSlippage(_input, slippageTolerance , true);

    // const _mintedWithSlippage = calculateSlippage(_minted, slippageTolerance , true);
    // console.log(_baseToFyToken, _inputWithSlippage )
    
    console.log('input' , input.toString() )
    console.log('_input' , _input.toString() )
    console.log('basePortion:' , basePortion.toString() )
    console.log('fyTokenPortion:' , fyTokenPortion.toString() )

    console.log('base reseves:' , series.baseReserves.toString() )
    console.log('fytoken reserves reseves:' , series.fyTokenReserves.toString() )
    console.log('fytoken to buy:' , _fyTokenToBuy.toString() )

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
          message: 'Signing ERC20 Token approval',
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
        ignoreIf: method === 'BORROW',
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          strategy.id || account, // receiver is _strategyAddress (if it exists) or else account
          _fyTokenToBuy.toString(),
          ethers.constants.Zero, // TODO calc minLPtokens slippage 
        ] as RoutedActions.Args.MINT_WITH_BASE,
        fnName: RoutedActions.Fn.MINT_WITH_BASE,
        targetContract: series.poolContract,
        ignoreIf: method === 'BORROW',
      },

      /**
       * Provide liquidity by BORROWING:
       * */
      {
        operation: LadleActions.Fn.BUILD,
        args: [series.id, base.id, '0'] as LadleActions.Args.BUILD,
        ignoreIf: method === 'BUY', 
      },
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, base.joinAddress, _baseToFyToken] as LadleActions.Args.TRANSFER,
        ignoreIf: method === 'BUY',
      },
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _baseToPool] as LadleActions.Args.TRANSFER,
        ignoreIf: method === 'BUY',
      },
      {
        operation: LadleActions.Fn.POUR,
        args: [
          BLANK_VAULT,
          series.poolAddress,
          _baseToFyToken,
          _baseToFyToken,
        ] as LadleActions.Args.POUR,
        ignoreIf: method === 'BUY',
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [strategy.id || account, true, ethers.constants.Zero] as RoutedActions.Args.MINT_POOL_TOKENS, // receiver is _strategyAddr (if it exists) or account
        fnName: RoutedActions.Fn.MINT_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: method === 'BUY',
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
