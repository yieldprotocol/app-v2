import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, SignType, ISeries, ActionCodes } from '../types';
import { getTxCode } from '../utils/appUtils';
import { DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../utils/constants';
import { useChain } from './chainHooks';

import { VAULT_OPS, POOLROUTER_OPS } from '../utils/operations';
import { calculateSlippage, fyTokenForMint, mint } from '../utils/yieldMath';

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
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [series.getBaseAddress(), series.fyTokenAddress, series.getBaseAddress(), calculateSlippage(_input)],
        series,
        ignore: strategy !== 'BUY',
      },
      {
        // router.mintWithBaseAction(pool.address, receiver, fyTokenToBuy, minLPReceived),
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, _fyTokenToBuy, ethers.constants.Zero], // TODO calc min transfer slippage
        fnName: 'mintWithBase',
        series,
        ignore: strategy !== 'BUY',
      },

      /**
       * MINT  STRATEGY FLOW: // TODO minting strategy
       * */

      {
        // build Vault with random id if required
        operation: VAULT_OPS.BUILD,
        args: [ethers.utils.hexlify(ethers.utils.randomBytes(12)), selectedSeriesId, selectedIlkId],
        ignore: strategy !== 'MINT',
        series,
      },
      {
        // ladle.serveAction(vaultId, pool.address, 0, borrowed, maximum debt),
        operation: VAULT_OPS.SERVE,
        args: [series.poolAddress, ethers.constants.Zero, _input.toString(), MAX_128],
        series,
        ignore: strategy !== 'MINT',
      },
      {
        // ladle.mintWithBaseAction(seriesId, receiver, fyTokenToBuy, minLPReceived)
        operation: VAULT_OPS.ROUTE,
        args: [account, _fyTokenToBuy, ethers.constants.Zero],
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
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [fromSeries.getBaseAddress(), fromSeries.fyTokenAddress, fromSeries.poolAddress, _input],
        series: fromSeries,
        ignore: seriesMature,
      },
      {
        // router.burnForBase(pool.address, pool2.address, minBaseReceived)
        operation: POOLROUTER_OPS.ROUTE,
        args: [toSeries.poolAddress, _input],
        fnName: 'burnForBase',
        series: fromSeries,
        ignore: seriesMature,
      },
      {
        // router.mintWithBase( base.address, fyToken2.address, receiver, fyTokenToBuy, minLPReceived)
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, _fyTokenToBuy, ethers.constants.Zero],
        fnName: 'mintWithBase',
        series: toSeries,
        ignore: seriesMature,
      },

      /* AFTER MATURITY */

      {
        // ladle.transferToFYTokenAction(seriesId, fyTokenToRoll)
        operation: VAULT_OPS.TRANSFER_TO_FYTOKEN,
        args: [fromSeries.id, _input],
        series: fromSeries,
        ignore: !fromSeries.seriesIsMature,
      },
      {
        // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
        operation: VAULT_OPS.REDEEM,
        args: [fromSeries.id, toSeries.poolAddress, _input],
        series: fromSeries,
        ignore: !fromSeries.seriesIsMature,
      },
      {
        // ladle.mintWithBase(series2Id, receiver, fyTokenToBuy, minLPReceived),
        operation: VAULT_OPS.ROUTE,
        args: [account, _input, ethers.constants.Zero],
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

      // BEFORE MATURITY
      {
        // router.transferToPool(base.address, fyToken1.address, pool1.address, WAD)
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [series.getBaseAddress(), series.fyTokenAddress, series.poolAddress, _input],
        series,
        ignore: series.seriesIsMature,
      },
      {
        // burnForBase(receiver, minBaseReceived),
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero],
        fnName: 'burnForBase',
        series,
        ignore: series.seriesIsMature,
      },

      // AFTER MATURITY
      {
        // router.transferToPool(base.address, fyToken1.address, pool1.address, WAD)
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [series.getBaseAddress(), series.fyTokenAddress, series.poolAddress, _input],
        series,
        ignore: !series.seriesIsMature,
      },
      {
        // burnForBase(receiver, minBaseReceived),
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero],
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
