import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, IseriesRoot, IvaultRoot, IVault, SignType } from '../types';
import { getTxCode } from '../utils/appUtils';
import { MAX_128, MAX_256 } from '../utils/constants';
import { useChain } from './chainHooks';

import { VAULT_OPS, POOLROUTER_OPS } from '../utils/operations';

/* Generic hook for chain transactions */
export const useActions = () => {
  const { chainState: { account, contractMap, assetRootMap } } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlkId, selectedSeriesId, seriesMap, assetMap } = userState;
  const { updateVaults, updateSeries } = userActions;

  const { sign, transact } = useChain();

  /**
   * Common internal ICalldata builders:
   *  - Create a call that builds a new Vault
   *  - Create a call that takes ETH, wraps it, and adds it as collateral
   * */
  const _buildVault = (ignore:boolean): ICallData[] => (
    [{
      operation: VAULT_OPS.BUILD,
      args: [selectedSeriesId, selectedIlkId],
      ignore,
    }]
  );

  const _depositEth = (value: BigNumber): ICallData[] => (
    /* First check if the selected Ilk is an ETH variety :  */
    ['0x455448000000', 'ETH_B_forexample'].includes(selectedIlkId)
      ? [{
        operation: VAULT_OPS.JOIN_ETHER,
        args: [selectedIlkId],
        ignore: false,
        overrides: { value },
      }]
      : []
  );

  const borrow = async (
    vault: IVault|undefined,
    input: string|undefined,
    collInput: string|undefined,
  ) => {
    /* use the vault id provided OR Get a random vault number ready if reqd. */
    const _vaultId = vault?.id || ethers.utils.hexlify(ethers.utils.randomBytes(12));
    const _series = vault ? seriesMap.get(vault.seriesId) : seriesMap.get(selectedSeriesId);

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('010_', _vaultId);

    /* parse inputs */
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign([
      {
        asset: assetMap.get(selectedIlkId),
        series: _series,
        type: SignType.ERC2612,
        spender: 'JOIN',
        fallbackCall: { fn: 'approve', args: [], ignore: false, opCode: null },
        ignore: selectedIlkId === '0x455448000000',
      },
    ], txCode);

    /* Collate all the calls required for the process (including depositing ETH, signing permits, and building vault if needed) */
    const calls: ICallData[] = [
      /* If vault is null, build a new vault, else ignore */
      ..._buildVault(!!vault),
      /* handle ETH deposit, if required */
      ..._depositEth(_collInput),
      /* Include all the signatures gathered, if required  */
      ...permits,
      /* Then add all the CALLS you want to make: */
      {
        operation: VAULT_OPS.POUR,
        args: [_vaultId, account, _collInput, _input],
        ignore: true,
      },
      {
        operation: VAULT_OPS.SERVE,
        args: [account, _collInput, _input, MAX_128],
        ignore: false,
      },
    ];
    /* handle the transaction */
    await transact('Ladle', _vaultId, calls, txCode);
    // then update the changed elements
    vault && updateVaults([vault]);
  };

  const repay = async (
    vault: IvaultRoot,
    input:string|undefined,
    collInput: string|undefined = '0', // optional - add(+) / remove(-) collateral in same tx.
  ) => {
    const txCode = getTxCode('020_', vault.seriesId);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = ethers.utils.parseEther(collInput);

    const _series = seriesMap.get(vault.seriesId);

    console.log(vault);
    console.log(assetMap.get(vault.baseId));

    const permits: ICallData[] = await sign([
      {
        asset: assetMap.get(vault.baseId),
        series: _series,
        type: SignType.DAI,
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle'), MAX_256], ignore: false, opCode: null },
        message: 'Signing Dai Approval',
        ignore: false,
      },
    ], txCode);

    const calls: ICallData[] = [
      ...permits,
      /* transferToPool(bytes6 seriesId, bool base, uint128 wad) */
      {
        operation: VAULT_OPS.TRANSFER_TO_POOL,
        args: [true, _input],
        ignore: false,
      },
      /* ladle.repay(vaultId, owner, inkRetrieved, 0) */
      {
        operation: VAULT_OPS.REPAY,
        args: [account, _collInput, ethers.constants.Zero],
        ignore: false,
      },
      /* ladle.repayVault(vaultId, owner, inkRetrieved, MAX) */
      {
        operation: VAULT_OPS.REPAY_VAULT,
        args: [account, BigNumber.from('1'), MAX_128],
        ignore: true, // TODO add in repay all logic
      },
    ];
    await transact('Ladle', vault.id, calls, txCode);
    updateVaults([vault]);
  };

  const redeem = async (
    vault: IvaultRoot,
    input: string|undefined,
  ) => {
    const txCode = getTxCode('030_', vault.seriesId);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _series = seriesMap.get(vault.seriesId);

    const permits: ICallData[] = await sign([
      {
        asset: assetRootMap.get(vault.baseId),
        series: _series,
        type: SignType.ERC2612,
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle').address, MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: true,
      },
      {
        asset: assetRootMap.get(vault.baseId),
        series: _series,
        type: SignType.DAI,
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle').address, MAX_256], ignore: false, opCode: null },
        message: 'Signing Dai Approval',
        ignore: true,
      },
    ], txCode);

    const calls: ICallData[] = [
      ...permits,
      // /* ladle.transferToFYToken(bytes6 seriesId, uint256 wad) */
      {
        operation: VAULT_OPS.TRANSFER_TO_FYTOKEN,
        args: [_input],
        ignore: false,
      },
      /* ladle.redeem(bytes6 seriesId, address to, uint256 wad) */
      {
        operation: VAULT_OPS.REDEEM,
        args: [account, MAX_256], // TODO calc max transfer
        ignore: false,
      },
    ];
    transact('Ladle', vault.id, calls, txCode);
  };

  const lend = async (
    input: string|undefined,
    series: IseriesRoot,
  ) => {
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('040_', series.id);

    const permits: ICallData[] = await sign([
      {
        asset: assetRootMap.get(series.baseId),
        series,
        type: SignType.ERC2612,
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: true,
      },
      {
        asset: assetRootMap.get(series.baseId),
        series,
        type: SignType.DAI,
        spender: 'PoolRouter',
        fallbackCall: { fn: 'approve', args: [], ignore: false, opCode: null },
        ignore: false,
      },
    ], txCode, true);

    const calls: ICallData[] = [
      ...permits,
      {
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [series.getBaseAddress(), _input.toString()],
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
    await transact('PoolRouter', undefined, calls, txCode);
    series && updateSeries([series]);
  };

  const closePosition = async (
    input: string|undefined,
    series: IseriesRoot,
  ) => {
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('050_', series.id);

    const permits: ICallData[] = await sign([
      {
        asset: assetRootMap.get(series.baseId),
        series,
        type: SignType.ERC2612,
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: true,
      },
      {
        asset: assetRootMap.get(series.baseId),
        series,
        type: SignType.DAI,
        spender: 'PoolRouter',
        fallbackCall: { fn: 'approve', args: [], ignore: false, opCode: null },
        ignore: false,
      },
    ], txCode, true);

    const calls: ICallData[] = [
      ...permits,
      /* pool.sellFyToken(address to, uint128 min) */
      {
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero], // TODO calc min transfer slippage
        fnName: 'sellFYToken',
        series,
        ignore: false,
      },
      /* pool.sellBaseToken(address to, uint128 min) */
      {
        operation: POOLROUTER_OPS.ROUTE,
        args: [account],
        fnName: 'retrieveBaseToken',
        series,
        ignore: false,
      },
    ];
    transact('PoolRouter', undefined, calls, txCode);
  };

  const addLiquidity = async (
    input: string|undefined,
    series: IseriesRoot,
  ) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    // const txCode = getTxCode('020_', vault.series.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('060_', series.id);

    const permits: ICallData[] = await sign([
      {
        asset: assetRootMap.get(series.baseId),
        series,
        type: SignType.ERC2612,
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: true,
      },
      {
        asset: assetRootMap.get(series.baseId),
        series,
        type: SignType.DAI,
        spender: 'PoolRouter',
        fallbackCall: { fn: 'approve', args: [], ignore: false, opCode: null },
        ignore: true,
      },
    ], txCode, true);

    const calls: ICallData[] = [
      ...permits,
      {
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [series.getBaseAddress(), _input.toString()],
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
    transact('PoolRouter', undefined, calls, txCode);
  };

  const removeLiquidity = async () => {
    /* generate the reproducible txCode for tx tracking and tracing */
    // const txCode = getTxCode('020_', vault.series.id);
  };

  return { borrow, repay, redeem, lend, closePosition, addLiquidity, removeLiquidity };
};
