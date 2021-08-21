import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import {
  ICallData,
  SignType,
  ISeries,
  ActionCodes,
  LadleActions,
  RoutedActions,
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

  const { userState, userActions } = useContext(UserContext);
  const { activeAccount:account, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;

  const { sign, transact } = useChain();

  const lend = async (input: string | undefined, series: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.LEND, series.id);

    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const base = assetMap.get(series.baseId);

    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          series,
          message: 'Signing ERC20 Token approval',
          ignore: false, // ignore if user has previously signed. base.
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [
          base.address,
          series.poolAddress,
          _input.toString(),
        ] as LadleActions.Args.TRANSFER,
        ignore: false,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as RoutedActions.Args.SELL_BASE, // TODO calc minFYToken recieved >  transfer slippage
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract:series.poolContract,
        ignore: false,
      },
    ];

    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };

  const rollPosition = async (input: string | undefined, fromSeries: ISeries, toSeries: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ROLL_POSITION, fromSeries.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const base = assetMap.get(fromSeries.baseId);

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
          target: fromSeries,
          spender: 'LADLE',
          series: fromSeries,
          message: 'Signing ERC20 Token approval',
          ignore: false,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      /* BEFORE MATURITY */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [fromSeries.fyTokenAddress, fromSeries.poolAddress, _inputAsFyToken] as LadleActions.Args.TRANSFER,
        ignore: fromSeries.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [toSeries.poolAddress, ethers.constants.Zero] as RoutedActions.Args.SELL_FYTOKEN,
        fnName: RoutedActions.Fn.SELL_FYTOKEN,
        targetContract:fromSeries.poolContract,
        ignore: fromSeries.seriesIsMature,
      },

      // TODO check if mininumums are the is the correct way around 
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _inputAsFyTokenWithSlippage] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract:toSeries.poolContract,
        ignore: fromSeries.seriesIsMature,
      },

      /* AFTER MATURITY */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [fromSeries.address, toSeries.address, _inputAsFyToken] as LadleActions.Args.TRANSFER,
        ignore: !fromSeries.seriesIsMature,
      },
      {
        // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
        operation: LadleActions.Fn.REDEEM,
        args: [fromSeries.address, toSeries.poolAddress, _inputAsFyToken] as LadleActions.Args.REDEEM,
        ignore: !fromSeries.seriesIsMature,
      },
      {
        // ladle.sellBaseAction(series2Id, receiver, minimumFYTokenToReceive)
        operation: LadleActions.Fn.ROUTE,
        args: [account, _inputAsFyTokenWithSlippage] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract:toSeries.poolContract,
        ignore: !fromSeries.seriesIsMature,
      },
    ];
    await transact(calls, txCode);
    updateSeries([fromSeries, toSeries]);
    updateAssets([base]);
  };

  const closePosition = async (input: string | undefined, series: ISeries) => {

    const txCode = getTxCode(ActionCodes.CLOSE_POSITION, series.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const base = assetMap.get(series.baseId);
    const { fyTokenAddress, poolAddress } = series;

    const _inputAsFyToken = buyBase(
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
          spender: 'LADLE',
          series,
          message: 'Signing ERC20 Token approval',
          ignore: false,
        },
      ],
      txCode,
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [fyTokenAddress, poolAddress, _inputAsFyToken] as LadleActions.Args.TRANSFER,
        ignore: false,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _inputAsFyTokenWithSlippage] as RoutedActions.Args.SELL_FYTOKEN, // TODO calc min transfer slippage
        fnName: RoutedActions.Fn.SELL_FYTOKEN,
        targetContract:series.poolContract,
        ignore: false,
      },
    ];
    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
  };


  /* NB TO DO */
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
          message: 'Signing ERC20 Token approval',
          ignore: !series.seriesIsMature,
        },
      ],
      txCode,
    );

    const calls: ICallData[] = [
      ...permits,

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [ series.poolAddress, account, _input] as LadleActions.Args.TRANSFER,
        ignore: false,
      },
      {
        operation: LadleActions.Fn.REDEEM,
        args: [series.id, account, ethers.utils.parseEther('1')] as LadleActions.Args.REDEEM,
        ignore: false,
      },
    ];
    transact(calls, txCode);
    updateAssets([base]);
  };

  return {
    lend,
    rollPosition,
    closePosition,
    redeem,
  };
};
