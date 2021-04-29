import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, ISeriesRoot, IVaultRoot, IVault, SignType, ISeries } from '../types';
import { getTxCode } from '../utils/appUtils';
import { ETH_BASED_ASSETS, DAI_BASED_ASSETS, MAX_128, MAX_256 } from '../utils/constants';
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

  const _addEth = (value: BigNumber): ICallData[] => {
    const isPositive = value.gte(ethers.constants.Zero);

    /* Check if the selected Ilk is, in fact, an ETH variety */
    if (ETH_BASED_ASSETS.includes(selectedIlkId) && isPositive) {
      console.log(selectedIlkId);
      /* return the add ETH OP */
      return [{
        operation: VAULT_OPS.JOIN_ETHER,
        args: [selectedIlkId],
        ignore: false,
        overrides: { value },
      }];
    }
    /* else return empty array */
    return [];
  };

  const _removeEth = (value: BigNumber): ICallData[] => {
    /* First check if the selected Ilk is, in fact, an ETH variety */
    if (ETH_BASED_ASSETS.includes(selectedIlkId)) {
      /* return the remove ETH OP */
      return [{
        operation: VAULT_OPS.EXIT_ETHER,
        args: [selectedIlkId, account],
        ignore: value.gte(ethers.constants.Zero),
      }];
    }
    /* else return empty array */
    return [];
  };

  const addRemoveCollateral = async (
    vault: IVault,
    input: string,
    remove: boolean = false, // add by default
  ) => {
    // ADD ETH
    // ladle.joinEtherAction(ethId),
    // ladle.pourAction(vaultId, ignored, posted, 0),
    // REMOVE ETH
    // ladle.pourAction(vaultId, ladle.address, withdrawn.mul(-1), 0),
    // ladle.exitEtherAction(ethId, owner),
    // ADD ERC20
    // ladle.forwardPermitAction(ilkId, true, ilkJoin.address, posted, deadline, v, r, s),
    // ladle.pourAction(vaultId, ignored, posted, 0),
    // REMOVE ERC20
    // ladle.pourAction(vaultId, receiver, withdrawn.mul(-1), 0),

    /* use the vault id provided OR Get a random vault number ready if reqd. */
    const _vaultId = vault?.id || ethers.utils.hexlify(ethers.utils.randomBytes(12));
    const _series = seriesMap.get(vault.seriesId);

    const _ilk = assetMap.get(vault.ilkId);
    const _isEthBased = ETH_BASED_ASSETS.includes(_ilk.id);

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('000_', _vaultId);

    /* parse inputs to BigNumber and then negate if removing collateral */
    let _input = ethers.utils.parseEther(input);
    if (remove) _input = _input.mul(-1);
    console.log(_input);

    /* check if the ilk/asset is an eth asset variety */
    const _pourTo = _isEthBased ? contractMap.get('Ladle').address : account;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign([
      {
        targetAddress: _ilk.address,
        targetId: _ilk.id,
        type: SignType.ERC2612,
        spender: _ilk.joinAddress,
        series: _series,
        fallbackCall: { fn: 'approve', args: [], ignore: false, opCode: null },
        ignore: _isEthBased || remove,
      },
    ], txCode);

    console.log(_vaultId, account, _input, 0);

    const calls: ICallData[] = [
      ..._addEth(_input),
      ...permits,
      {
        operation: VAULT_OPS.POUR,
        args: [
          _vaultId,
          /* pour destination based on ilk/asset is an eth asset variety */
          _pourTo,
          _input,
          ethers.constants.Zero,
        ],
        ignore: false,
      },
      ..._removeEth(_input),
    ];
    await transact('Ladle', _vaultId, calls, txCode);
    updateVaults([vault]);
  };

  const borrow = async (
    vault: IVault|undefined,
    input: string|undefined,
    collInput: string|undefined,
  ) => {
    /* use the vault id provided OR Get a random vault number ready if reqd. */
    const _vaultId = vault?.id || ethers.utils.hexlify(ethers.utils.randomBytes(12));
    const _series = vault ? seriesMap.get(vault.seriesId) : seriesMap.get(selectedSeriesId);
    const _ilk = vault ? assetMap.get(vault.ilkId) : assetMap.get(selectedIlkId);

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('010_', _vaultId);

    /* parse inputs */
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign([
      {
        targetAddress: _ilk.address,
        targetId: _ilk.id,
        spender: _ilk.joinAddress,
        series: _series,
        type: SignType.ERC2612,
        fallbackCall: { fn: 'approve', args: [], ignore: false, opCode: null },
        ignore: ETH_BASED_ASSETS.includes(selectedIlkId), /* Ignore if Eth varietal */
      },
    ], txCode);

    /* Collate all the calls required for the process (including depositing ETH, signing permits, and building vault if needed) */
    const calls: ICallData[] = [
      /* If vault is null, build a new vault, else ignore */
      ..._buildVault(!!vault),
      /* handle ETH deposit, if required */
      ..._addEth(_collInput),
      /* Include all the signatures gathered, if required  */
      ...permits,
      /* Then add all the CALLS you want to make: */
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
    vault: IVault,
    input:string|undefined,
    collInput: string|undefined = '0', // optional - add(+) / remove(-) collateral in same tx.
  ) => {
    const txCode = getTxCode('020_', vault.seriesId);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = ethers.utils.parseEther(collInput);
    const _series = seriesMap.get(vault.seriesId);
    const _base = assetMap.get(vault.baseId);
    const _isDaiBased = DAI_BASED_ASSETS.includes(vault.baseId);

    const permits: ICallData[] = await sign([
      {
        // before maturity
        targetAddress: _base.address,
        targetId: vault.baseId,
        spender: 'LADLE',
        series: _series,
        type: _isDaiBased ? SignType.DAI : SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle'), MAX_256], ignore: false, opCode: null },
        message: 'Signing Dai Approval',
        ignore: false,
      },
      {
        // after maturity
        targetAddress: _base.address,
        targetId: vault.baseId,
        spender: _base.joinAddress,
        series: _series,
        type: _isDaiBased ? SignType.DAI : SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
        fallbackCall: { fn: 'approve', args: [contractMap.get('Ladle'), MAX_256], ignore: false, opCode: null },
        message: 'Signing Dai Approval',
        ignore: true,
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
    vault: IVaultRoot,
  ) => {
    const txCode = getTxCode('030_', vault.seriesId);
    const calls: ICallData[] = [
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
    series: ISeries,
  ) => {
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;

    const _base = assetMap.get(series.baseId);
    const _isDaiBased = DAI_BASED_ASSETS.includes(series.baseId);

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('040_', series.id);

    const permits: ICallData[] = await sign([
      {
        targetAddress: _base.address,
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
    updateSeries([series]);
  };

  const closePosition = async (
    input: string|undefined,
    series: ISeries,
  ) => {
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('050_', series.id);

    const permits: ICallData[] = await sign([
      {
        targetAddress: series.fyTokenAddress,
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
        args: [series.fyTokenAddress, _input],
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
    await transact('PoolRouter', undefined, calls, txCode);
    updateSeries([series]);
  };

  /**
   * @function addLiquitity
   * @param input
   * @param series
   * @param strategy
   */
  const addLiquidity = async (
    input: string|undefined,
    series: ISeries,
    strategy: 'BUY'|'BORROW' = 'BUY', // select a strategy default: BUY
  ) => {
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;

    /* generate a random vault in case required */
    const _randVaultId = ethers.utils.hexlify(ethers.utils.randomBytes(12));

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode('060_', series.id);

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
      ...permits,
      // BUYING STRATEGY:
      // router.forwardPermitAction( pool.address, base.address, router.address, allowance, deadline, v, r, s),
      // router.transferToPoolAction(pool.address, base.address, baseWithSlippage),
      // router.mintWithBaseTokenAction(pool.address, receiver, fyTokenToBuy, minLPReceived),
      {
        operation: POOLROUTER_OPS.TRANSFER_TO_POOL,
        args: [series.getBaseAddress(), _input.toString()],
        series,
        ignore: strategy === 'BORROW',
      },
      {
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, _input.div(100), ethers.constants.Zero], // TODO calc min transfer slippage
        fnName: 'mintWithBaseToken',
        series,
        ignore: strategy === 'BORROW',
      },

      // TODO BORROWING STRATEGY:
      // buildVault required
      // ladle.serveAction(vaultId, pool.address, 0, borrowed, maximum debt),
      // ladle.mintWithBaseTokenAction(seriesId, receiver, fyTokenToBuy, minLPReceived),

      /* If vault is null, build a new vault, else ignore */
      ..._buildVault(strategy === 'BUY'),
      {
        operation: VAULT_OPS.SERVE,
        args: [series.poolAddress, ethers.constants.Zero, _input.toString(), MAX_128],
        series,
        ignore: strategy === 'BUY',
      },
      {
        operation: VAULT_OPS.ROUTE,
        args: [account, _input.div(100), ethers.constants.Zero],
        fnName: 'mintWithBaseToken',
        series,
        ignore: strategy === 'BUY',
      },
    ];

    await transact(
      (strategy === 'BUY') ? 'PoolRouter' : 'Ladle',
      _randVaultId, // random vaultId if building vault is reqd.
      calls,
      txCode,
    );
    updateSeries([series]);
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
    const txCode = getTxCode('070_', series.id);

    const permits: ICallData[] = await sign([
      {
        targetAddress: series.poolAddress,
        targetId: series.id,
        series,
        type: SignType.ERC2612,
        spender: 'PoolRouter',
        fallbackCall: { fn: 'approve', args: [contractMap.get('Pool'), MAX_256], ignore: false, opCode: null },
        message: 'Signing ERC20 Token approval',
        ignore: false,
      },
    ], txCode);

    const calls: ICallData[] = [
      ...permits,
      // REMOVE & SELL
      // router.forwardPermitAction(pool.address, pool.address, router.address, allowance, deadline, v, r, s),
      // router.burnForBaseToken(pool.address, receiver, minBaseReceived),
      {
        operation: POOLROUTER_OPS.ROUTE,
        args: [account, ethers.constants.Zero, ethers.constants.Zero], // TODO calc min transfer slippage
        fnName: 'burnForBaseToken',
        series,
        ignore: strategy === 'BORROW',
      },
    ];
    await transact('PoolRouter', undefined, calls, txCode);
    updateSeries([series]);
  };

  return { addRemoveCollateral, borrow, repay, redeem, lend, closePosition, addLiquidity, removeLiquidity };
};
