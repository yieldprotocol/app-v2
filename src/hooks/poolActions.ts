import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, SignType, ISeries } from '../types';
import { getTxCode } from '../utils/appUtils';
import { DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../utils/constants';
import { useChain } from './chainHooks';

import { VAULT_OPS, POOLROUTER_OPS } from '../utils/operations';
import { calculateSlippage, fyTokenForMint, mint } from '../utils/yieldMath';

/* Generic hook for chain transactions */
export const usePoolActions = () => {
  const { chainState: { account, contractMap } } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlkId, selectedSeriesId, assetMap } = userState;
  const { updateSeries } = userActions;

  const { sign, transact } = useChain();

  const addLiquidity = async (
    input: string|undefined,
    series: ISeries,
    strategy: 'BUY'|'MINT' = 'BUY', // select a strategy default: BUY
  ) => {
    const txCode = getTxCode('090_', series.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;

    const _fyTokenToBuy = fyTokenForMint(
      series.baseReserves,
      series.fyTokenRealReserves,
      series.fyTokenReserves,
      _input,
      series.getTimeTillMaturity(),
    );

    // const [_tokens, _fyTokenToBuy] = mint(series.baseReserves, series.fyTokenReserves, series.totalSupply, _input);

    console.log(_input.toString());
    console.log(calculateSlippage(_input).toString());
    // console.log(_tokens.toString());
    console.log(_fyTokenToBuy.toString());

    const permits: ICallData[] = await sign([
      {
        targetAddress: assetMap.get(series.baseId).address,
        targetId: series.baseId,
        series,
        type: DAI_BASED_ASSETS.includes(series.baseId) ? SignType.DAI : SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
        spender: 'POOLROUTER',
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: false,
      },
    ], txCode, true);

    const calls: ICallData[] = [

      /**
       * BUYING STRATEGY FLOW:
       * */

      // router.forwardPermitAction( pool.address, base.address, router.address, allowance, deadline, v, r, s),
      ...permits,
      // router.transferToPoolAction(pool.address, base.address, baseWithSlippage),
      {
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [series.getBaseAddress(), series.fyTokenAddress, series.getBaseAddress(), calculateSlippage(_input)],
        series,
        ignore: strategy !== 'BUY',
      },
      // router.mintWithBaseAction(pool.address, receiver, fyTokenToBuy, minLPReceived),
      {
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, _fyTokenToBuy, ethers.constants.Zero], // TODO calc min transfer slippage
        fnName: 'mintWithBase',
        series,
        ignore: strategy !== 'BUY',
      },

      /**
       * MINT  STRATEGY FLOW: // TODO minting strategy
       * */

      // build Vault with random id if required
      {
        operation: VAULT_OPS.BUILD,
        args: [ethers.utils.hexlify(ethers.utils.randomBytes(12)), selectedSeriesId, selectedIlkId],
        ignore: strategy !== 'MINT',
        series,
      },
      // ladle.serveAction(vaultId, pool.address, 0, borrowed, maximum debt),
      {
        operation: VAULT_OPS.SERVE,
        args: [series.poolAddress, ethers.constants.Zero, _input.toString(), MAX_128],
        series,
        ignore: strategy !== 'MINT',
      },
      // ladle.mintWithBaseAction(seriesId, receiver, fyTokenToBuy, minLPReceived)
      {
        operation: VAULT_OPS.ROUTE,
        args: [account, _fyTokenToBuy, ethers.constants.Zero],
        fnName: 'mintWithBase',
        series,
        ignore: strategy !== 'MINT',
      },
    ];

    await transact(
      (strategy === 'BUY') ? 'PoolRouter' : 'Ladle', // select router based on strategy
      calls,
      txCode,
    );

    updateSeries([series]);
  };

  const rollLiquidity = async (
    input: string|undefined,
    fromSeries: ISeries,
    toSeries: ISeries,
  ) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('100_', fromSeries.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const seriesMature = fromSeries.isMature();

    const _fyTokenToBuy = fyTokenForMint(
      toSeries.baseReserves,
      toSeries.fyTokenRealReserves,
      toSeries.fyTokenReserves,
      _input,
      toSeries.getTimeTillMaturity(),
    );

    const permits: ICallData[] = await sign([

      /* BEFORE MATURITY */

      { // router.forwardPermitAction(pool.address, pool.address, router.address, allowance, deadline, v, r, s )
        targetAddress: fromSeries.poolAddress,
        targetId: fromSeries.id,
        spender: 'POOLROUTER',
        series: fromSeries,
        type: SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
        fallbackCall: { fn: 'approve', args: [contractMap.get('PoolRouter'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: seriesMature,
      },

      /* AFTER MATURITY */

      { // ladle.forwardPermitAction(seriesId, false, ladle.address, allowance, deadline, v, r, s)
        targetAddress: fromSeries.fyTokenAddress,
        targetId: fromSeries.id,
        spender: 'LADLE',
        series: fromSeries,
        type: SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
        fallbackCall: { fn: 'approve', args: [contractMap.get('PoolRouter'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: !seriesMature,
      },

    ], txCode, true);

    const calls: ICallData[] = [
      ...permits,

      /* BEFORE MATURITY */

      { // router.BurnForBase(pool.address, pool2.address, minBaseReceived)
        operation: POOLROUTER_OPS.ROUTE,
        args: [toSeries.poolAddress, _input],
        fnName: 'BurnForBase',
        series: fromSeries,
        ignore: seriesMature,
      },
      { // router.mintWithBaseAction( base.address, fyToken2.address, receiver, fyTokenToBuy, minLPReceived)
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, _fyTokenToBuy, ethers.constants.Zero],
        fnName: 'mintWithBase',
        series: toSeries,
        ignore: seriesMature,
      },

      /* AFTER MATURITY */

      { // ladle.transferToFYTokenAction(seriesId, fyTokenToRoll)
        operation: VAULT_OPS.TRANSFER_TO_FYTOKEN,
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
      { // ladle.mintWithBaseAction(series2Id, receiver, fyTokenToBuy, minLPReceived),
        operation: VAULT_OPS.ROUTE,
        args: [toSeries.id, account, _input, ethers.constants.Zero],
        fnName: 'mintWithBase',
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

  const removeLiquidity = async (
    series: ISeries,
  ) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('110_', series.id);

    const permits: ICallData[] = await sign([
      { // router.forwardPermitAction(pool.address, pool.address, router.address, allowance, deadline, v, r, s),
        targetAddress: series.poolAddress,
        targetId: series.id,
        series,
        type: SignType.ERC2612,
        spender: 'POOLROUTER',
        fallbackCall: { fn: 'approve', args: [contractMap.get('Pool'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: false,
      },
    ], txCode, true);

    const calls: ICallData[] = [
      ...permits,
      { // BurnForBase(receiver, minBaseReceived),
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero],
        fnName: 'BurnForBase',
        series,
        ignore: false,
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
