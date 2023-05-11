import { ethers } from 'ethers';
import { useContext } from 'react';
import { calculateSlippage, MAX_256 } from '@yield-protocol/ui-math';
import { UserContext } from '../../../contexts/UserContext';
import { ICallData, IVault, ActionCodes, LadleActions, IAsset, RoutedActions } from '../../../types';
import { cleanValue, getTxCode } from '../../../utils/appUtils';
import { useChain } from '../../useChain';
import { CONVEX_BASED_ASSETS, ETH_BASED_ASSETS, USDT, WETH } from '../../../config/assets';
import { SettingsContext } from '../../../contexts/SettingsContext';
import { useAddRemoveEth } from '../useAddRemoveEth';
import { ONE_BN, ZERO_BN } from '../../../utils/constants';
import { useWrapUnwrapAsset } from '../useWrapUnwrapAsset';
import { ConvexJoin__factory } from '../../../contracts';
import { Address, useBalance, useNetwork, useProvider } from 'wagmi';
import useContracts from '../../useContracts';
import useChainId from '../../useChainId';
import useAccountPlus from '../../useAccountPlus';
import { ContractNames } from '../../../config/contracts';
import { mutate } from 'swr';
import useVaultsVR from '../../entities/useVaultsVR';

export const useRepayDebtVR = () => {
  const {
    settingsState: { slippageTolerance, diagnostics },
  } = useContext(SettingsContext);

  const { userState, userActions } = useContext(UserContext);
  const { assetMap, selectedIlk, selectedBase } = userState;
  const { updateVaults, updateAssets } = userActions;
  const { address: account } = useAccountPlus();
  const { chain } = useNetwork();
  const provider = useProvider();
  const contracts = useContracts();
  const { refetch: refetchIlkBal } = useBalance({
    address: account,
    token: selectedIlk?.address as Address,
  });
  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.id === WETH ? undefined : (selectedBase?.address as Address),
  });

  const { key: vaultsKey } = useVaultsVR();
  const { addEth, removeEth } = useAddRemoveEth();
  const { sign, transact } = useChain();
  const chainId = useChainId();

  /**
   * REPAY FN
   * @param vault
   * @param input
   * @param reclaimCollateral
   */
  const repay = async (vault: IVault, input: string | undefined, reclaimCollateral: boolean) => {
    if (!contracts || !input || !assetMap || !account) return;

    const txCode = getTxCode(ActionCodes.REPAY, vault.id);

    const ladleAddress = contracts.get(ContractNames.VR_LADLE)?.address;
    if (!ladleAddress) return console.error('Ladle address not found');

    const base = assetMap.get(vault.baseId);
    const ilk = assetMap.get(vault.ilkId);

    if (!base || !ilk) return console.error('Base or ilk not found');

    const isEthCollateral = ETH_BASED_ASSETS.includes(vault.ilkId);
    const isEthBase = ETH_BASED_ASSETS.includes(vault.baseId);

    /* Parse inputs */
    const cleanInput = cleanValue(input, base.decimals);
    const _input = ethers.utils.parseUnits(cleanInput, base.decimals);

    /* Check if input is more than the debt */
    const inputGreaterThanEqualDebt = _input.gte(vault.accruedArt);

    /* If requested, and all debt will be repaid, automatically remove collateral */
    const _collateralToRemove =
      reclaimCollateral && inputGreaterThanEqualDebt ? vault.ink.mul(-1) : ethers.constants.Zero;

    /* Cap the amount of debt to repay at total debt */
    const _inputCappedAtArt = vault.art.gt(ZERO_BN) && vault.art.lte(_input) ? vault.art : _input;

    /* Set the amount of base to transfer for repay with slight buffer */
    const amountToTransfer = _inputCappedAtArt.mul(10001).div(10000);

    /* Check if already approved */
    const alreadyApproved = (await base.getAllowance(account, ladleAddress)).gte(amountToTransfer);

    const approveAmount = base.id === USDT && chainId !== 42161 ? MAX_256 : amountToTransfer;

    const permitCallData = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          amount: approveAmount,
          ignoreIf: alreadyApproved,
        },
      ],
      txCode
    );

    const removeEthCallData = isEthCollateral ? removeEth(ONE_BN, account) : [];

    /* Address to send the collateral to: either ladle (if eth is used as collateral) or account */
    const reclaimCollatToAddress = isEthCollateral ? ladleAddress : account;

    const calls: ICallData[] = [
      ...permitCallData,
      ...(isEthBase ? addEth(amountToTransfer, base.joinAddressVR) : []),

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, base.joinAddressVR, amountToTransfer] as LadleActions.Args.TRANSFER,
        ignoreIf: isEthBase,
      },

      /* repay less than all debt */
      {
        operation: LadleActions.Fn.POUR,
        args: [
          vault.id,
          reclaimCollatToAddress,
          _collateralToRemove,
          _inputCappedAtArt.mul(-1),
        ] as LadleActions.Args.POUR,
        ignoreIf: inputGreaterThanEqualDebt,
      },

      /* repay all debt */
      {
        operation: LadleActions.Fn.REPAY,
        args: [
          vault.id,
          reclaimCollatToAddress,
          reclaimCollatToAddress,
          _collateralToRemove,
        ] as LadleActions.Args.REPAY_VR,
        ignoreIf: !inputGreaterThanEqualDebt,
      },

      ...removeEthCallData,
    ];

    await transact(calls, txCode);

    if (selectedBase?.proxyId !== WETH) refetchBaseBal();
    if (selectedIlk?.proxyId !== WETH) refetchIlkBal();

    updateAssets([base, ilk, userState.selectedIlk!]);
    mutate(vaultsKey);

    // TODO update vault history
  };

  return repay;
};
