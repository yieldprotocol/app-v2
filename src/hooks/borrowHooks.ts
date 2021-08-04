import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, IVault, SignType, ISeries, ActionCodes, LadleActions } from '../types';
import { getTxCode } from '../utils/appUtils';
import { ETH_BASED_ASSETS, DAI_BASED_ASSETS, MAX_128, BLANK_VAULT } from '../utils/constants';
import { useChain } from './chainHooks';

import { calculateSlippage } from '../utils/yieldMath';
import { useCollateralActions } from './collateralHooks';

export const useBorrow = () => {
  console.log('use borrow');
};

/* Generic hook for chain transactions */
export const useBorrowActions = () => {
  const {
    chainState: { account },
  } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlkId, selectedSeriesId, seriesMap, assetMap } = userState;
  const { updateVaults, updateAssets } = userActions;

  const { addEth, removeEth } = useCollateralActions();
  const { sign, transact } = useChain();

  const borrow = async (vault: IVault | undefined, input: string | undefined, collInput: string | undefined) => {
    /* use the vault id provided OR 0 if new/ not provided */
    const vaultId = vault?.id || BLANK_VAULT; // ethers.utils.hexlify(ethers.utils.randomBytes(12))

    /* set the series and ilk based on the vault that has been selected or if it's a new vault, get from the globally selected SeriesId */
    const series = vault ? seriesMap.get(vault.seriesId) : seriesMap.get(selectedSeriesId);
    const base = assetMap.get(series.baseId);
    const ilk = vault ? assetMap.get(vault.ilkId) : assetMap.get(selectedIlkId);

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.BORROW, series.id);

    /* parse inputs */
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign(
      [
        {
          target: ilk,
          spender: ilk.joinAddress,
          series,
          type: DAI_BASED_ASSETS.includes(selectedIlkId) ? SignType.DAI : SignType.ERC2612,
          ignore:
            ETH_BASED_ASSETS.includes(selectedIlkId) || ilk.hasJoinAuth /* Ignore if Eth varietal  or already signed */,
        },
      ],
      txCode
    );

    /* Collate all the calls required for the process (including depositing ETH, signing permits, and building vault if needed) */
    const calls: ICallData[] = [
      /* Include all the signatures gathered, if required */
      ...permits,

      /* handle ETH deposit, if required */
      ...addEth(_collInput, series),

      /* If vault is null, build a new vault, else ignore */
      {
        operation: LadleActions.Fn.BUILD,
        args: [selectedSeriesId, selectedIlkId, '0'] as LadleActions.Args.BUILD,
        series,
        ignore: !!vault,
      },
      {
        operation: LadleActions.Fn.SERVE,
        args: [vaultId, account, _collInput, _input, MAX_128] as LadleActions.Args.SERVE,
        ignore: false, // never ignore this
        series,
      },
    ];

    /* handle the transaction */
    await transact('Ladle', calls, txCode);

    /* When complete, update vaults.
      If a vault was provided, update it only,
      else update ALL vaults (by passing an empty array)
    */
    vault ? updateVaults([vault]) : updateVaults([]);
    updateAssets([base, ilk]);
  };

  const repay = async (
    vault: IVault,
    input: string | undefined,
    collInput: string | undefined = '0' // optional - add(+) / remove(-) collateral in same tx.
  ) => {
    const txCode = getTxCode(ActionCodes.REPAY, vault.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = ethers.utils.parseEther(collInput);
    const series = seriesMap.get(vault.seriesId);
    const base = assetMap.get(vault.baseId);
    const _isDaiBased = DAI_BASED_ASSETS.includes(vault.baseId);

    const _inputWithSlippage = calculateSlippage(_input, userState.slippageTolerance.toString(), true);
    // const _collInputWithSlippage = calculateSlippage(_collInput, userState.slippageTolerance.toString());

    const inputGreaterThanDebt: boolean = ethers.BigNumber.from(_input).gte(vault.art);

    const permits: ICallData[] = await sign(
      [
        {
          // before maturity
          target: base,
          spender: 'LADLE',
          series,
          type: _isDaiBased ? SignType.DAI : SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
          message: 'Signing Dai Approval',
          ignore: series.mature || base.hasLadleAuth,
        },
        {
          // after maturity
          target: base,
          spender: base.joinAddress,
          series,
          type: _isDaiBased ? SignType.DAI : SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
          message: 'Signing Dai Approval',
          ignore: !series.mature || base.hasJoinAuth,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.TRANSFER_TO_POOL,
        args: [series.id, true, _input] as LadleActions.Args.TRANSFER_TO_POOL,
        series,
        ignore: series.mature,
      },
      {
        /* ladle.repay(vaultId, owner, repayAmount, minAmountToRepay) */
        operation: LadleActions.Fn.REPAY,
        args: [vault.id, account, ethers.constants.Zero, _inputWithSlippage] as LadleActions.Args.REPAY,
        series,
        ignore: series.mature || inputGreaterThanDebt,
      },
      {
        /* ladle.repayVault(vaultId, owner, inkAmount, maxInkToUse) */
        operation: LadleActions.Fn.REPAY_VAULT,
        args: [vault.id, account, ethers.constants.Zero, ethers.constants.Zero] as LadleActions.Args.REPAY_VAULT,
        series,
        ignore: series.mature || !inputGreaterThanDebt,
      },

      /* AFTER MATURITY */

      {
        /* ladle.repayVault(vaultId, owner, inkRetrieved, MAX) */
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, account, ethers.constants.Zero, _input.mul(-1)] as LadleActions.Args.CLOSE,
        series,
        ignore: !series.mature,
      },
      ...removeEth(_collInput, series),
    ];
    await transact('Ladle', calls, txCode);
    updateVaults([vault]);
    updateAssets([base]);
  };

  const rollDebt = async (vault: IVault, toSeries: ISeries) => {
    const txCode = getTxCode(ActionCodes.ROLL_DEBT, vault.id);
    const series = seriesMap.get(vault.seriesId);
    const base = assetMap.get(vault.baseId);

    const calls: ICallData[] = [
      {
        // ladle.rollAction(vaultId: string, newSeriesId: string, max: BigNumberish)
        operation: LadleActions.Fn.ROLL,
        args: [vault.id, toSeries.id, '2', MAX_128] as LadleActions.Args.ROLL,
        ignore: false,
        series,
      },
    ];
    await transact('Ladle', calls, txCode);
    updateVaults([vault]);
    updateAssets([base]);
  };

  const transfer = async (vault: IVault, to: string) => {
    const txCode = getTxCode(ActionCodes.TRANSFER_VAULT, vault.id);
    const series = seriesMap.get(vault.seriesId);
    const base = assetMap.get(vault.baseId);
    const _isDaiBased = DAI_BASED_ASSETS.includes(vault.baseId);

    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          series,
          type: _isDaiBased ? SignType.DAI : SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
          message: 'Signing Dai Approval',
          ignore: series.mature || base.hasLadleAuth,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.GIVE,
        args: [vault.id, to] as LadleActions.Args.GIVE,
        series,
        ignore: series.mature,
      },
    ];

    await transact('Ladle', calls, txCode);
    updateVaults([]);
  };

  const merge = async (vault: IVault, to: IVault, ink: string, art: string) => {
    const txCode = getTxCode(ActionCodes.MERGE_VAULT, vault.id);
    const series = seriesMap.get(vault.seriesId);
    // const _ink = ink ? ethers.utils.parseEther(ink) : ethers.constants.Zero;
    // const _art = art ? ethers.utils.parseEther(art) : ethers.constants.Zero;

    /* ladle.stir(fromVault, toVault, ink, art) */
    const calls: ICallData[] = [
      {
        operation: LadleActions.Fn.STIR,
        args: [vault.id, to.id, vault.ink, vault.art] as LadleActions.Args.STIR,
        // TODO: #82 refactor to actually allow for custom ink and art values (right now seems like formatting issues) @marcomariscal
        // args: [vault.id, to.id, _ink, _art] as LadleActions.Args.STIR,
        series,
        ignore: series.mature,
      },
    ];
    await transact('Ladle', calls, txCode);
    updateVaults([]);
  };

  // TODO: #72 Refactor to include the ability to destroy when the vault has collateral and debt
  const destroy = async (vault: IVault) => {
    const txCode = getTxCode(ActionCodes.DELETE_VAULT, vault.id);
    const series = seriesMap.get(vault.seriesId);
    const base = assetMap.get(vault.baseId);
    const _isDaiBased = DAI_BASED_ASSETS.includes(vault.baseId);

    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          series,
          type: _isDaiBased ? SignType.DAI : SignType.ERC2612, // Type based on whether a DAI-TyPE base asset or not.
          message: 'Signing Dai Approval',
          ignore: series.mature || base.hasLadleAuth,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.DESTROY,
        args: [vault.id] as LadleActions.Args.DESTROY,
        series,
        ignore: series.mature,
      },
    ];

    await transact('Ladle', calls, txCode);
    updateVaults([]);
  };

  return {
    borrow,
    repay,
    rollDebt,
    transfer,
    merge,
    destroy,
  };
};
