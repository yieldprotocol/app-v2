import { useSWRConfig } from 'swr';
import { ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';

import { ICallData, ActionCodes, LadleActions, IHistoryContext } from '../../types';

import { cleanValue, getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, ZERO_BN } from '../../utils/constants';
import { CONVEX_BASED_ASSETS, ETH_BASED_ASSETS } from '../../config/assets';
import { useChain } from '../useChain';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ConvexLadleModule } from '../../contracts';
import { ModuleActions } from '../../types/operations';
import { HistoryContext } from '../../contexts/HistoryContext';
import { useAccount } from 'wagmi';
import useContracts, { ContractNames } from '../useContracts';
import useAsset from '../useAsset';

export const useAddCollateral = () => {
  const { mutate } = useSWRConfig();
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlk, seriesMap, selectedVault: vault, selectedSeries } = userState;
  const { updateVaults } = userActions;
  const { address: account } = useAccount();
  const contracts = useContracts();
  /* set the ilk based on if a vault has been selected or it's a new vault */
  const { data: ilk, key: ilkKey } = useAsset(vault ? vault?.ilkId! : selectedIlk?.id!);
  const vaultSeries = seriesMap.get(vault?.seriesId!) || selectedSeries;

  const {
    historyActions: { updateVaultHistory },
  } = useContext(HistoryContext) as IHistoryContext;

  const { sign, transact } = useChain();
  const { wrapAsset } = useWrapUnwrapAsset();
  const { addEth } = useAddRemoveEth();

  const addCollateral = async (input: string) => {
    if (!account) throw new Error('no account detected in add collat');
    if (!ilk) throw new Error('no ilk detected in add collat');
    if (!vaultSeries) throw new Error('no vault series detected in add collat');

    /* use the vault id provided OR 0 if new/ not provided */
    const vaultId = vault?.id || BLANK_VAULT;

    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;
    if (!ladleAddress) throw new Error('no ladle address detected in add collat');

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ADD_COLLATERAL, vaultId);

    /* parse inputs to BigNumber in Wei */
    const cleanedInput = cleanValue(input, ilk.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk.decimals);

    /* check if the ilk/asset is an eth asset variety, if so pour to Ladle */
    const isEthCollateral = ETH_BASED_ASSETS.includes(ilk.proxyId);

    /* is convex-type collateral */
    const isConvexCollateral = CONVEX_BASED_ASSETS.includes(ilk.proxyId);
    const ConvexLadleModuleContract = contracts.get(ContractNames.CONVEX_LADLE_MODULE) as ConvexLadleModule;

    /* if approveMAx, check if signature is required : note: getAllowance may return FALSE if ERC1155 */
    const _allowance = await ilk.getAllowance(account, ilk.joinAddress);
    const alreadyApproved = ethers.BigNumber.isBigNumber(_allowance) ? _allowance.gte(_input) : _allowance;

    /* Handle wrapping of tokens:  */
    const wrapAssetCallData = await wrapAsset(_input, ilk, txCode);

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permitCallData = await sign(
      [
        {
          target: ilk,
          spender: ilk.joinAddress,
          amount: _input,
          /* ignore if: 1) collateral is ETH 2) approved already 3) wrapAssets call is > 0 (because the permit is handled with wrapping) */
          ignoreIf: isEthCollateral || alreadyApproved === true || wrapAssetCallData.length > 0,
        },
      ],
      txCode
    );

    /* Handle adding eth if required (ie. if the ilk is ETH_BASED). If not, else simply sent ZERO to the addEth fn */
    const addEthCallData = addEth(ETH_BASED_ASSETS.includes(ilk.proxyId) ? _input : ZERO_BN, undefined, ilk.proxyId);

    /* pour destination based on ilk/asset is an eth asset variety */
    const pourToAddress = () => {
      if (isEthCollateral) return ladleAddress;
      return account;
    };

    /**
     * BUILD CALL DATA ARRAY
     * */
    const calls: ICallData[] = [
      /* If vault is null, build a new vault, else ignore */
      {
        operation: LadleActions.Fn.BUILD,
        args: [vaultSeries.id, ilk.proxyId, '0'] as LadleActions.Args.BUILD,
        ignoreIf: !!vault, // ignore if vault exists
      },

      /* If convex-type collateral, add vault using convex ladle module */
      {
        operation: LadleActions.Fn.MODULE,
        fnName: ModuleActions.Fn.ADD_VAULT,
        args: [ilk.joinAddress, vaultId] as ModuleActions.Args.ADD_VAULT,
        targetContract: ConvexLadleModuleContract,
        ignoreIf: !!vault || !isConvexCollateral,
      },

      /* handle wrapped token deposit, if required */
      ...wrapAssetCallData,

      /* add in add ETH calls */
      ...addEthCallData,

      /* handle permits if required */
      ...permitCallData,

      {
        operation: LadleActions.Fn.POUR,
        args: [vaultId, pourToAddress(), _input, ethers.constants.Zero] as LadleActions.Args.POUR,
        ignoreIf: false, // never ignore
      },
    ];

    /* TRANSACT */
    await transact(calls, txCode);

    /* then update UI */
    mutate(ilkKey);
    updateVaults([vault!]);
    updateVaultHistory([vault!]);
  };

  return { addCollateral };
};
