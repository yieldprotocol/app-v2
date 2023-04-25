import { ethers } from 'ethers';
import { useContext } from 'react';

import { UserContext } from '../../../contexts/UserContext';
import { ICallData, IVault, ActionCodes, LadleActions, ISeries, IAsset } from '../../../types';
import { cleanValue, getTxCode } from '../../../utils/appUtils';
import { BLANK_VAULT, ONE_BN, ZERO_BN } from '../../../utils/constants';

import { CONVEX_BASED_ASSETS, ETH_BASED_ASSETS, WETH } from '../../../config/assets';

import { useChain } from '../../useChain';
import { useWrapUnwrapAsset } from '../useWrapUnwrapAsset';
import { useAddRemoveEth } from '../useAddRemoveEth';
import { ModuleActions } from '../../../types/operations';
import { ConvexLadleModule } from '../../../contracts';
import { Address, useBalance } from 'wagmi';
import useContracts from '../../useContracts';
import useAccountPlus from '../../useAccountPlus';
import { ContractNames } from '../../../config/contracts';

export const useBorrowVR = () => {
  const { userState, userActions } = useContext(UserContext);
  const { selectedBase, selectedIlk, assetMap } = userState;
  const { updateVaults, updateAssets } = userActions;
  const { address: account } = useAccountPlus();
  const contracts = useContracts();

  const { refetch: refetchIlkBal } = useBalance({
    address: account,
    token: selectedIlk?.address as Address,
  });
  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.address as Address,
  });

  const { addEth, removeEth } = useAddRemoveEth();

  const { wrapAsset } = useWrapUnwrapAsset();
  const { sign, transact } = useChain();

  const borrowVariableRate = async (
    vault: IVault | undefined,
    input: string | undefined,
    collInput: string | undefined
  ) => {
    if (!contracts) return;

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.BORROW, 'VR');

    /* use the vault id provided OR 0 if new/ not provided */
    const vaultId = vault?.id || BLANK_VAULT;

    const ladleAddress = contracts.get(ContractNames.VR_LADLE)?.address;

    /* Set the series and ilk based on the vault that has been selected or if it's a new vault, get from the globally selected SeriesId */

    const base: IAsset = assetMap?.get(selectedBase!.id)!;

    const ilkToUse: IAsset = vault ? assetMap?.get(vault.ilkId)! : assetMap?.get(selectedIlk?.proxyId!)!; // note: we use the wrapped version if required

    /* is ETH  used as collateral */
    const isEthCollateral = ETH_BASED_ASSETS.includes(selectedIlk?.proxyId!);
    /* is ETH being Borrowed   */
    const isEthBase = ETH_BASED_ASSETS.includes(selectedBase!.id);

    /* is convex-type collateral */
    const isConvexCollateral = CONVEX_BASED_ASSETS.includes(selectedIlk?.proxyId!);
    const ConvexLadleModuleContract = contracts.get(ContractNames.CONVEX_LADLE_MODULE) as ConvexLadleModule;

    /* parse inputs  (clean down to base/ilk decimals so that there is never an underlow)  */
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;
    const cleanCollInput = cleanValue(collInput, ilkToUse.decimals);
    const _collInput = collInput ? ethers.utils.parseUnits(cleanCollInput, ilkToUse.decimals) : ethers.constants.Zero;

    /* if approveMAx, check if signature is required : note: getAllowance may return FALSE if ERC1155 */
    const _allowance = await ilkToUse.getAllowance(account!, ilkToUse.joinAddressVR!);

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
          spender: ilkToUse.joinAddressVR!,
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
        // swap out selectedSeries for selectedBase
        // will also need to add LadleActions changes for VR args - jacob b
        args: [selectedBase?.id, ilkToUse.id, '0'] as LadleActions.Args.BUILD_VR,
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
        operation: LadleActions.Fn.POUR,
        args: [vaultId, ladleAddress, _collInput, _input] as LadleActions.Args.POUR, // TODO - update types - jacob b
        ignoreIf: false,
      },

      ...removeEthCallData, // do we still need this?/what does this do? - jacob b
    ];

    /* finally, handle the transaction */
    await transact(calls, txCode, true);

    /* When complete, update vaults.
      If a vault was provided, update it only,
      else update ALL vaults (by passing an empty array)
    */
    if (selectedBase?.id !== WETH) refetchBaseBal();
    if (selectedIlk?.proxyId !== WETH) refetchIlkBal();
    updateVaults();
    updateAssets([base, ilkToUse, selectedIlk!]);
    // updateSeries([series]); -- TODO - do we need to update selectedVR here? - jacob b
  };

  return borrowVariableRate;
};
