import { ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, ActionCodes, LadleActions, RoutedActions, IHistoryContext } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { CONVEX_BASED_ASSETS, ETH_BASED_ASSETS, WETH } from '../../config/assets';
import { useChain } from '../useChain';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ONE_BN, ZERO_BN } from '../../utils/constants';
import { ConvexJoin__factory } from '../../contracts';
import { HistoryContext } from '../../contexts/HistoryContext';
import { Address, useBalance, useNetwork, useProvider } from 'wagmi';
import useContracts from '../useContracts';
import useAccountPlus from '../useAccountPlus';
import { ContractNames } from '../../config/contracts';
import useAllowAction from '../useAllowAction';

export const useRemoveCollateral = () => {
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlk, assetMap } = userState;
  const { address: account } = useAccountPlus();
  const { chain } = useNetwork();
  const provider = useProvider();
  const contracts = useContracts();
  const { refetch: refetchIlkBal } = useBalance({
    address: account,
    token: selectedIlk?.address as Address,
  });

  const {
    historyActions: { updateVaultHistory },
  } = useContext(HistoryContext) as IHistoryContext;

  const { updateAssets, updateVaults } = userActions;
  const { transact } = useChain();
  const { removeEth } = useAddRemoveEth();
  const { unwrapAsset } = useWrapUnwrapAsset();
  const { isActionAllowed } = useAllowAction();

  const removeCollateral = async (vault: IVault, input: string, unwrapOnRemove: boolean = true) => {
    if (!contracts) return;
    if (!isActionAllowed(ActionCodes.REMOVE_COLLATERAL)) return; // return if action is not allowed


    /* generate the txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_COLLATERAL, vault.id);

    /* get associated series and ilk */
    const ilk = assetMap?.get(vault.ilkId)!;
    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;
    /* get unwrap handler if required */
    const unwrapHandlerAddress = ilk.unwrapHandlerAddresses?.get(chain?.id!);
    /* check if the ilk/asset is an eth asset variety OR if it is wrapped token, if so pour to Ladle */
    const isEthCollateral = ETH_BASED_ASSETS.includes(ilk.proxyId);

    /* parse inputs to BigNumber in Wei, and NEGATE */
    const cleanedInput = cleanValue(input, ilk.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk.decimals);

    /* handle wrapped tokens:  */
    const unwrapCallData: ICallData[] = unwrapOnRemove ? await unwrapAsset(ilk, account!) : [];
    const removeEthCallData: ICallData[] = isEthCollateral ? removeEth(ONE_BN) : []; // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)

    /* is convex-type collateral */
    const isConvexCollateral = CONVEX_BASED_ASSETS.includes(selectedIlk?.proxyId!);
    const convexJoinContract = ConvexJoin__factory.connect(ilk.joinAddress, provider);

    /* pour destination based on ilk/asset is an eth asset variety ( or unwrapHadnler address if unwrapping) */
    const pourToAddress = () => {
      console.log('Requires unwrapping? ', unwrapCallData.length);
      if (isEthCollateral) return ladleAddress;
      if (unwrapCallData.length) return unwrapHandlerAddress; // if there is something to unwrap
      return account;
    };

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
          pourToAddress(),
          _input.mul(-1), // NOTE: negated value!
          ZERO_BN, // No debt written off
        ] as LadleActions.Args.POUR,
        ignoreIf: false,
      },
      ...removeEthCallData,
      ...unwrapCallData,
    ];

    await transact(calls, txCode);
    if (selectedIlk?.proxyId !== WETH) refetchIlkBal();
    updateVaults([vault]);
    updateAssets([ilk, selectedIlk!]);
    updateVaultHistory([vault]);
  };

  return {
    removeCollateral,
  };
};
