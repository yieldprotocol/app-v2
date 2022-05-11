import { ethers } from 'ethers';
import { useContext } from 'react';
import { useAccount } from 'wagmi';
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
import { ModuleActions } from '../../types/operations';
import { ConvexLadleModule } from '../../contracts';

export const useBorrow = () => {
  const {
    data: { address: account },
  } = useAccount();

  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const {
    settingsState: { slippageTolerance },
  } = useContext(SettingsContext);

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;

  const { selectedIlk, selectedSeries, seriesMap, assetMap } = userState;
  const { updateVaults, updateAssets, updateSeries } = userActions;

  const { addEth, removeEth } = useAddRemoveEth();

  const { wrapAsset } = useWrapUnwrapAsset();
  const { sign, transact } = useChain();

  const borrow = async (
    vault: IVault | undefined,
    input: string | undefined,
    collInput: string | undefined,
    getValuesFromNetwork: boolean = true // get market values by network call or offline calc (default: NETWORK)
  ) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.BORROW, selectedSeries?.id!);
    /* use the vault id provided OR 0 if new/ not provided */
    const vaultId = vault?.id || BLANK_VAULT;

    const ladleAddress = contractMap.get('Ladle').address;

    /* Set the series and ilk based on the vault that has been selected or if it's a new vault, get from the globally selected SeriesId */
    const series: ISeries = vault ? seriesMap.get(vault.seriesId)! : selectedSeries!;
    const base: IAsset = assetMap.get(series.baseId)!;

    const ilkToUse: IAsset = vault ? assetMap.get(vault.ilkId)! : assetMap.get(selectedIlk?.proxyId)!; // note: we use the wrapped version if required

    /* is ETH  used as collateral */
    const isEthCollateral = ETH_BASED_ASSETS.includes(selectedIlk?.proxyId);
    /* is ETH being Borrowed   */
    const isEthBase = ETH_BASED_ASSETS.includes(series.baseId);

    /* is convex-type collateral */
    const isConvexCollateral = CONVEX_BASED_ASSETS.includes(selectedIlk?.proxyId);
    const ConvexLadleModuleContract = contractMap.get('ConvexLadleModule') as ConvexLadleModule;

    /* parse inputs  (clean down to base/ilk decimals so that there is never an underlow)  */
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;
    const cleanCollInput = cleanValue(collInput, ilkToUse.decimals);
    const _collInput = collInput ? ethers.utils.parseUnits(cleanCollInput, ilkToUse.decimals) : ethers.constants.Zero;

    /* Calculate expected debt (fytokens) from either network or calculated */
    const _expectedFyToken = getValuesFromNetwork
      ? await series.poolContract.buyBasePreview(_input)
      : buyBase(
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
    const _allowance = await ilkToUse.getAllowance(account!, ilkToUse.joinAddress);

    const alreadyApproved = ethers.BigNumber.isBigNumber(_allowance) ? _allowance.gte(_collInput) : _allowance;
    console.log('Already approved', alreadyApproved);

    /* handle ETH deposit as Collateral, if required (only if collateral used is ETH-based ), else send ZERO_BN */
    const addEthCallData: ICallData[] = addEth(isEthCollateral ? _collInput : ZERO_BN);
    /* handle remove/unwrap WETH > if ETH is what is being borrowed */
    const removeEthCallData: ICallData[] = removeEth(isEthBase ? ONE_BN : ZERO_BN); // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)
    /* handle wrapping of collateral if required */
    const wrapAssetCallData: ICallData[] = await wrapAsset(_collInput, selectedIlk!, txCode); // note: selected ilk used here, not wrapped version

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permitCallData: ICallData[] = await sign(
      [
        {
          target: ilkToUse,
          spender: ilkToUse.joinAddress,
          amount: _collInput,
          ignoreIf:
            alreadyApproved === true || // Ignore if already approved
            ETH_BASED_ASSETS.includes(ilkToUse.id) || // Ignore if dealing with an eTH based collateral
            _collInput.eq(ethers.constants.Zero), // || // ignore if zero collateral value
          // wrapAssetCallData.length > 0, // Ignore if dealing with a wrapped collateral!
        },
      ],
      txCode
    );

    /* if ETH is being borrowed, send the borrowed tokens (WETH) to ladle for unwrapping */
    const serveToAddress = () => {
      if (isEthBase) return ladleAddress;
      // if ( wrapping  ) return wrapHandler
      return account;
    };

    /**
     *
     * Collate all the calls required for the process (including depositing ETH, signing permits, and building vault if needed)
     *
     * */
    const calls: ICallData[] = [
      /* handle wrapped token deposit, if required */
      ...wrapAssetCallData,

      /* Include all the signatures gathered, if required */
      ...permitCallData,

      /* add in the ETH deposit if required */
      ...addEthCallData,

      /* If vault is null, build a new vault, else ignore */
      {
        operation: LadleActions.Fn.BUILD,
        args: [selectedSeries?.id, ilkToUse.id, '0'] as LadleActions.Args.BUILD,
        ignoreIf: !!vault,
      },

      /* If convex-type collateral, add vault using convex ladle module */
      {
        operation: LadleActions.Fn.MODULE,
        fnName: ModuleActions.Fn.ADD_VAULT,
        args: [ilkToUse.joinAddress, vaultId] as ModuleActions.Args.ADD_VAULT,
        targetContract: ConvexLadleModuleContract,
        ignoreIf: !!vault || !isConvexCollateral,
      },

      {
        operation: LadleActions.Fn.SERVE,
        args: [vaultId, serveToAddress(), _collInput, _input, _expectedFyTokenWithSlippage] as LadleActions.Args.SERVE,
        ignoreIf: false,
      },
      ...removeEthCallData,
    ];

    /* finally, handle the transaction */
    await transact(calls, txCode);

    /* When complete, update vaults.
      If a vault was provided, update it only,
      else update ALL vaults (by passing an empty array)
    */
    updateVaults([]);
    updateAssets([base, ilkToUse, selectedIlk!]);
    updateSeries([series]);
  };

  return borrow;
};
