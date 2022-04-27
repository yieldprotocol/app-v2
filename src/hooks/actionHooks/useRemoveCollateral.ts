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
  IUserContextActions,
  IUserContextState,
} from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { ETH_BASED_ASSETS } from '../../config/assets';
import { useChain } from '../useChain';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ONE_BN, ZERO_BN } from '../../utils/constants';

// TODO will fail if balance of join is less than amount
export const useRemoveCollateral = () => {
  const {
    chainState: { contractMap, connection : { chainId } },
  } = useContext(ChainContext);
  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;
  const { activeAccount: account, selectedIlk, assetMap } = userState;
  const { updateAssets, updateVaults } = userActions;
  const { transact } = useChain();
  const { removeEth } = useAddRemoveEth();
  const { unwrapAsset } = useWrapUnwrapAsset();

  const removeCollateral = async (vault: IVault, input: string, unwrapOnRemove: boolean = true ) => {
    
    /* generate the txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_COLLATERAL, vault.id);

    /* get associated series and ilk */
    const ilk = assetMap.get(vault.ilkId)!;
    const ladleAddress = contractMap.get('Ladle').address;

    const unwrapHandlerAddress = ilk.unwrapHandlerAddresses?.get(chainId);

    /* parse inputs to BigNumber in Wei, and NEGATE */
    const cleanedInput = cleanValue(input, ilk.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk.decimals).mul(-1); // NOTE: negated value!

    /* check if the ilk/asset is an eth asset variety OR if it is wrapped token, if so pour to Ladle */
    const isEthCollateral = ETH_BASED_ASSETS.includes(ilk.proxyId);
    const _pourTo = isEthCollateral ? ladleAddress : account;

    /* handle wrapped tokens:  */
    const unwrapCallData: ICallData[] = unwrapOnRemove ? await unwrapAsset(ilk, account!) : [];
    const removeEthCallData: ICallData[] =  removeEth(isEthCollateral ? ONE_BN : ZERO_BN) // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)

    const calls: ICallData[] = [
      {
        operation: LadleActions.Fn.POUR,
        args: [
          vault.id,
          /* pour destination based on ilk/asset is an eth asset variety ( or unwrapHadnler address if unwrapping) */
          unwrapCallData.length ? unwrapHandlerAddress : _pourTo ,
          _input,
          ZERO_BN,
        ] as LadleActions.Args.POUR,
        ignoreIf: false,
      },
      ...removeEthCallData, 
      ...unwrapCallData,
    ];

    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([ilk, selectedIlk!]);
  };

  return {
    removeCollateral,
  };
};
