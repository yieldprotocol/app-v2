import { ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import { ICallData, IVault, ActionCodes, LadleActions, IAsset } from '../../../types';
import { cleanValue, getTxCode } from '../../../utils/appUtils';
import { BLANK_VAULT } from '../../../utils/constants';
import { ETH_BASED_ASSETS, WETH } from '../../../config/assets';
import { useChain } from '../../useChain';
import { useWrapUnwrapAsset } from '../useWrapUnwrapAsset';
import { useAddRemoveEth } from '../useAddRemoveEth';
import { Address, useBalance } from 'wagmi';
import useContracts from '../../useContracts';
import useAccountPlus from '../../useAccountPlus';
import { ContractNames } from '../../../config/contracts';
import useAssetPair from '../../viewHelperHooks/useAssetPair/useAssetPair';
import { useSWRConfig } from 'swr';
import useVaultsVR from '../../entities/useVaultsVR';

export const useBorrowVR = () => {
  const { mutate } = useSWRConfig();
  const { genKey: genAssetPairKey } = useAssetPair();
  const { key: vaultsKey } = useVaultsVR();
  const { userState, userActions } = useContext(UserContext);
  const { selectedBase, selectedIlk, assetMap } = userState;
  const { updateAssets } = userActions;
  const { address: account } = useAccountPlus();
  const contracts = useContracts();
  const { addEth, removeEth } = useAddRemoveEth();
  const { wrapAsset } = useWrapUnwrapAsset();
  const { sign, transact } = useChain();

  const { refetch: refetchIlkBal } = useBalance({
    address: account,
    token: selectedIlk?.address as Address,
  });
  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.address as Address,
  });

  const borrowVR = async (vault: IVault | undefined, input: string | undefined, collInput: string | undefined) => {
    if (!contracts || !account || !selectedBase || !assetMap || !selectedIlk) return;

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.BORROW, 'VR');

    /* use the vault id provided OR 0 if new/ not provided */
    const vaultId = vault?.id || BLANK_VAULT;

    const ladleAddress = contracts.get(ContractNames.VR_LADLE)?.address;

    /* Set the series and ilk based on the vault that has been selected or if it's a new vault, get from the globally selected SeriesId */
    const base = assetMap.get(selectedBase.id);

    if (!base) return console.error('base not found');

    const ilkToUse = vault ? assetMap.get(vault.ilkId)! : assetMap.get(selectedIlk.proxyId); // note: we use the wrapped version if required

    if (!ilkToUse) return console.error('ilk not found');
    if (!ilkToUse.joinAddressVR) return console.error('ilkToUse.joinAddressVR not found');

    /* is ETH used as collateral */
    const isEthCollateral = ETH_BASED_ASSETS.includes(selectedIlk.proxyId);

    /* is ETH being borrowed */
    const isEthBase = ETH_BASED_ASSETS.includes(selectedBase.id);

    /* parse inputs (clean down to base/ilk decimals so that there is never an underlow) */
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;
    const cleanCollInput = cleanValue(collInput, ilkToUse.decimals);
    const _collInput = collInput ? ethers.utils.parseUnits(cleanCollInput, ilkToUse.decimals) : ethers.constants.Zero;

    /* check if signature is required */
    const _allowance = await ilkToUse.getAllowance(account, ilkToUse.joinAddressVR!);
    const alreadyApproved = _allowance.gte(_collInput);

    const permitCallData = await sign(
      [
        {
          target: ilkToUse,
          spender: ilkToUse.joinAddressVR!,
          amount: _collInput,
          ignoreIf:
            alreadyApproved || // Ignore if already approved
            _collInput.eq(ethers.constants.Zero), // ignore if zero collateral value
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
      /* Include all the signatures gathered, if required */
      ...permitCallData,

      /* add in the ETH collateral deposit if required */
      ...(isEthCollateral ? addEth(_collInput, ilkToUse.joinAddressVR) : []),

      /* If vault is null, build a new vault, else ignore */
      {
        operation: LadleActions.Fn.BUILD,
        args: [selectedBase?.id, ilkToUse.id, '0'] as LadleActions.Args.BUILD_VR,
        ignoreIf: !!vault,
      },

      {
        operation: LadleActions.Fn.POUR,
        args: [vaultId, isEthBase ? ladleAddress : account, _collInput, _input] as LadleActions.Args.POUR,
        ignoreIf: false,
      },

      /* remove eth if being borrowed */
      ...(isEthBase ? removeEth(_input, account) : []),
    ];

    /* finally, handle the transaction */
    await transact(calls, txCode, true);

    if (selectedBase.id !== WETH) refetchBaseBal();
    if (selectedIlk.proxyId !== WETH) refetchIlkBal();
    updateAssets([base, ilkToUse, selectedIlk]);
    mutate(genAssetPairKey(selectedBase.id, selectedIlk.id));
    mutate(vaultsKey);

    // TODO update borrow history
  };

  return borrowVR;
};
