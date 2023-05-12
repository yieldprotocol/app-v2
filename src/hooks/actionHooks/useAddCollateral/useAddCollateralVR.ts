import { ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import { ICallData, IVault, ActionCodes, LadleActions, IHistoryContext } from '../../../types';
import { cleanValue, getTxCode } from '../../../utils/appUtils';
import { BLANK_VAULT } from '../../../utils/constants';
import { ETH_BASED_ASSETS } from '../../../config/assets';
import { useChain } from '../../useChain';
import { useAddRemoveEth } from '../useAddRemoveEth';
import { Address, useBalance } from 'wagmi';
import useContracts from '../../useContracts';
import useAccountPlus from '../../useAccountPlus';
import { ContractNames } from '../../../config/contracts';
import { mutate } from 'swr';
import useVaultsVR from '../../entities/useVaultsVR';
import { HistoryContext } from '../../../contexts/HistoryContext';

export const useAddCollateralVR = () => {
  const {
    userState: { selectedIlk, assetMap },
    userActions: { updateAssets },
  } = useContext(UserContext);
  const {
    historyActions: { updateVaultHistory },
  } = useContext(HistoryContext) as IHistoryContext;
  const { address: account } = useAccountPlus();
  const contracts = useContracts();
  const { key: vaultsKey } = useVaultsVR();

  const { sign, transact } = useChain();
  const { addEth } = useAddRemoveEth();

  const { refetch: refetchIlkBal } = useBalance({
    address: account,
    token: selectedIlk?.address as Address,
  });

  const addCollateral = async (vault: IVault | undefined, input: string) => {
    if (!contracts || !assetMap || !account) return;

    /* use the vault id provided OR 0 if new/ not provided */
    const vaultId = vault?.id || BLANK_VAULT;

    /* set the ilk based on if a vault has been selected or it's a new vault */
    const ilk = vault ? assetMap.get(vault.ilkId) : selectedIlk;

    if (!ilk) return console.error('no ilk or base');

    const ladleAddress = contracts.get(ContractNames.VR_LADLE)?.address;
    if (!ladleAddress) return console.error('no ladle address');

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ADD_COLLATERAL, vaultId);

    /* parse inputs to BigNumber in Wei */
    const cleanedInput = cleanValue(input, ilk.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, ilk.decimals);

    /* check if the ilk/asset is an eth asset variety, if so pour to Ladle */
    const isEthCollateral = ETH_BASED_ASSETS.includes(ilk.proxyId);

    /* if approve max, check if signature is required */
    const _allowance = await ilk.getAllowance(account, ladleAddress);
    const alreadyApproved = _allowance.gte(_input);

    /* Gather all the required signatures - sign() processes them and returns them as ICallData types */
    const permitCallData = await sign(
      [
        {
          target: ilk,
          spender: ladleAddress,
          amount: _input,
          ignoreIf: isEthCollateral || alreadyApproved,
        },
      ],
      txCode
    );

    /* Handle adding eth if required (ie. if the ilk is ETH_BASED) */
    const addEthCallData = isEthCollateral ? addEth(_input, ilk.joinAddressVR) : [];

    /* pour destination ignored */
    const pourToAddress = ethers.constants.AddressZero;
    if (!ilk.joinAddressVR) return console.error('no join address');

    /**
     * BUILD CALL DATA ARRAY
     * */
    const calls: ICallData[] = [
      /* handle permits if required */
      ...permitCallData,

      /* add in add ETH calls */
      ...addEthCallData,

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [ilk.address, ilk.joinAddressVR, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: isEthCollateral,
      },

      {
        operation: LadleActions.Fn.POUR,
        args: [vaultId, pourToAddress, _input, ethers.constants.Zero] as LadleActions.Args.POUR,
        ignoreIf: false, // never ignore
      },
    ];

    /* TRANSACT */
    await transact(calls, txCode, true);

    /* then update UI */
    refetchIlkBal();
    mutate(vaultsKey);
    updateAssets([ilk]);
    updateVaultHistory([vault!]);
  };

  return { addCollateral };
};
