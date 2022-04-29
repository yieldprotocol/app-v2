import { ethers } from 'ethers';
import { useContext } from 'react';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import {
  ICallData,
  IVault,
  ActionCodes,
  LadleActions,
  ISeries,
  IAsset,
  IUserContext,
  IUserContextActions,
  IUserContextState,
} from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, ONE_BN, ZERO_BN } from '../../utils/constants';

import { CONVEX_BASED_ASSETS, ETH_BASED_ASSETS } from '../../config/assets';
import { buyBase, calculateSlippage } from '../../utils/yieldMath';
import { useChain } from '../useChain';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ChainContext } from '../../contexts/ChainContext';

export const useBorrow = () => {
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const {
    settingsState: { slippageTolerance },
  } = useContext(SettingsContext);

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;

  const { activeAccount: account, selectedIlk, selectedSeries, seriesMap, assetMap } = userState;
  const { updateVaults, updateAssets, updateSeries } = userActions;

  const { addEth, removeEth } = useAddRemoveEth();

  const { wrapAssetToJoin } = useWrapUnwrapAsset();
  const { sign, transact } = useChain();

  const borrow = async (vault: IVault | undefined, input: string | undefined, collInput: string | undefined) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.BORROW, selectedSeries?.id!);
    /* use the vault id provided OR 0 if new/ not provided */
    const vaultId = vault?.id || BLANK_VAULT;

    /* Set the series and ilk based on the vault that has been selected or if it's a new vault, get from the globally selected SeriesId */
    const series: ISeries = vault ? seriesMap.get(vault.seriesId)! : selectedSeries!;
    const base: IAsset = assetMap.get(series.baseId)!;
    const ilk: IAsset = vault ? assetMap.get(vault.ilkId)! : assetMap.get(selectedIlk?.idToUse!)!; // note: we use the wrapped version if required

    const ladleAddress = contractMap.get('Ladle').address;

    /* is ETH  used as collateral */
    const isEthCollateral = ETH_BASED_ASSETS.includes(selectedIlk?.idToUse!);
    /* is ETH being Borrowed   */
    const isEthBase = ETH_BASED_ASSETS.includes(series.baseId);

    /* parse inputs  (clean down to base/ilk decimals so that there is never an underlow)  */
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;
    const cleanCollInput = cleanValue(collInput, ilk.decimals);
    const _collInput = collInput ? ethers.utils.parseUnits(cleanCollInput, ilk.decimals) : ethers.constants.Zero;

    /* Calculate expected debt (fytokens) */
    const _expectedFyToken = buyBase(
      series.baseReserves,
      series.fyTokenReserves,
      _input,
      series.getTimeTillMaturity(),
      series.ts,
      series.g2,
      series.decimals
    );
    const _expectedFyTokenWithSlippage = calculateSlippage(_expectedFyToken, slippageTolerance);

    /* if approveMAx, check if signature is required : note: getAllowance may return FALSE if ERC1155 */
    const _allowance = await ilk.getAllowance(account!, ilk.joinAddress);
    const alreadyApproved = ethers.BigNumber.isBigNumber(_allowance) ? _allowance.gte(_collInput) : _allowance;

    const wrapping: ICallData[] = await wrapAssetToJoin(_collInput, selectedIlk!, txCode); // note: selected ilk used here, not wrapped version

    console.log('Already approved', alreadyApproved);

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign(
      [
        {
          target: ilk,
          spender: ilk.joinAddress,
          amount: _collInput,
          ignoreIf:
            alreadyApproved === true ||
            ETH_BASED_ASSETS.includes(selectedIlk?.idToUse!) ||
            _collInput.eq(ethers.constants.Zero) ||
            wrapping.length > 0,
        },
      ],
      txCode
    );

    /* Collate all the calls required for the process (including depositing ETH, signing permits, and building vault if needed) */
    const calls: ICallData[] = [
      /* handle wrapped token deposit, if required */
      ...wrapping,

      /* Include all the signatures gathered, if required */
      ...permits,

      /* If vault is null, build a new vault, else ignore */
      {
        operation: LadleActions.Fn.BUILD,
        args: [selectedSeries?.id, selectedIlk?.idToUse, '0'] as LadleActions.Args.BUILD,
        ignoreIf: !!vault,
      },

      /* handle ETH deposit as Collateral, if required  (only if collateral used is ETH-based ), else send ZERO_BN */
      ...addEth(isEthCollateral ? _collInput : ZERO_BN),

      {
        operation: LadleActions.Fn.SERVE,
        args: [
          vaultId,
          isEthBase ? ladleAddress : account, // if ETH is being borrowed, send the borrowed tokens (WETH) to ladle
          _collInput,
          _input,
          _expectedFyTokenWithSlippage,
        ] as LadleActions.Args.SERVE,
        ignoreIf: false,
      },

      /* handle remove/unwrap WETH > if ETH is what is being borrowed */
      ...removeEth(isEthBase ? ONE_BN : ZERO_BN), // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)
    ];

    /* handle the transaction */
    await transact(calls, txCode);

    /* When complete, update vaults.
      If a vault was provided, update it only,
      else update ALL vaults (by passing an empty array)
    */
    updateVaults([]);
    updateAssets([base, ilk, selectedIlk!]);
    updateSeries([series]);
  };

  return borrow;
};
