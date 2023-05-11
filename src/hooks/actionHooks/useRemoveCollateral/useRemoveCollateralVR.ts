import { ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import { ICallData, IVault, ActionCodes, LadleActions, IHistoryContext } from '../../../types';
import { cleanValue, getTxCode } from '../../../utils/appUtils';
import { ETH_BASED_ASSETS, WETH } from '../../../config/assets';
import { useChain } from '../../useChain';
import { useAddRemoveEth } from '../useAddRemoveEth';
import { ONE_BN, ZERO_BN } from '../../../utils/constants';
import { HistoryContext } from '../../../contexts/HistoryContext';
import { Address, useBalance } from 'wagmi';
import useContracts from '../../useContracts';
import useAccountPlus from '../../useAccountPlus';
import { ContractNames } from '../../../config/contracts';
import { mutate } from 'swr';
import useVaultsVR from '../../entities/useVaultsVR';

export const useRemoveCollateralVR = () => {
  const {
    userState: { selectedIlk, assetMap },
    userActions: { updateAssets },
  } = useContext(UserContext);
  const { address: account } = useAccountPlus();
  const contracts = useContracts();
  const { refetch: refetchIlkBal } = useBalance({
    address: account,
    token: selectedIlk?.address as Address,
  });

  const {
    historyActions: { updateVaultHistory },
  } = useContext(HistoryContext) as IHistoryContext;

  const { transact } = useChain();
  const { removeEth } = useAddRemoveEth();
  const { key: vaultsKey } = useVaultsVR();

  const removeCollateral = async (vault: IVault, input: string, unwrapOnRemove: boolean = true) => {
    if (!contracts || !assetMap) return;

    /* generate the txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.REMOVE_COLLATERAL, vault.id);

    /* get associated ilk */
    const ilk = assetMap.get(vault.ilkId);

    if (!ilk) return console.error('Ilk not found for vault: ', vault);

    const ladleAddress = contracts.get(ContractNames.VR_LADLE)?.address;

    /* check if the ilk/asset is an eth asset variety OR if it is wrapped token, if so pour to Ladle */
    const isEthCollateral = ETH_BASED_ASSETS.includes(ilk.proxyId);

    /* parse inputs to BigNumber in Wei, and NEGATE */
    const cleanedInput = cleanValue(input, ilk.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk.decimals);

    const removeEthCallData = isEthCollateral ? removeEth(ONE_BN) : []; // (exit_ether sweeps all the eth out the ladle, so exact amount is not importnat -> just greater than zero)

    /* pour destination based on ilk/asset is an eth asset variety */
    const pourToAddress = isEthCollateral ? ladleAddress : account;

    const calls: ICallData[] = [
      {
        operation: LadleActions.Fn.POUR,
        args: [
          vault.id,
          pourToAddress,
          _input.mul(-1), // NOTE: negated value to remove collateral
          ZERO_BN, // no debt repaid
        ] as LadleActions.Args.POUR,
        ignoreIf: false,
      },
      ...removeEthCallData,
    ];

    await transact(calls, txCode, true);

    if (selectedIlk?.proxyId !== WETH) refetchIlkBal();
    mutate(vaultsKey);
    updateAssets([ilk, selectedIlk!]);
    updateVaultHistory([vault]);
  };

  return {
    removeCollateral,
  };
};
