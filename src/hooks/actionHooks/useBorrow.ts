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
import { BLANK_VAULT } from '../../utils/constants';
import { ETH_BASED_ASSETS } from '../../config/assets';
import { calculateSlippage } from '../../utils/yieldMath';
import { useChain } from '../useChain';
import { useAddCollateral } from './useAddCollateral';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';

export const useBorrow = () => {
  const {
    settingsState: { slippageTolerance },
  } = useContext(SettingsContext);

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;
  const { activeAccount: account, selectedIlk, selectedSeries, seriesMap, assetMap } = userState;
  const { updateVaults, updateAssets, updateSeries } = userActions;

  const { addEth } = useAddCollateral();
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

    /* parse inputs  ( clean down to base/ilk decimals so that there is never an underlow)  */
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;
    const cleanCollInput = cleanValue(collInput, ilk.decimals);
    const _collInput = collInput ? ethers.utils.parseUnits(cleanCollInput, ilk.decimals) : ethers.constants.Zero;

    /* if approveMAx, check if signature is required */
    const alreadyApproved = (await ilk.getAllowance(account!, ilk.joinAddress)).gt(_collInput);

    /* Calculate expected debt(fytokens) */
    // const _expectedFyToken = buyBase(
    //   series.baseReserves,
    //   series.fyTokenReserves,
    //   _input,
    //   series.getTimeTillMaturity(),
    //   series.ts,
    //   series.g2,
    //   series.decimals
    // );
    const _expectedFyToken = await series.poolContract.buyBasePreview(_input);
    const _expectedFyTokenWithSlippage = calculateSlippage(_expectedFyToken, slippageTolerance);

    const wrapping: ICallData[] = await wrapAssetToJoin(_collInput, selectedIlk!, txCode); // note: selected ilk used here, not wrapped version

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

      /* handle ETH deposit, if required */
      ...addEth(_collInput, series),

      /* If vault is null, build a new vault, else ignore */
      {
        operation: LadleActions.Fn.BUILD,
        args: [selectedSeries?.id, selectedIlk?.idToUse, '0'] as LadleActions.Args.BUILD,
        ignoreIf: !!vault,
      },
      {
        operation: LadleActions.Fn.SERVE,
        args: [vaultId, account, _collInput, _input, _expectedFyTokenWithSlippage] as LadleActions.Args.SERVE,
        ignoreIf: false, // never ignore
      },
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
