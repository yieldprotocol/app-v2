import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';

import { ETH_BASED_ASSETS, USDT } from '../../../config/assets';
import { SettingsContext } from '../../../contexts/SettingsContext';
import { UserContext } from '../../../contexts/UserContext';
import { ICallData, ActionCodes, LadleActions, RoutedActions, ISignable } from '../../../types';
import { cleanValue, getTxCode } from '../../../utils/appUtils';

import { useChain } from '../../useChain';
import { Address, useBalance, useProvider, useSigner } from 'wagmi';
import useContracts from '../../useContracts';
import useAccountPlus from '../../useAccountPlus';
import { ContractNames } from '../../../config/contracts';
import useAllowAction from '../../useAllowAction';
import { MAX_256 } from '@yield-protocol/ui-math';
import useChainId from '../../useChainId';
import useVYTokens from '../../entities/useVYTokens';
import { useAddRemoveEth } from '../useAddRemoveEth';
import { VRLadle, VYToken__factory } from '../../../contracts';
import { ONE_BN } from '../../../utils/constants';

/* Lend Actions Hook */
export const useClosePositionVR = () => {
  console.log('useClosePositionVR FIRING');
  const { userState, userActions } = useContext(UserContext);
  const { assetMap, selectedBase, selectedVR } = userState;
  const { address: account } = useAccountPlus();
  const { data: signer } = useSigner();
  const { data: vyTokens } = useVYTokens();
  const vyToken = vyTokens?.get(selectedBase?.VYTokenAddress!.toLowerCase()!);
  const { removeEth } = useAddRemoveEth();

  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.address as Address,
  });
  const { refetch: refetchVyTokenBal } = useBalance({
    address: account,
    token: vyToken?.proxyAddress as Address,
  });

  const contracts = useContracts();
  const chainId = useChainId();
  const provider = useProvider();

  const { updateAssets } = userActions;
  const { sign, transact } = useChain();
  const { isActionAllowed } = useAllowAction();

  const closePositionVR = async (input: string | undefined) => {
    if (!input) return console.error('no input in useClosePositionVR');
    if (!contracts) return;
    if (!isActionAllowed(ActionCodes.CLOSE_POSITION)) return; // return if action is not allowed

    const txCode = getTxCode(ActionCodes.CLOSE_POSITION, 'VR');
    const base = assetMap?.get(selectedBase!.id)!;
    const cleanedInput = cleanValue(input, base.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, base.decimals);

    const selectedVyToken = vyTokens?.get(base?.VYTokenAddress!.toLowerCase());
    const vyTokenProxyAddr = selectedVyToken?.proxyAddress.toLowerCase();

    if (!vyTokenProxyAddr) return console.error('vyTokenProxyAddr not found');
    const vyTokenProxyContract = VYToken__factory.connect(vyTokenProxyAddr, provider);
    const vyTokenContract = VYToken__factory.connect(selectedVyToken?.address!, signer!);

    const { address, joinAddressVR } = base;
    const ladleAddress = contracts.get(ContractNames.VR_LADLE)?.address;

    /* if ethBase */
    const isEthBase = ETH_BASED_ASSETS.includes(base.id);

    const permitCallData: ICallData[] = await sign(
      [
        {
          target: vyTokenProxyContract as any,
          spender: ladleAddress!,
          amount: _input,
          ignoreIf: false,
        },
      ],
      txCode
    );

    // TODO vr remove eth logic
    const removeEthCallData = isEthBase ? removeEth(ONE_BN) : [];

    const calls: ICallData[] = [
      ...permitCallData,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [vyTokenProxyAddr, vyTokenProxyAddr, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: false, // never ignore, even after maturity because we go through the ladle.
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [_input, account, account] as RoutedActions.Args.WITHDRAW_VR,
        fnName: RoutedActions.Fn.WITHDRAW,
        targetContract: vyTokenProxyContract,
        ignoreIf: false,
      },
      ...removeEthCallData,
    ];
    await transact(calls, txCode);
    refetchBaseBal();
    refetchVyTokenBal();
    updateAssets([base]);

    // TODO update vyToken history
  };

  return closePositionVR;
};
