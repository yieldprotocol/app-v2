import { useSWRConfig } from 'swr';
import { ethers } from 'ethers';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ActionCodes, LadleActions, RoutedActions, IHistoryContext } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { CONVEX_BASED_ASSETS, ETH_BASED_ASSETS } from '../../config/assets';
import { useChain } from '../useChain';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ONE_BN, ZERO_BN } from '../../utils/constants';
import { ConvexJoin__factory } from '../../contracts';
import { HistoryContext } from '../../contexts/HistoryContext';
import { useAccount, useNetwork, useProvider } from 'wagmi';
import useContracts, { ContractNames } from '../useContracts';
import useAsset from '../useAsset';
import { useContext } from 'react';
import useVault from '../useVault';

export const useRemoveCollateral = () => {
  const { mutate } = useSWRConfig();
  const {
    userState: { selectedVault: vault },
  } = useContext(UserContext);
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const contracts = useContracts();

  const {
    historyActions: { updateVaultHistory },
  } = useContext(HistoryContext) as IHistoryContext;

  const { transact } = useChain();
  const { removeEth } = useAddRemoveEth();
  const { unwrapAsset } = useWrapUnwrapAsset();
  const { data: ilk, key: ilkKey } = useAsset(vault?.ilkId!);
  const { data: vaultToUse, key: vaultKey } = useVault();

  const removeCollateral = async (input: string, unwrapOnRemove: boolean = true) => {
    if (!account) throw new Error('no account detected in remove collat');
    if (!vault) throw new Error('no vault detected in remove collat');
    if (!ilk) throw new Error('no ilk detected in remove collat');
    if (!chain) throw new Error('no chain detected in remove collat');

    /* generate the txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_COLLATERAL, vault.id);

    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;
    if (!ladleAddress) throw new Error('no ladle address detected in remove collat');

    /* get unwrap handler if required */
    const unwrapHandlerAddress = ilk.unwrapHandlerAddresses?.get(chain.id);
    /* check if the ilk/asset is an eth asset variety OR if it is wrapped token, if so pour to Ladle */
    const isEthCollateral = ETH_BASED_ASSETS.includes(ilk.proxyId);

    /* parse inputs to BigNumber in Wei, and NEGATE */
    const cleanedInput = cleanValue(input, ilk.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk.decimals);

    /* handle wrapped tokens:  */
    const unwrapCallData = unwrapOnRemove ? await unwrapAsset(ilk, account) : [];
    const removeEthCallData = isEthCollateral ? removeEth(ONE_BN) : []; // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)

    /* is convex-type collateral */
    const isConvexCollateral = CONVEX_BASED_ASSETS.includes(ilk.proxyId);
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
    mutate(ilkKey);
    mutate(vaultKey);
    updateVaultHistory([vault]);
  };

  return {
    removeCollateral,
  };
};
