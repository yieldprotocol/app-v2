import { ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';

import {
  ICallData,
  IVault,
  ActionCodes,
  LadleActions,
  IUserContext,
  IUserContextState,
  IUserContextActions,
  IChainContext,
} from '../../types';

import { cleanValue, getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, ZERO_BN } from '../../utils/constants';
import { ETH_BASED_ASSETS } from '../../config/assets';
import { useChain } from '../useChain';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';
import { useAddRemoveEth } from './useAddRemoveEth';

export const useAddCollateral = () => {
  const {
    chainState: { contractMap },
  } = useContext(ChainContext) as IChainContext;

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;

  const { activeAccount: account, selectedBase, selectedIlk, selectedSeries, assetMap } = userState;
  const { updateAssets, updateVaults } = userActions;

  const { sign, transact } = useChain();
  const { wrapAsset } = useWrapUnwrapAsset();
  const { addEth } = useAddRemoveEth();

  const addCollateral = async (vault: IVault | undefined, input: string) => {
    /* use the vault id provided OR 0 if new/ not provided */
    const vaultId = vault?.id || BLANK_VAULT;

    /* set the ilk based on if a vault has been selected or it's a new vault */
    const ilk = vault ? assetMap.get(vault.ilkId) : selectedIlk;
    const base = vault ? assetMap.get(vault.baseId) : selectedBase;
    const ladleAddress = contractMap.get('Ladle').address;

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ADD_COLLATERAL, vaultId);

    /* parse inputs to BigNumber in Wei */
    const cleanedInput = cleanValue(input, ilk.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk.decimals);

    /* check if the ilk/asset is an eth asset variety, if so pour to Ladle */
    const isEthCollateral = ETH_BASED_ASSETS.includes(ilk.proxyId);

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
    const addEthCallData = addEth(
      ETH_BASED_ASSETS.includes(selectedIlk.proxyId) ? _input : ZERO_BN,
      undefined,
      selectedIlk.proxyId
    );

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
        args: [selectedSeries.id, selectedIlk.proxyId, '0'] as LadleActions.Args.BUILD,
        ignoreIf: !!vault, // ignore if vault exists
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
    updateVaults([vault!]);
    updateAssets([base, ilk]);
  };

  return { addCollateral };
};
