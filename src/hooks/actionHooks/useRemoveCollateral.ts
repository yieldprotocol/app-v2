import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import {
  ICallData,
  IVault,
  ActionCodes,
  LadleActions,
  IUserContext,
  IUserContextActions,
  IUserContextState,
  ISettingsContext,
} from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { ETH_BASED_ASSETS } from '../../utils/constants';
import { useChain } from '../useChain';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';

// TODO will fail if balance of join is less than amount
export const useRemoveCollateral = () => {
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);
  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;
  const { activeAccount: account, selectedIlk, assetMap } = userState;
  const { updateAssets, updateVaults } = userActions;
  const {
    settingsState: { unwrapTokens },
  } = useContext(SettingsContext) as ISettingsContext;

  const { transact } = useChain();

  const { unwrapAsset } = useWrapUnwrapAsset();

  const removeEth = (value: BigNumber): ICallData[] => {
    /* First check if the selected Ilk is, in fact, an ETH variety */
    if (ETH_BASED_ASSETS.includes(selectedIlk?.idToUse!)) {
      /* return the remove ETH OP */
      return [
        {
          operation: LadleActions.Fn.EXIT_ETHER,
          args: [account] as LadleActions.Args.EXIT_ETHER,
          ignoreIf: value.gte(ethers.constants.Zero),
        },
      ];
    }
    /* else return empty array */
    return [];
  };

  const removeCollateral = async (vault: IVault, input: string) => {
    /* generate the txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_COLLATERAL, vault.id);

    /* get associated series and ilk */
    const ilk = assetMap.get(vault.ilkId)!;

    /* parse inputs to BigNumber in Wei, and NEGATE */
    const cleanedInput = cleanValue(input, ilk.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk.decimals).mul(-1);

    /* check if the ilk/asset is an eth asset variety OR if it is wrapped token, if so pour to Ladle */
    let _pourTo = ETH_BASED_ASSETS.includes(ilk.id) ? contractMap.get('Ladle').address : account;

    /* handle wrapped tokens:  */
    let unwrap: ICallData[] = [];
    if (ilk.wrapHandlerAddress && unwrapTokens) {
      _pourTo = ilk.wrapHandlerAddress;
      unwrap = await unwrapAsset(ilk, account!);
    }

    const calls: ICallData[] = [
      {
        operation: LadleActions.Fn.POUR,
        args: [
          vault.id,
          _pourTo /* pour destination based on ilk/asset is an eth asset variety */,
          _input,
          ethers.constants.Zero,
        ] as LadleActions.Args.POUR,
        ignoreIf: false,
      },
      ...removeEth(_input),
      ...unwrap,
    ];

    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([ilk, selectedIlk!]);
  };

  return {
    removeCollateral,
    removeEth,
  };
};
