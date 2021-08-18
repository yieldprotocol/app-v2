import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import {
  ICallData,
  SignType,
  ISeries,
  ActionCodes,
  PoolRouterActions,
  LadleActions,
  ReroutedActions,
  IUserContextState,
} from '../types';
import { getTxCode } from '../utils/appUtils';
import { DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../utils/constants';
import { buyBase, buyFYToken, calculateSlippage, secondsToFrom, sellBase, sellFYToken } from '../utils/yieldMath';
import { useChain } from './chainHooks';

export const useLend = (series: ISeries, input?:string|undefined) => {
  const { userState } = useContext(UserContext);
  const { assetMap, activeAccount, selectedBaseId } = userState;
  const selectedBase = assetMap.get(selectedBaseId!);

  const [maxLend, setMaxLend] = useState<string>();
  const [currentValue, setCurrentValue] = useState<string>();

  /* set maxLend as the balance of the base token */
  useEffect(() => {

    /* Check max available lend (only if activeAccount to save call) */
    if (activeAccount) {
      (async () => {
        const max = await selectedBase?.getBalance(activeAccount);
        if (max) setMaxLend(ethers.utils.formatEther(max).toString());
      })();
    }

  }, [activeAccount, assetMap, selectedBase, series]);

  /* set currentValue as the market Value of fyTokens held in base tokens */
  useEffect(() => {

    if (series) {
      const value = sellFYToken(
        series.baseReserves,
        series.fyTokenReserves,
        series.fyTokenBalance || ethers.constants.Zero,
        secondsToFrom(series.maturity.toString())
      );
      setCurrentValue(ethers.utils.formatEther(value))
    }
  }, [series]);

  return { maxLend, currentValue };
};

/* Lend Actions Hook */
export const useLendActions = () => {
  const {
    chainState: { account, contractMap },
  } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;

  const { sign, transact } = useChain();

  const lend = async (input: string | undefined, series: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.LEND, series.id);

    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    // const baseAddress = series.getBaseAddress();
    const base = assetMap.get(series.baseId);
    const { fyTokenAddress } = series;
    const _isDaiBased = DAI_BASED_ASSETS.includes(series.baseId);

    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'POOLROUTER',
          series,
          type: _isDaiBased ? SignType.DAI : SignType.ERC2612, // Sign Type based on whether a DAI-TyPE base asset or not.
          message: 'Signing ERC20 Token approval',
          ignore: false, // ignore if user has previously signed. base.
        },
      ],
      txCode,
      true
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: PoolRouterActions.Fn.TRANSFER_TO_POOL,
        args: [
          base.address,
          fyTokenAddress,
          base.address,
          _input.toString(),
        ] as PoolRouterActions.Args.TRANSFER_TO_POOL,
        series,
        ignore: false,
      },
      /* pool.sellBase(address to, uint128 min) */
      {
        operation: PoolRouterActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as ReroutedActions.Args.SELL_BASE, // TODO calc min transfer slippage
        fnName: 'sellBase',
        series,
        ignore: false,
      },
    ];
    await transact('PoolRouter', calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };

  const rollPosition = async (input: string | undefined, fromSeries: ISeries, toSeries: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ROLL_POSITION, fromSeries.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const baseAddress = fromSeries.getBaseAddress();
    const base = assetMap.get(fromSeries.baseId);
    const { fyTokenAddress } = fromSeries;

    const _inputAsFyToken = sellBase(
      fromSeries.baseReserves,
      fromSeries.fyTokenReserves,
      _input,
      secondsToFrom(fromSeries.maturity.toString())
    );
    const _inputAsFyTokenWithSlippage = calculateSlippage(
      _inputAsFyToken,
      userState.slippageTolerance.toString(),
      true
    );

    const permits: ICallData[] = await sign(
      [
        {
          // router.forwardPermit ( fyToken.address, router.address, allowance, deadline, v, r, s )
          target: fromSeries,
          spender: 'POOLROUTER',
          series: fromSeries,
          type: SignType.FYTOKEN,
          message: 'Signing ERC20 Token approval',
          ignore: fromSeries.seriesIsMature,
        },

        /* AFTER MATURITY */
        {
          // ladle.forwardPermitAction(seriesId, false, ladle.address, allowance, deadline, v, r, s)
          target: fromSeries,
          spender: 'LADLE',
          series: fromSeries,
          type: SignType.FYTOKEN,
          message: 'Signing ERC20 Token approval',
          ignore: !fromSeries.seriesIsMature,
        },
      ],
      txCode,
      !fromSeries.seriesIsMature
    );

    const calls: ICallData[] = [
      ...permits,

      /* BEFORE MATURITY */
      {
        // router.transferToPoolAction( base.address, fyToken1.address, fyToken1.address, fyToken1Rolled)
        operation: PoolRouterActions.Fn.TRANSFER_TO_POOL,
        args: [baseAddress, fyTokenAddress, fyTokenAddress, _inputAsFyToken] as PoolRouterActions.Args.TRANSFER_TO_POOL,
        series: fromSeries,
        ignore: fromSeries.seriesIsMature,
      },
      {
        // router.sellFYTokenAction( pool.address, pool2.address, minimumBaseReceived)
        operation: PoolRouterActions.Fn.ROUTE,
        args: [toSeries.poolAddress, _inputAsFyTokenWithSlippage] as ReroutedActions.Args.SELL_FYTOKEN,
        fnName: 'sellFYToken',
        series: fromSeries,
        ignore: fromSeries.seriesIsMature,
      },
      {
        // router.sellBaseAction( pool.address, receiver, minimumFYToken2Received)
        operation: PoolRouterActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as ReroutedActions.Args.SELL_BASE,
        fnName: 'sellBase',
        series: toSeries,
        ignore: fromSeries.seriesIsMature,
      },

      /* AFTER MATURITY */
      {
        // ladle.transferToFYTokenAction(seriesId, fyTokenToRoll)
        operation: LadleActions.Fn.TRANSFER_TO_FYTOKEN,
        args: [fromSeries.id, _input] as LadleActions.Args.TRANSFER_TO_FYTOKEN,
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
        // ladle.sellBaseAction(series2Id, receiver, minimumFYTokenToReceive)
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as ReroutedActions.Args.SELL_BASE,
        fnName: 'sellBase',
        series: toSeries,
        ignore: !fromSeries.seriesIsMature,
      },
    ];
    await transact(
      fromSeries.seriesIsMature ? 'Ladle' : 'PoolRouter', // select router based on if series is seriesIsMature
      calls,
      txCode
    );
    updateSeries([fromSeries, toSeries]);
    updateAssets([base]);
  };

  const closePosition = async (input: string | undefined, series: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.CLOSE_POSITION, series.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const baseAddress = series.getBaseAddress();
    const base = assetMap.get(series.baseId);
    const { fyTokenAddress } = series;

    const _inputAsFyToken = sellBase(
      series.baseReserves,
      series.fyTokenReserves,
      _input,
      secondsToFrom(series.maturity.toString())
    );
    const _inputAsFyTokenWithSlippage = calculateSlippage(
      _inputAsFyToken,
      userState.slippageTolerance.toString(),
      true
    );

    const permits: ICallData[] = await sign(
      [
        {
          target: series,
          spender: 'POOLROUTER',
          series,
          type: SignType.FYTOKEN,
          message: 'Signing ERC20 Token approval',
          ignore: false,
        },
      ],
      txCode,
      true
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: PoolRouterActions.Fn.TRANSFER_TO_POOL,
        args: [baseAddress, fyTokenAddress, fyTokenAddress, _inputAsFyToken] as PoolRouterActions.Args.TRANSFER_TO_POOL,
        series,
        ignore: false,
      },
      {
        operation: PoolRouterActions.Fn.ROUTE,
        args: [account, _inputAsFyTokenWithSlippage] as ReroutedActions.Args.SELL_FYTOKEN, // TODO calc min transfer slippage
        fnName: 'sellFYToken',
        series,
        ignore: false,
      },
    ];
    await transact('PoolRouter', calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };

  const redeem = async (series: ISeries, input: string | undefined) => {
    const txCode = getTxCode(ActionCodes.REDEEM, series.id);
    const base = assetMap.get(series.baseId);
    const _input = input ? ethers.utils.parseEther(input) : series.fyTokenBalance || ethers.constants.Zero;
    const permits: ICallData[] = await sign(
      [
        /* AFTER MATURITY */
        {
          target: series,
          spender: 'LADLE',
          series,
          type: SignType.FYTOKEN,
          message: 'Signing ERC20 Token approval',
          ignore: !series.seriesIsMature,
        },
      ],
      txCode,
      false
    );

    const calls: ICallData[] = [
      ...permits,

      {
        operation: LadleActions.Fn.TRANSFER_TO_FYTOKEN,
        args: [series.id, _input] as LadleActions.Args.TRANSFER_TO_FYTOKEN,
        series,
        ignore: false,
      },

      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, account, ethers.utils.parseEther('1')] as LadleActions.Args.REDEEM,
        series,
        ignore: false,
      },
    ];
    transact('Ladle', calls, txCode);
    updateAssets([base]);
  };

  return {
    lend,
    rollPosition,
    closePosition,
    redeem,
  };
};
