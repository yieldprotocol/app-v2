import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, SignType, ISeries, ActionCodes, LadleActions, RoutedActions, IAsset } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../../utils/constants';
import { useChain } from '../useChain';

import { calculateSlippage, fyTokenForMint, mint, mintWithBase, sellBase, splitLiquidity } from '../../utils/yieldMath';
import { ChainContext } from '../../contexts/ChainContext';
import SeriesSelector from '../../components/selectors/SeriesSelector';

export const usePool = (input: string | undefined) => {
  const poolMax = input;
  return { poolMax };
};

/* Hook for chain transactions */
export const useAddLiquidity = () => {

  const { chainState: {strategyRootMap} } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, selectedIlkId, selectedSeriesId, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;
  const { sign, transact } = useChain();

  const addLiquidity = async (
    input: string,
    series: ISeries,
    method: 'BUY' | 'BORROW' | string = 'BUY',
    strategyAddr: string | undefined = "0xdc70afc194261A7290fAc51E17992A4bF2D4b39b",
  ) => {
    const txCode = getTxCode(ActionCodes.ADD_LIQUIDITY, series.id);
    const _input = ethers.utils.parseEther(input);
    const base : IAsset = assetMap.get(series.baseId);

    const _strategyAddr = ethers.utils.isAddress(strategyAddr!) ? strategyAddr : undefined;

    const _fyTokenToBuy = fyTokenForMint(
      series.baseReserves,
      series.fyTokenRealReserves,
      series.fyTokenReserves,
      _input,
      series.getTimeTillMaturity()
    );

    const [_baseProportion, _fyTokenPortion ] = splitLiquidity(
      series.baseReserves,
      series.fyTokenReserves,
      _input,
    )
    const _baseToFyToken = _baseProportion;
    const _baseToPool = _input.sub(_baseProportion);

    console.log(_baseProportion.toString(), _fyTokenPortion.toString())

    // const _inputAsFyToken = sellBase(
    //   series.baseReserves,
    //   series.fyTokenReserves,
    //   _input,
    //   series.getTimeTillMaturity() 
    // )

    const _inputWithSlippage = calculateSlippage(_input);

    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          series,
          message: 'Signing ERC20 Token approval',
          ignore: false,
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
        ignore: method !== 'BUY',
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [
          _strategyAddr || account, // reciever is _strategy (if it exists) or account
          _fyTokenToBuy,
          ethers.constants.Zero, // TODO calc minLPtokens slippage
        ] as RoutedActions.Args.MINT_WITH_BASE,
        fnName: RoutedActions.Fn.MINT_WITH_BASE,
        targetContract: series.poolContract,
        ignore: method !== 'BUY',
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account] as RoutedActions.Args.MINT,
        fnName: RoutedActions.Fn.MINT,
        targetContract: strategyRootMap.get(_strategyAddr).strategyContract,
        ignore: !(method === 'BUY' && !!_strategyAddr) ,
      },

      /**
       * Provide liquidity by BORROWING:
       * */
      {
        // build Vault with random id
        operation: LadleActions.Fn.BUILD,
        args: [selectedSeriesId, selectedIlkId, '0'] as LadleActions.Args.BUILD,
        ignore: method !== 'BORROW',
      },

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, base.joinAddress, _baseToFyToken] as LadleActions.Args.TRANSFER,
        ignore: method !== 'BORROW',
      },

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _baseToPool] as LadleActions.Args.TRANSFER,
        ignore: method !== 'BORROW',
      },
      {
        operation: LadleActions.Fn.POUR,
        args: [BLANK_VAULT, series.poolAddress, _baseToFyToken, _baseToFyToken] as LadleActions.Args.POUR,
        ignore: method !== 'BORROW',
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [_strategyAddr || account, true, ethers.constants.Zero] as RoutedActions.Args.MINT,
        fnName: RoutedActions.Fn.MINT,
        targetContract: series.poolContract,
        ignore: !(method === 'BORROW' && !!_strategyAddr),
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account] as RoutedActions.Args.MINT,
        fnName: RoutedActions.Fn.MINT,
        targetContract: strategyRootMap.get(_strategyAddr).strategyContract,
        ignore: !(method === 'BUY' && !!_strategyAddr) ,
      },
    ];

    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };

  return addLiquidity
};
