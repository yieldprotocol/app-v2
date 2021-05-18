import { ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, IVaultRoot, SignType, ISeries } from '../types';
import { getTxCode } from '../utils/appUtils';
import { DAI_BASED_ASSETS, MAX_256 } from '../utils/constants';
import { useChain } from './chainHooks';

import { VAULT_OPS, POOLROUTER_OPS } from '../utils/operations';

/* Generic hook for chain transactions */
export const useLendActions = () => {
  const { chainState: { account, contractMap } } = useContext(ChainContext);
  const { userActions } = useContext(UserContext);
  const { updateSeries } = userActions;

  const { sign, transact } = useChain();

  const lend = async (
    input: string|undefined,
    series: ISeries,
  ) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('060_', series.id);

    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const baseAddress = series.getBaseAddress();
    const { fyTokenAddress } = series;

    const _isDaiBased = DAI_BASED_ASSETS.includes(series.baseId);

    const permits: ICallData[] = await sign([
      {
        targetAddress: baseAddress,
        targetId: series.baseId,
        spender: 'POOLROUTER',
        series,
        type: _isDaiBased ? SignType.DAI : SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: false,
      },
    ], txCode, true);

    const calls: ICallData[] = [
      ...permits,
      {
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [baseAddress, fyTokenAddress, baseAddress, _input.toString()],
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
  };

  const rollPosition = async (
    input: string|undefined,
    fromSeries: ISeries,
    toSeries: ISeries,
  ) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('070_', fromSeries.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const baseAddress = fromSeries.getBaseAddress();
    const { fyTokenAddress } = fromSeries;

    const seriesMature = fromSeries.isMature();

    const permits: ICallData[] = await sign([
      { // router.forwardPermit ( fyToken.address, router.address, allowance, deadline, v, r, s )
        targetAddress: fyTokenAddress,
        targetId: fromSeries.id,
        spender: 'POOLROUTER',
        series: fromSeries,
        type: SignType.FYTOKEN, // Type based on whether a DAI-TyPE base asset or not.
        fallbackCall: { fn: 'approve', args: [contractMap.get('PoolRouter'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: seriesMature,
      },

      /* AFTER MATURITY */

      { // ladle.forwardPermitAction(seriesId, false, ladle.address, allowance, deadline, v, r, s)
        targetAddress: fyTokenAddress,
        targetId: fromSeries.id,
        spender: 'LADLE',
        series: fromSeries,
        type: SignType.FYTOKEN, // Type based on whether a DAI-TyPE base asset or not.
        fallbackCall: { fn: 'approve', args: [contractMap.get('PoolRouter'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: !seriesMature,
      },

    ], txCode, true);

    const calls: ICallData[] = [

      ...permits,

      /* BEFORE MATURITY */

      { // router.transferToPoolAction( base.address, fyToken1.address, fyToken1.address, fyToken1Rolled)
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [baseAddress, fyTokenAddress, fyTokenAddress, _input.toString()],
        series: fromSeries,
        ignore: seriesMature,
      },
      { // router.sellFYTokenAction( pool.address, pool2.address, minimumBaseReceived)
        operation: POOLROUTER_OPS.ROUTE,
        args: [toSeries.poolAddress, ethers.constants.Zero],
        fnName: 'sellFYToken',
        series: fromSeries,
        ignore: seriesMature,
      },
      { // router.sellBaseAction( pool.address, receiver, minimumFYToken2Received)
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero],
        fnName: 'sellBase',
        series: toSeries,
        ignore: seriesMature,
      },

      /* AFTER MATURITY */

      { // ladle.transferToFYTokenAction(seriesId, fyTokenToRoll)
        operation: VAULT_OPS.TRANSFER_TO_POOL,
        args: [fromSeries.id, true, _input.toString()],
        series: fromSeries,
        ignore: !seriesMature,
      },
      { // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
        operation: VAULT_OPS.REDEEM,
        args: [fromSeries.id, toSeries.poolAddress, ethers.constants.Zero],
        series: fromSeries,
        ignore: !seriesMature,
      },
      { // ladle.sellBaseAction(series2Id, receiver, minimumFYTokenToReceive)
        operation: VAULT_OPS.ROUTE,
        args: [toSeries.id, account, ethers.constants.Zero],
        fnName: 'sellBase',
        series: toSeries,
        ignore: !seriesMature,
      },
    ];
    await transact(
      seriesMature ? 'Ladle' : 'PoolRouter', // select router based on if series is mature
      calls,
      txCode,
    );
    updateSeries([fromSeries, toSeries]);
  };

  const closePosition = async (
    input: string|undefined,
    series: ISeries,
  ) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('080_', series.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const baseAddress = series.getBaseAddress();
    const { fyTokenAddress } = series;

    const permits: ICallData[] = await sign([
      {
        targetAddress: fyTokenAddress,
        targetId: series.id,
        spender: 'POOLROUTER',
        series,
        type: SignType.FYTOKEN,
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: false,
      },
    ], txCode, true);

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
  };

  const redeem = async (
    series: ISeries,
  ) => {
    const txCode = getTxCode('050_', series.id);
    const calls: ICallData[] = [
      /* ladle.redeem(bytes6 seriesId, address to, uint256 wad) */
      {
        operation: VAULT_OPS.REDEEM,
        args: [account, MAX_256], // TODO calc max transfer
        ignore: false,
        series,
      },
    ];
    transact('Ladle', calls, txCode);
  };

  return {
    lend,
    rollPosition,
    closePosition,
    redeem,
  };
};
