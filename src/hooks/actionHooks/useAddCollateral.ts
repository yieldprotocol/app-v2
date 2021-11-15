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
  RoutedActions,
} from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { BLANK_VAULT, ETH_BASED_ASSETS } from '../../utils/constants';
import { useChain } from '../useChain';

export const useAddCollateral = () => {
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const {
    settingsState: { approveMax },
  } = useContext(SettingsContext) as ISettingsContext;

  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, selectedBase, selectedIlk, selectedSeriesId, seriesMap, assetMap } = userState;
  const { updateAssets, updateVaults } = userActions;

  const { sign, transact } = useChain();

  const addEth = (value: BigNumber, series: ISeries): ICallData[] => {

    /* Check if the selected Ilk is, in fact, an ETH variety (and +ve)  */
    if (ETH_BASED_ASSETS.includes(selectedIlk.assetIdToUse) && value.gte(ethers.constants.Zero)) {
      /* return the add ETH OP */
      return [
        {
          operation: LadleActions.Fn.JOIN_ETHER,
          args: [selectedIlk.assetIdToUse] as LadleActions.Args.JOIN_ETHER,
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
    const series = vault ? seriesMap.get(vault.seriesId) : seriesMap.get(selectedSeriesId);
    const ilk: IAsset = vault ? assetMap.get(vault.ilkId) : assetMap.get(selectedIlk.assetIdToUse);
    const base: IAsset = vault ? assetMap.get(vault.baseId) : assetMap.get(selectedBase.assetIdToUse);

    const ladleAddress = contractMap.get('Ladle').address;

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ADD_COLLATERAL, vaultId);

    /* parse inputs to BigNumber in Wei */
    const cleanedInput = cleanValue(input, ilk.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk.decimals);

    /* check if the ilk/asset is an eth asset variety, if so pour to Ladle */
    const _isEthBased = ETH_BASED_ASSETS.includes(ilk.assetId);
    const _pourTo = _isEthBased ? ladleAddress : account;

    /* if approveMAx, check if signature is required */
    const alreadyApproved = approveMax
      ? (await ilk.baseContract.allowance(account, ilk.joinAddress)).gt(_input)
      : false;

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permits: ICallData[] = await sign(
      [
        {
          target: ilk,
          spender: ilk.joinAddress,
          amount: _input,
          ignoreIf: _isEthBased || alreadyApproved===true,
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
        args: [selectedSeriesId, selectedIlk.assetIdToUse, '0'] as LadleActions.Args.BUILD,
        ignoreIf: !!vault, // ignore if vault exists
      },
      ...addEth(_input, series),
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
    updateVaults([vault]);
    updateAssets([base, ilk]);
  };

  return { addEth, addCollateral };
};
