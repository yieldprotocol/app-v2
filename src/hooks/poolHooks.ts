import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { ICallData, SignType, ISeries, ActionCodes, LadleActions, RoutedActions } from '../types';
import { getTxCode } from '../utils/appUtils';
import { BLANK_VAULT, DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../utils/constants';
import { useChain } from './chainHooks';

import { calculateSlippage, fyTokenForMint, mint, sellBase } from '../utils/yieldMath';

export const usePool = (input: string | undefined) => {
  const poolMax = input;
  return { poolMax };
};

/* Hook for chain transactions */
export const usePoolActions = () => {
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, selectedIlkId, selectedSeriesId, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;
  const { sign, transact } = useChain();

  const addLiquidity = async (
    input: string,
    series: ISeries,
    method: 'BUY' | 'BORROW' | string = 'BUY',
    strategyAddr: string | undefined = undefined,
  ) => {
    const txCode = getTxCode(ActionCodes.ADD_LIQUIDITY, series.id);
    const _input = ethers.utils.parseEther(input);
    const base = assetMap.get(series.baseId);

    const _strategyAddr = ethers.utils.isAddress(strategyAddr!) ? strategyAddr : undefined;

    const _fyTokenToBuy = fyTokenForMint(
      series.baseReserves,
      series.fyTokenRealReserves,
      series.fyTokenReserves,
      _input,
      series.getTimeTillMaturity()
    );

    const _inputAsFyToken = sellBase(
      series.baseReserves,
      series.fyTokenReserves,
      _input,
      series.getTimeTillMaturity() 
    )

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
        args: [series.getBaseAddress(), series.poolAddress, _inputWithSlippage] as LadleActions.Args.TRANSFER,
        series,
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
        series,
        ignore: method !== 'BUY',
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account] as RoutedActions.Args.MINT,
        fnName: RoutedActions.Fn.MINT,
        series,
        routeTargetAddr: _strategyAddr,
        ignore: method !== 'BUY' && !_strategyAddr,
      },

      /**
       * Provide liquidity by BORROWING:
       * */
      // ladle.transferAction(base, baseJoin, baseToFYToken),
      // ladle.transferAction(base, pool, baseToPool),
      // ladle.pourAction(0, pool, baseToFYToken, baseToFYToken),
      // ladle.routeAction(pool, ['mint', [receiver, true, minimumLPTokenReceived]),

      // {
      //   // build Vault with random id if required
      //   operation: LadleActions.Fn.BUILD,
      //   args: [selectedSeriesId, selectedIlkId, '0'] as LadleActions.Args.BUILD,
      //   series,
      //   ignore: method !== 'BORROW',
      // },

      // {
      //   operation: LadleActions.Fn.TRANSFER,
      //   args: [series.getBaseAddress(), baseJoin, _inputAsFyToken] as LadleActions.Args.TRANSFER,
      //   series,
      //   ignore: method !== 'BORROW',
      // },

      // {
      //   operation: LadleActions.Fn.TRANSFER,
      //   args: [series.getBaseAddress(), series.poolAddress, _inputWithSlippage] as LadleActions.Args.TRANSFER,
      //   series,
      //   ignore: method !== 'BORROW',
      // },

      // {
      //   operation: LadleActions.Fn.POUR,
      //   args: [0, series.poolAddress, _inputAsFyToken, _inputAsFyToken] as LadleActions.Args.POUR,
      //   series,
      //   ignore: method !== 'BORROW',
      // },

      // {
      //   // ladle.mintWithBaseAction(seriesId, receiver, fyTokenToBuy, minLPReceived)
      //   operation: LadleActions.Fn.ROUTE,
      //   args: [account, _fyTokenToBuy, ethers.constants.Zero] as RoutedActions.Args.MINT_WITH_BASE,
      //   fnName: RoutedActions.Fn.MINT_WITH_BASE,
      //   series,
      //   ignore: method !== 'BORROW',
      // },
    ];

    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };

  const rollLiquidity = async (input: string, fromSeries: ISeries, toSeries: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ROLL_LIQUIDITY, fromSeries.id);
    const _input = ethers.utils.parseEther(input);
    const base = assetMap.get(fromSeries.baseId);
    const seriesMature = fromSeries.seriesIsMature;

    const _fyTokenToBuy = fyTokenForMint(
      toSeries.baseReserves,
      toSeries.fyTokenRealReserves,
      toSeries.fyTokenReserves,
      _input,
      toSeries.getTimeTillMaturity()
    );


    const permits: ICallData[] = await sign(
      [
        /* BEFORE MATURITY */
        {
          // router.forwardPermitAction(pool.address, pool.address, router.address, allowance, deadline, v, r, s )
          target: {
            id: fromSeries.id,
            address: fromSeries.poolAddress,
            name: fromSeries.poolName,
            version: fromSeries.poolVersion,
          },
          spender: 'LADLE',
          series: fromSeries,
          message: 'Signing ERC20 Token approval',
          ignore: seriesMature,
        },

        /* AFTER MATURITY */
        {
          // ladle.forwardPermitAction(seriesId, false, ladle.address, allowance, deadline, v, r, s)
          target: fromSeries,
          spender: 'LADLE',
          series: fromSeries,
          message: 'Signing ERC20 Token approval',
          ignore: !fromSeries.seriesIsMature,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      /* BEFORE MATURITY */

      {
        // router.transferToPool(base.address, fyToken1.address, pool1.address, WAD)
        operation: LadleActions.Fn.TRANSFER,
        args: [
          // fromSeries.getBaseAddress(),
          fromSeries.fyTokenAddress,
          fromSeries.poolAddress,
          _input,
        ] as LadleActions.Args.TRANSFER,
        series: fromSeries,
        ignore: seriesMature,
      },
      {
        // router.burnForBase(pool.address, pool2.address, minBaseReceived)
        operation: LadleActions.Fn.ROUTE,
        args: [toSeries.poolAddress, _input] as RoutedActions.Args.BURN_FOR_BASE,
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        series: fromSeries,
        ignore: seriesMature,
      },
      {
        // router.mintWithBase( base.address, fyToken2.address, receiver, fyTokenToBuy, minLPReceived)
        operation: LadleActions.Fn.ROUTE,
        args: [account, _fyTokenToBuy, ethers.constants.Zero] as RoutedActions.Args.MINT_WITH_BASE,
        fnName: RoutedActions.Fn.MINT_WITH_BASE,
        series: toSeries,
        ignore: seriesMature,
      },

      /* AFTER MATURITY */

      {
        // ladle.transferToFYTokenAction(seriesId, fyTokenToRoll)
        operation: LadleActions.Fn.TRANSFER,
        args: [account, fromSeries.id, _input] as LadleActions.Args.TRANSFER,
        series: fromSeries,
        ignore: !fromSeries.seriesIsMature,
      },
      {
        // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
        operation: LadleActions.Fn.REDEEM,
        args: [fromSeries.id, toSeries.poolAddress, _input] as LadleActions.Args.REDEEM,
        series: fromSeries,
        ignore: !fromSeries.seriesIsMature,
      },
      {
        // ladle.mintWithBase(series2Id, receiver, fyTokenToBuy, minLPReceived),
        operation: LadleActions.Fn.ROUTE,
        args: [account, _input, ethers.constants.Zero] as RoutedActions.Args.MINT_WITH_BASE,
        fnName: RoutedActions.Fn.MINT_WITH_BASE,
        series: toSeries,
        ignore: !seriesMature,
      },
    ];

    await transact(calls, txCode);
    updateSeries([fromSeries, toSeries]);
    updateAssets([base]);
  };

  const removeLiquidity = async (input: string, series: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_LIQUIDITY, series.id);
    const _input = ethers.utils.parseEther(input);
    const base = assetMap.get(series.baseId);

    const permits: ICallData[] = await sign(
      [
        {
          // router.forwardPermitAction(pool.address, pool.address, router.address, allowance, deadline, v, r, s),
          target: {
            id: series.id,
            address: series.poolAddress,
            name: series.poolName,
            version: series.poolVersion,
          },
          series,
          spender: 'POOLROUTER',
          message: 'Signing ERC20 Token approval',
          ignore: false,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      {
        // router.transferToPool(base.address, fyToken1.address, pool1.address, WAD)
        operation: LadleActions.Fn.TRANSFER,
        args: [series.fyTokenAddress, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        series,
        ignore: series.seriesIsMature,
      },

      // BEFORE MATURITY
      {
        // burnForBase(receiver, minBaseReceived),
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.BURN_FOR_BASE,
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        series,
        ignore: series.seriesIsMature,
      },

      // AFTER MATURITY
      {
        // router.transferToPool(base.address, fyToken1.address, pool1.address, WAD)
        operation: LadleActions.Fn.TRANSFER,
        args: [series.fyTokenAddress, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        series,
        ignore: !series.seriesIsMature,
      },
      {
        // burnForBase(receiver, minBaseReceived),
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.BURN_FOR_BASE,
        fnName: RoutedActions.Fn.BURN_FOR_BASE,
        series,
        ignore: !series.seriesIsMature,
      },
    ];
    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };

  return {
    addLiquidity,
    rollLiquidity,
    removeLiquidity,
  };
};
