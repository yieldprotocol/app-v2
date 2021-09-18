import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, SignType, ISeries, ActionCodes, LadleActions, RoutedActions, IAsset } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../../utils/constants';
import { useChain } from '../useChain';

import { calculateSlippage, fyTokenForMint, splitLiquidity } from '../../utils/yieldMath';
import { ChainContext } from '../../contexts/ChainContext';
import { HistoryContext } from '../../contexts/HistoryContext';

/* Hook for chain transactions */
export const useAddLiquidity = () => {
  const {
    chainState: { strategyRootMap },
  } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, selectedIlkId, selectedSeriesId, assetMap, selectedStrategyAddr } = userState;
  const { updateSeries, updateAssets, updateStrategies } = userActions;
  const { sign, transact } = useChain();

  const { historyActions: { updateStrategyHistory } } = useContext(HistoryContext);

  const addLiquidity = async (input: string, series: ISeries, method: 'BUY' | 'BORROW' | string = 'BUY') => {
    const txCode = getTxCode(ActionCodes.ADD_LIQUIDITY, series.id);
    const base: IAsset = assetMap.get(series.baseId);
    const _input = ethers.utils.parseUnits(input, base.decimals);

    // const _strategyExists = ethers.utils.isAddress(strategyAddr!) && strategyRootMap.has(strategyAddr);
    // const _strategy = _strategyExists ? strategyAddr : undefined;
    const _strategy = selectedStrategyAddr || undefined;

    const _fyTokenToBuy = fyTokenForMint(
      series.baseReserves,
      series.fyTokenRealReserves,
      series.fyTokenReserves,
      _input,
      series.getTimeTillMaturity(),
      series.decimals
    );

    const [_baseProportion, _fyTokenPortion] = splitLiquidity(series.baseReserves, series.fyTokenReserves, _input);
    const _baseToFyToken = _baseProportion;
    const _baseToPool = _input.sub(_baseProportion);

    const _inputWithSlippage = calculateSlippage(_input);

    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          message: 'Signing ERC20 Token approval',
          ignoreIf: false,
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
        args: [base.address, series.poolAddress, _inputWithSlippage] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== 'BUY',
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          _strategy || account, // receiver is _strategyAddress (if it exists) or else account
          _fyTokenToBuy,
          ethers.constants.Zero, // TODO calc minLPtokens slippage
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
        args: [selectedSeriesId, selectedIlkId, '0'] as LadleActions.Args.BUILD,
        ignoreIf: method !== 'BORROW', // TODO exclude if vault is Provided.
      },
      // {
      //   operation: LadleActions.Fn.TRANSFER,
      //   args: [base.address, base.joinAddress, _baseToFyToken] as LadleActions.Args.TRANSFER,
      //   ignoreIf: method !== 'BORROW',
      // },
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _baseToPool] as LadleActions.Args.TRANSFER,
        ignoreIf: method !== 'BORROW',
      },
      {
        operation: LadleActions.Fn.POUR,
        args: [BLANK_VAULT, series.poolAddress, '0', _baseToFyToken] as LadleActions.Args.POUR,
        ignoreIf: method !== 'BORROW',
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [_strategy || account, true, ethers.constants.Zero] as RoutedActions.Args.MINT_POOL_TOKENS, // receiver is _strategyAddr (if it exists) or account
        fnName: RoutedActions.Fn.MINT_POOL_TOKENS,
        targetContract: series.poolContract,
        ignoreIf: !(method === 'BORROW' && !!_strategy),
      },

      /* STRATEGY MINTING if strategy address is provided, and is found in the strategyMap, use that address */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account] as RoutedActions.Args.MINT_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.MINT_STRATEGY_TOKENS,
        targetContract: _strategy && strategyRootMap.get(_strategy).strategyContract,
        ignoreIf: !_strategy,
      },
    ];

    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
    updateStrategies([strategyRootMap.get(_strategy)]);
    updateStrategyHistory([strategyRootMap.get(_strategy)]);
  };

  return addLiquidity;
};
