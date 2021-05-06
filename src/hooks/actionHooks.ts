import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, IVaultRoot, IVault, SignType, ISeries } from '../types';
import { getTxCode } from '../utils/appUtils';
import { ETH_BASED_ASSETS, DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../utils/constants';
import { useChain } from './chainHooks';

import { VAULT_OPS, POOLROUTER_OPS } from '../utils/operations';

/* Generic hook for chain transactions */
export const useActions = () => {
  const { chainState: { account, contractMap } } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlkId, selectedSeriesId, seriesMap, assetMap } = userState;
  const { updateVaults, updateSeries } = userActions;

  const { sign, transact } = useChain();

  const OVERRIDES = { gasLimit: 1_000_000 };

  const _addEth = (value: BigNumber, series:ISeries): ICallData[] => {
    const isPositive = value.gte(ethers.constants.Zero);
    /* Check if the selected Ilk is, in fact, an ETH variety */
    if (ETH_BASED_ASSETS.includes(selectedIlkId) && isPositive) {
      /* return the add ETH OP */
      return [{
        operation: VAULT_OPS.JOIN_ETHER,
        args: [selectedIlkId],
        ignore: false,
        overrides: { value },
        series,
      }];
    }
    /* else return empty array */
    return [];
  };

  const _removeEth = (value: BigNumber, series:ISeries): ICallData[] => {
    /* First check if the selected Ilk is, in fact, an ETH variety */
    if (ETH_BASED_ASSETS.includes(selectedIlkId)) {
      /* return the remove ETH OP */
      return [{
        operation: VAULT_OPS.EXIT_ETHER,
        args: [selectedIlkId, account],
        ignore: value.gte(ethers.constants.Zero),
        series,
      }];
    }
    /* else return empty array */
    return [];
  };

  const addCollateral = async (
    vault: IVault|undefined,
    input: string,
  ) => {
    /* use the vault id provided OR Get a random vault number ready if reqd. */
    const vaultId = vault?.id || ethers.utils.hexlify(ethers.utils.randomBytes(12));
    /* set the series and ilk based on if a vault has been selected or it's a new vault */
    const series = vault ? seriesMap.get(vault.seriesId) : seriesMap.get(selectedSeriesId);
    const ilk = vault ? assetMap.get(vault.ilkId) : assetMap.get(selectedIlkId);
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('000_', vaultId);

    /* parse inputs to BigNumber in Wei */
    const _input = ethers.utils.parseEther(input);

    /* check if the ilk/asset is an eth asset variety, if so pour to Ladle */
    const _isEthBased = ETH_BASED_ASSETS.includes(ilk.id);
    const _pourTo = ETH_BASED_ASSETS.includes(ilk.id) ? contractMap.get('Ladle').address : account;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign([
      {
        targetAddress: ilk.address,
        targetId: ilk.id,
        type: SignType.ERC2612,
        spender: ilk.joinAddress,
        series,
        fallbackCall: { fn: 'approve', args: [], ignore: false, opCode: null },
        ignore: _isEthBased,
      },
    ], txCode);

    const calls: ICallData[] = [
      /* If vault is null, build a new vault, else ignore */
      {
        operation: VAULT_OPS.BUILD,
        args: [vaultId, selectedSeriesId, selectedIlkId],
        series,
        ignore: !!vault,
      },
      // ladle.joinEtherAction(ethId),
      ..._addEth(_input, series),
      // ladle.forwardPermitAction(ilkId, true, ilkJoin.address, posted, deadline, v, r, s)
      ...permits,
      // ladle.pourAction(vaultId, ignored, posted, 0)
      {
        operation: VAULT_OPS.POUR,
        args: [
          vaultId,
          _pourTo, /* pour destination based on ilk/asset is an eth asset variety */
          _input.toString(),
          ethers.constants.Zero,
        ],
        series,
        ignore: false,
      },
    ];

    await transact('Ladle', calls, txCode);
    updateVaults([vault]);
  };

  const removeCollateral = async (
    vault: IVault,
    input: string,
  ) => {
    /* generate the txCode for tx tracking and tracing */
    const txCode = getTxCode('010_', vault.id);

    /* get associated series and ilk */
    const series = seriesMap.get(vault.seriesId);
    const ilk = assetMap.get(vault.ilkId);

    /* parse inputs to BigNumber in Wei, and NEGATE */
    const _input = ethers.utils.parseEther(input).mul(-1);

    /* check if the ilk/asset is an eth asset variety, if so pour to Ladle */
    const _pourTo = ETH_BASED_ASSETS.includes(ilk.id) ? contractMap.get('Ladle').address : account;

    const calls: ICallData[] = [
      // ladle.pourAction(vaultId, ignored, -posted, 0)
      {
        operation: VAULT_OPS.POUR,
        args: [
          vault.id,
          _pourTo, /* pour destination based on ilk/asset is an eth asset variety */
          _input.toString(),
          ethers.constants.Zero,
        ],
        series,
        ignore: false,
      },
      ..._removeEth(_input, series),
    ];

    await transact('Ladle', calls, txCode);
    updateVaults([vault]);
  };

  const borrow = async (
    vault: IVault|undefined,
    input: string|undefined,
    collInput: string|undefined,
  ) => {
    /* use the vault id provided OR Get a random vault number ready if reqd. */
    const vaultId = vault?.id || ethers.utils.hexlify(ethers.utils.randomBytes(12));
    /* set the series and ilk based on if a vault has been selected or it's a new vault */
    const series = vault ? seriesMap.get(vault.seriesId) : seriesMap.get(selectedSeriesId);
    const ilk = vault ? assetMap.get(vault.ilkId) : assetMap.get(selectedIlkId);
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('020_', vaultId);

    /* parse inputs */
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign([
      {
        targetAddress: ilk.address,
        targetId: ilk.id,
        spender: ilk.joinAddress,
        series,
        type: SignType.ERC2612,
        fallbackCall: { fn: 'approve', args: [], ignore: false, opCode: null },
        ignore: ETH_BASED_ASSETS.includes(selectedIlkId), /* Ignore if Eth varietal */
      },
    ], txCode);

    /* Collate all the calls required for the process (including depositing ETH, signing permits, and building vault if needed) */
    const calls: ICallData[] = [
      /* If vault is null, build a new vault, else ignore */
      {
        operation: VAULT_OPS.BUILD,
        args: [vaultId, selectedSeriesId, selectedIlkId],
        series,
        ignore: !!vault,
      },
      /* handle ETH deposit, if required */
      ..._addEth(_collInput, series),
      /* Include all the signatures gathered, if required  */
      ...permits,
      {
        operation: VAULT_OPS.SERVE,
        args: [vaultId, account, _collInput, _input, MAX_128],
        ignore: false,
        series,
      },
    ];

    /* handle the transaction */
    await transact('Ladle', calls, txCode);
    /* when complete, then update the changed elements */
    vault && updateVaults([vault]);
  };

  const repay = async (
    vault: IVault,
    input:string|undefined,
    collInput: string|undefined = '0', // optional - add(+) / remove(-) collateral in same tx.
  ) => {
    const txCode = getTxCode('030_', vault.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = ethers.utils.parseEther(collInput);
    const series = seriesMap.get(vault.seriesId);
    const base = assetMap.get(vault.baseId);
    const _isDaiBased = DAI_BASED_ASSETS.includes(vault.baseId);

    const permits: ICallData[] = await sign([
      {
        // before maturity
        targetAddress: base.address,
        targetId: base.id,
        spender: 'LADLE',
        series,
        type: _isDaiBased ? SignType.DAI : SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle'), MAX_256], ignore: false, opCode: null },
        message: 'Signing Dai Approval',
        ignore: false,
      },
      {
        // after maturity
        targetAddress: base.address,
        targetId: base.id,
        spender: base.joinAddress,
        series,
        type: _isDaiBased ? SignType.DAI : SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle'), MAX_256], ignore: false, opCode: null },
        message: 'Signing Dai Approval',
        ignore: true,
      },
    ], txCode);

    const calls: ICallData[] = [
      ...permits,
      {
        operation: VAULT_OPS.TRANSFER_TO_POOL,
        args: [series.id, true, _input],
        series,
        ignore: false,
      },
      /* ladle.repay(vaultId, owner, inkRetrieved, 0) */
      {
        operation: VAULT_OPS.REPAY,
        args: [vault.id, account, _collInput, ethers.constants.Zero],
        series,
        ignore: false,
      },
      /* ladle.repayVault(vaultId, owner, inkRetrieved, MAX) */
      {
        operation: VAULT_OPS.REPAY_VAULT,
        args: [vault.id, account, BigNumber.from('1'), MAX_128],
        series,
        ignore: true, // TODO add in repay all logic
      },
    ];
    await transact('Ladle', calls, txCode);
    updateVaults([vault]);
  };

  const rollDebt = async (
    vault: IVault,
    toSeries: ISeries,
    input: string | undefined,
  ) => {
    const txCode = getTxCode('040_', vault.seriesId);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const series = seriesMap.get(vault.seriesId);
    const calls: ICallData[] = [
      { // ladle.rollAction(vaultId: string, newSeriesId: string, max: BigNumberish)
        operation: VAULT_OPS.ROLL,
        args: [vault.id, toSeries.id, MAX_128],
        ignore: false,
        series,
      },
    ];
    await transact('Ladle', calls, txCode);
    updateVaults([vault]);
  };

  const redeem = async (
    vault: IVaultRoot,
  ) => {
    const txCode = getTxCode('050_', vault.seriesId);
    const series = seriesMap.get(vault.seriesId);

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
      /* pool.sellBaseToken(address to, uint128 min) */
      {
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero], // TODO calc min transfer slippage
        fnName: 'sellBaseToken',
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
      { // router.sellBaseTokenAction( pool.address, receiver, minimumFYToken2Received)
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero],
        fnName: 'sellBaseToken',
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
      { // ladle.sellBaseTokenAction(series2Id, receiver, minimumFYTokenToReceive)
        operation: VAULT_OPS.ROUTE,
        args: [toSeries.id, account, ethers.constants.Zero],
        fnName: 'sellBaseToken',
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

  const addLiquidity = async (
    input: string|undefined,
    series: ISeries,
    strategy: 'BUY'|'MINT' = 'BUY', // select a strategy default: BUY
  ) => {
    const txCode = getTxCode('090_', series.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;

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
        args: [series.getBaseAddress(), series.fyTokenAddress, series.getBaseAddress(), _input.toString()],
        series,
        ignore: strategy !== 'BUY',
      },
      // router.mintWithBaseTokenAction(pool.address, receiver, fyTokenToBuy, minLPReceived),
      {
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, _input.div(100), ethers.constants.Zero], // TODO calc min transfer slippage
        fnName: 'mintWithBaseToken',
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
      // ladle.mintWithBaseTokenAction(seriesId, receiver, fyTokenToBuy, minLPReceived)
      {
        operation: VAULT_OPS.ROUTE,
        args: [account, _input.div(100), ethers.constants.Zero],
        fnName: 'mintWithBaseToken',
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
      // ...permits,

      /* BEFORE MATURITY */

      { // router.burnForBaseToken(pool.address, pool2.address, minBaseReceived)
        operation: POOLROUTER_OPS.ROUTE,
        args: [toSeries.poolAddress, _input, _input.div(100)],
        fnName: 'burnForBaseToken',
        series: fromSeries,
        ignore: seriesMature,
      },
      { // router.mintWithBaseTokenAction( base.address, fyToken2.address, receiver, fyTokenToBuy, minLPReceived)
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, _input.div(100), ethers.constants.Zero],
        fnName: 'mintWithBaseToken',
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
      { // ladle.mintWithBaseTokenAction(series2Id, receiver, fyTokenToBuy, minLPReceived),
        operation: VAULT_OPS.ROUTE,
        args: [toSeries.id, account, _input, ethers.constants.Zero],
        fnName: 'mintWithBaseToken',
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
    input: string|undefined,
    series: ISeries,
    strategy: null = null, // select a strategy
  ) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    // const txCode = getTxCode('020_', vault.series.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;

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
    ], txCode);

    const calls: ICallData[] = [
      ...permits,
      { // router.burnForBaseToken(pool.address, receiver, minBaseReceived),
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero, ethers.constants.Zero],
        fnName: 'burnForBaseToken',
        series,
        ignore: false,
      },
    ];
    await transact('PoolRouter', calls, txCode);
    updateSeries([series]);
  };

  return {
    addCollateral,
    removeCollateral,
    borrow,
    repay,
    rollDebt,
    redeem,
    lend,
    rollPosition,
    closePosition,
    addLiquidity,
    rollLiquidity,
    removeLiquidity,
  };
};
