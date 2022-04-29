import { BigNumber, Contract, ethers } from 'ethers';
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
  RoutedActions,
} from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { CONVEX_BASED_ASSETS, ETH_BASED_ASSETS } from '../../config/assets';
import { useChain } from '../useChain';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ONE_BN, ZERO_BN } from '../../utils/constants';
import { ConvexJoin__factory, Join__factory } from '../../contracts';

// TODO will fail if balance of join is less than amount
export const useRemoveCollateral = () => {
  const {
    chainState: { contractMap, provider },
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

  const { removeEth } = useAddRemoveEth();
  const { unwrapAsset } = useWrapUnwrapAsset();

  const removeCollateral = async (vault: IVault, input: string) => {
    /* generate the txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_COLLATERAL, vault.id);

    /* get associated series and ilk */
    const ilk = assetMap.get(vault.ilkId)!;
    const ladleAddress = contractMap.get('Ladle').address;

    /* parse inputs to BigNumber in Wei, and NEGATE */
    const cleanedInput = cleanValue(input, ilk.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk.decimals).mul(-1);

    /* check if the ilk/asset is an eth asset variety OR if it is wrapped token, if so pour to Ladle */
    const isEthCollateral = ETH_BASED_ASSETS.includes(ilk.id);
    // const isEthBase = ETH_BASED_ASSETS.includes(selectedIlk?.idToUse!);

    /* is convex-type collateral */
    const isConvexCollateral = CONVEX_BASED_ASSETS.includes(selectedIlk?.idToUse!);
    const convexJoinContract = ConvexJoin__factory.connect(ilk.joinAddress, provider);

    let _pourTo = isEthCollateral ? ladleAddress : account;

    /* handle wrapped tokens:  */
    let unwrap: ICallData[] = [];
    if (ilk.wrapHandlerAddress && unwrapTokens) {
      _pourTo = ilk.wrapHandlerAddress;
      unwrap = await unwrapAsset(ilk, account!);
    }

    const calls: ICallData[] = [
      /* convex-type collateral; ensure checkpoint before giving collateral back to account */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [vault.owner] as RoutedActions.Args.CHECKPOINT,
        fnName: RoutedActions.Fn.CHECKPOINT,
        targetContract: convexJoinContract, // use the convex join contract to checkpoint
        ignoreIf: !isConvexCollateral,
      },
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
      ...removeEth(isEthCollateral ? ONE_BN : ZERO_BN), // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)
      ...unwrap,
    ];

    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([ilk, selectedIlk!]);
  };

  return {
    removeCollateral,
  };
};
