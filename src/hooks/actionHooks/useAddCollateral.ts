import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';

import {
  ICallData,
  IVault,
  ISeries,
  ActionCodes,
  LadleActions,
  ISettingsContext,
  IUserContext,
  IAsset,
  IUserContextState,
  IUserContextActions,
} from '../../types';

import { cleanValue, getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT } from '../../utils/constants';
import { ETH_BASED_ASSETS } from '../../config/assets';
import { useChain } from '../useChain';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';

export const useAddCollateral = () => {
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const {
    settingsState: { approveMax },
  } = useContext(SettingsContext) as ISettingsContext;

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;

  const { activeAccount: account, selectedBase, selectedIlk, selectedSeries, seriesMap, assetMap } = userState;
  const { updateAssets, updateVaults } = userActions;

  const { sign, transact } = useChain();
  const { wrapAssetToJoin } = useWrapUnwrapAsset();

  const addEth = (value: BigNumber, series: ISeries): ICallData[] => {
    /* Check if the selected Ilk is, in fact, an ETH variety (and +ve)  */
    if (ETH_BASED_ASSETS.includes(selectedIlk?.idToUse!) && value.gte(ethers.constants.Zero)) {
      /* return the add ETH OP */
      return [
        {
          operation: LadleActions.Fn.JOIN_ETHER,
          args: [selectedIlk?.idToUse] as LadleActions.Args.JOIN_ETHER,
          ignoreIf: false,
          overrides: { value },
        },
      ];
    }
    /* else return empty array */
    return [];
  };

  const addCollateral = async (vault: IVault | undefined, input: string) => {
    /* use the vault id provided OR 0 if new/ not provided */
    const vaultId = vault?.id || BLANK_VAULT;

    /* set the series and ilk based on if a vault has been selected or it's a new vault */
    const series = vault ? seriesMap.get(vault.seriesId) : selectedSeries;
    const ilk: IAsset | null | undefined = vault ? assetMap.get(vault.ilkId) : selectedIlk;
    
    const ilkForWrap: IAsset | null | undefined = ilk?.isWrappedToken && ilk.unwrappedTokenId
      ? assetMap.get(ilk.unwrappedTokenId)
      : selectedIlk; // use the unwrapped token as ilk
    
    const base: IAsset | null | undefined = vault ? assetMap.get(vault.baseId) : selectedBase;
    const ladleAddress = contractMap.get('Ladle').address;

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ADD_COLLATERAL, vaultId);

    /* parse inputs to BigNumber in Wei */
    const cleanedInput = cleanValue(input, ilk?.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk?.decimals);

    /* check if the ilk/asset is an eth asset variety, if so pour to Ladle */
    const _isEthBased = ETH_BASED_ASSETS.includes(ilk?.id!);
    const _pourTo = _isEthBased ? ladleAddress : account;

    /* handle wrapped tokens:  */
    const wrapping: ICallData[] = await wrapAssetToJoin(_input, ilkForWrap!, txCode); // note: selected ilk used here, not wrapped version

    /* if approveMAx, check if signature is required */
    const alreadyApproved = (await ilk?.getAllowance(account!, ilk?.joinAddress)!).gte(_input);

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign(
      [
        {
          target: ilk!,
          spender: ilk?.joinAddress!,
          amount: _input,
          ignoreIf: _isEthBased || alreadyApproved === true || wrapping.length>0,
        },
      ],
      txCode
    );

    /**
     * BUILD CALL DATA ARRAY
     * */
    const calls: ICallData[] = [
      /* If vault is null, build a new vault, else ignore */
      {
        operation: LadleActions.Fn.BUILD,
        args: [selectedSeries?.id, selectedIlk?.idToUse, '0'] as LadleActions.Args.BUILD,
        ignoreIf: !!vault, // ignore if vault exists
      },
      /* handle wrapped token deposit, if required */
      ...wrapping,
      /* handle adding eth if required */
      ...addEth(_input, series!),
      /* handle permits if required */
      ...permits,
      {
        operation: LadleActions.Fn.POUR,
        args: [
          vaultId,
          _pourTo /* pour destination based on ilk/asset is an eth asset variety */,
          _input,
          ethers.constants.Zero,
        ] as LadleActions.Args.POUR,
        ignoreIf: false, // never ignore
      },
    ];

    /* TRANSACT */
    await transact(calls, txCode);
    updateVaults([vault!]);
    updateAssets([base!, ilk!, ilkForWrap!]);
  };

  return { addEth, addCollateral };
};
