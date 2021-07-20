import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, SignType, ISeries, ActionCodes, PoolRouterActions, LadleActions, ReroutedActions } from '../types';
import { getTxCode } from '../utils/appUtils';
import { BLANK_VAULT, DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../utils/constants';
import { useChain } from './chainHooks';

import { calculateSlippage, fyTokenForMint, mint } from '../utils/yieldMath';
import { PoolRouter } from '../contracts';

export const usePool = (input: string | undefined) => {
  const poolMax = input;
  return { poolMax };
};

/* Hook for chain transactions */
export const usePoolActions = () => {
  const {
    chainState: { account, contractMap },
  } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlkId, selectedSeriesId, assetMap } = userState;
  const { updateSeries } = userActions;

  const { sign, transact } = useChain();

  const addLiquidity = async (
    input: string,
    series: ISeries,
    strategy: 'BUY' | 'MINT' = 'BUY' // select a strategy default: BUY
  ) => {
    const txCode = getTxCode(ActionCodes.ADD_LIQUIDITY, series.id);
    const _input = ethers.utils.parseEther(input);
    const base = assetMap.get(series.baseId);

    const _fyTokenToBuy = fyTokenForMint(
      series.baseReserves,
      series.fyTokenRealReserves,
      series.fyTokenReserves,
      _input,
      series.getTimeTillMaturity()
    );

    const permits: ICallData[] = await sign(
      [
        {
          // router.forwardPermitAction( pool.address, base.address, router.address, allowance, deadline, v, r, s),
          target: base,
          series,
          type: DAI_BASED_ASSETS.includes(series.baseId) ? SignType.DAI : SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
          spender: 'POOLROUTER',
          message: 'Signing ERC20 Token approval',
          ignore: false,
        },
      ],
      txCode,
      true
    );

    const calls: ICallData[] = [
      ...permits,

      /**
       * BUYING STRATEGY FLOW:
       * */

      {
        // router.transferToPoolAction(pool.address, base.address, baseWithSlippage),
        operation: PoolRouterActions.Fn.TRANSFER_TO_POOL,
        args: [
          series.getBaseAddress(),
          series.fyTokenAddress,
          series.getBaseAddress(),
          calculateSlippage(_input),
        ] as PoolRouterActions.Args.TRANSFER_TO_POOL,
        series,
        ignore: strategy !== 'BUY',
      },
      {
        // router.mintWithBaseAction(pool.address, receiver, fyTokenToBuy, minLPReceived),
        operation: PoolRouterActions.Fn.ROUTE,
        args: [account, _fyTokenToBuy, ethers.constants.Zero] as ReroutedActions.Args.MINT_WITH_BASE, // TODO calc min transfer slippage
        fnName: 'mintWithBase',
        series,
        ignore: strategy !== 'BUY',
      },

      /**
       * MINT  STRATEGY FLOW: // TODO minting strategy
       * */

      {
        // build Vault with random id if required
        operation: LadleActions.Fn.BUILD,
        args: [selectedSeriesId, selectedIlkId] as LadleActions.Args.BUILD,
        ignore: strategy !== 'MINT',
        series,
      },
      {
        // ladle.serveAction(vaultId, pool.address, 0, borrowed, maximum debt),
        operation: LadleActions.Fn.SERVE,
        args: [
          BLANK_VAULT,
          series.poolAddress,
          ethers.constants.Zero,
          _input.toString(),
          MAX_128,
        ] as LadleActions.Args.SERVE,
        series,
        ignore: strategy !== 'MINT',
      },
      {
        // ladle.mintWithBaseAction(seriesId, receiver, fyTokenToBuy, minLPReceived)
        operation: LadleActions.Fn.ROUTE,
        args: [account, _fyTokenToBuy, ethers.constants.Zero] as ReroutedActions.Args.MINT_WITH_BASE,
        fnName: 'mintWithBase',
        series,
        ignore: strategy !== 'MINT',
      },
    ];

    await transact(
      strategy === 'BUY' ? 'PoolRouter' : 'Ladle', // select router based on strategy
      calls,
      txCode
    );

    updateSeries([series]);
  };

  const rollLiquidity = async (input: string, fromSeries: ISeries, toSeries: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ROLL_LIQUIDITY, fromSeries.id);
    const _input = ethers.utils.parseEther(input);
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
          spender: 'POOLROUTER',
          series: fromSeries,
          type: SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
          message: 'Signing ERC20 Token approval',
          ignore: seriesMature,
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
        // router.transferToPool(base.address, fyToken1.address, pool1.address, WAD)
        operation: PoolRouterActions.Fn.TRANSFER_TO_POOL,
        args: [
          fromSeries.getBaseAddress(),
          fromSeries.fyTokenAddress,
          fromSeries.poolAddress,
          _input,
        ] as PoolRouterActions.Args.TRANSFER_TO_POOL,
        series: fromSeries,
        ignore: seriesMature,
      },
      {
        // router.burnForBase(pool.address, pool2.address, minBaseReceived)
        operation: PoolRouterActions.Fn.ROUTE,
        args: [toSeries.poolAddress, _input] as ReroutedActions.Args.BURN_FOR_BASE,
        fnName: 'burnForBase',
        series: fromSeries,
        ignore: seriesMature,
      },
      {
        // router.mintWithBase( base.address, fyToken2.address, receiver, fyTokenToBuy, minLPReceived)
        operation: PoolRouterActions.Fn.ROUTE,
        args: [account, _fyTokenToBuy, ethers.constants.Zero] as ReroutedActions.Args.MINT_WITH_BASE,
        fnName: 'mintWithBase',
        series: toSeries,
        ignore: seriesMature,
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
        // ladle.mintWithBase(series2Id, receiver, fyTokenToBuy, minLPReceived),
        operation: LadleActions.Fn.ROUTE,
        args: [account, _input, ethers.constants.Zero] as ReroutedActions.Args.MINT_WITH_BASE,
        fnName: 'mintWithBase',
        series: toSeries,
        ignore: !seriesMature,
      },
    ];

    await transact(
      seriesMature ? 'Ladle' : 'PoolRouter', // select router based on if series is seriesIsMature
      calls,
      txCode
    );
    updateSeries([fromSeries, toSeries]);
  };

  const removeLiquidity = async (input: string, series: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_LIQUIDITY, series.id);
    const _input = ethers.utils.parseEther(input);

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
          type: SignType.ERC2612,
          spender: 'POOLROUTER',
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
        // router.transferToPool(base.address, fyToken1.address, pool1.address, WAD)
        operation: PoolRouterActions.Fn.TRANSFER_TO_POOL,
        args: [series.getBaseAddress(), series.fyTokenAddress, series.poolAddress, _input],
        series,
        ignore: series.seriesIsMature,
      },

      // BEFORE MATURITY
      {
        // burnForBase(receiver, minBaseReceived),
        operation: PoolRouterActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as ReroutedActions.Args.BURN_FOR_BASE,
        fnName: 'burnForBase',
        series,
        ignore: series.seriesIsMature,
      },

      // AFTER MATURITY
      {
        // router.transferToPool(base.address, fyToken1.address, pool1.address, WAD)
        operation: PoolRouterActions.Fn.ROUTE,
        args: [series.getBaseAddress(), series.fyTokenAddress, series.poolAddress, _input],
        series,
        ignore: !series.seriesIsMature,
      },
      {
        // burnForBase(receiver, minBaseReceived),
        operation: PoolRouterActions.Fn.ROUTE,
        args: [account, ethers.constants.Zero] as ReroutedActions.Args.BURN_FOR_BASE,
        fnName: 'burnForBase',
        series,
        ignore: !series.seriesIsMature,
      },
    ];
    await transact('PoolRouter', calls, txCode);
    updateSeries([series]);
  };

  return {
    addLiquidity,
    rollLiquidity,
    removeLiquidity,
  };
};
