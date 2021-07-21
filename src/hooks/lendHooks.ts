import { ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, IVaultRoot, SignType, ISeries, ActionCodes } from '../types';
import { getTxCode } from '../utils/appUtils';
import { DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../utils/constants';
import { useChain } from './chainHooks';

import { VAULT_OPS, POOLROUTER_OPS } from '../utils/operations';

export const useLend = (input: string | undefined) => {
  const lendMax = input;
  return { lendMax };
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
          ignore: false,
        },
      ],
      txCode,
      true
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [base.address, fyTokenAddress, base.address, _input.toString()],
        series,
        ignore: false,
      },
      /* pool.sellBase(address to, uint128 min) */
      {
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero], // TODO calc min transfer slippage
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
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [baseAddress, fyTokenAddress, fyTokenAddress, _input.toString()],
        series: fromSeries,
        ignore: fromSeries.seriesIsMature,
      },
      {
        // router.sellFYTokenAction( pool.address, pool2.address, minimumBaseReceived)
        operation: POOLROUTER_OPS.ROUTE,
        args: [toSeries.poolAddress, ethers.constants.Zero],
        fnName: 'sellFYToken',
        series: fromSeries,
        ignore: fromSeries.seriesIsMature,
      },
      {
        // router.sellBaseAction( pool.address, receiver, minimumFYToken2Received)
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero],
        fnName: 'sellBase',
        series: toSeries,
        ignore: fromSeries.seriesIsMature,
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
        // ladle.sellBaseAction(series2Id, receiver, minimumFYTokenToReceive)
        operation: VAULT_OPS.ROUTE,
        args: [account, ethers.constants.Zero],
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
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [baseAddress, fyTokenAddress, fyTokenAddress, _input],
        series,
        ignore: false,
      },
      /* pool.sellFyToken(address to, uint128 min) */
      {
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero], // TODO calc min transfer slippage
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
          // ladle.forwardPermitAction(seriesId, false, ladle.address, allowance, deadline, v, r, s)
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
        /* ladle.redeem(bytes6 seriesId, address to, uint256 wad) */ operation: VAULT_OPS.TRANSFER_TO_FYTOKEN,
        args: [series.id, _input],
        series,
        ignore: false,
      },

      {
        /* ladle.redeem(bytes6 seriesId, address to, uint256 wad) */ operation: VAULT_OPS.REDEEM,
        args: [series.id, account, ethers.utils.parseEther('1')],
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
