import { ethers } from 'ethers';
import { useContext } from 'react';
import * as contractTypes from '../../../contracts';

import { ETH_BASED_ASSETS, USDT, WETH } from '../../../config/assets';
import { HistoryContext } from '../../../contexts/HistoryContext';
import { UserContext } from '../../../contexts/UserContext';
import { ICallData, ActionCodes, LadleActions, RoutedActions } from '../../../types';
import { cleanValue, getTxCode } from '../../../utils/appUtils';
import { useChain } from '../../useChain';
import { useAddRemoveEth } from '../useAddRemoveEth';
import { Address, useBalance, useProvider } from 'wagmi';
import useContracts from '../../useContracts';
import useChainId from '../../useChainId';
import useAccountPlus from '../../useAccountPlus';
import { ContractNames } from '../../../config/contracts';
import { VYToken__factory } from '../../../contracts';
import { MAX_256 } from '@yield-protocol/ui-math';
import useVYTokens from '../../entities/useVYTokens';
import { useSWRConfig } from 'swr';

/* Lend Actions Hook */
export const useLendVR = () => {
  const { mutate } = useSWRConfig();
  const { key: vyTokensKey, data: vyTokens } = useVYTokens();
  const {
    userState,
    userActions: { updateAssets },
  } = useContext(UserContext);
  const provider = useProvider();
  const { assetMap, selectedBase } = userState;
  const { address: account } = useAccountPlus();
  const chainId = useChainId();

  const vyToken = vyTokens ? [...vyTokens.values()].find((vy) => vy.baseId === selectedBase?.id) : undefined;

  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.proxyId === WETH ? undefined : (selectedBase?.address as Address),
  });

  const {
    historyActions: { updateVYTokenHistory }, // vr deposit history
  } = useContext(HistoryContext);

  const { sign, transact } = useChain();
  const { addEth } = useAddRemoveEth();
  const contracts = useContracts();

  const lend = async (input: string | undefined) => {
    if (!input) return console.error('no input in useLendVR');

    if (!selectedBase || !contracts || !assetMap || !account)
      return console.error('no selectedBase || !contracts || !assetMap || !account');

    const base = assetMap.get(selectedBase.id);
    if (!base) return console.error('no base in useLendVR');

    const isEthBase = ETH_BASED_ASSETS.includes(selectedBase.id);

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.LEND, vyToken?.address!);

    const cleanedInput = cleanValue(input, base.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, base.decimals);

    const ladle = contracts.get(ContractNames.VR_LADLE) as contractTypes.VRLadle | undefined;

    if (!ladle?.address) return console.error('no ladle');

    /* check if signature is required */
    const alreadyApproved = (await base.getAllowance(account, ladle.address)).gte(_input);

    const permitCallData: ICallData[] = await sign(
      [
        {
          target: base,
          spender: ladle.address,
          amount: base.id === USDT && chainId !== 42161 ? MAX_256 : _input, // USDT allowance when non-zero needs to be set to 0 explicitly before settting to a non-zero amount; instead of having multiple approvals, we approve max from the outset on mainnet
          ignoreIf: alreadyApproved === true || isEthBase,
        },
      ],
      txCode
    );

    const joinAddr = base.joinAddressVR;
    if (!joinAddr) return console.error('no joinAddress');

    const vyTokenProxyAddr = base.VYTokenProxyAddress;
    if (!vyTokenProxyAddr) return console.error('no vyTokenAddress');
    const vyTokenProxyContract = VYToken__factory.connect(vyTokenProxyAddr, provider);

    const calls: ICallData[] = [
      ...permitCallData,
      ...(isEthBase ? addEth(_input, joinAddr) : []),
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, joinAddr, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: isEthBase,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _input] as RoutedActions.Args.DEPOSIT,
        fnName: RoutedActions.Fn.DEPOSIT,
        targetContract: vyTokenProxyContract,
        ignoreIf: false,
      },
    ];

    await transact(calls, txCode, true);
    mutate(vyTokensKey);
    refetchBaseBal();
    updateAssets([base]);
    updateVYTokenHistory([vyToken?.address!]);
  };

  return lend;
};
