import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ETH_BASED_ASSETS, WETH } from '../../../config/assets';
import { UserContext } from '../../../contexts/UserContext';
import { ActionCodes, ICallData, IHistoryContext, LadleActions, RoutedActions } from '../../../types';
import { cleanValue, getTxCode } from '../../../utils/appUtils';
import { useChain } from '../../useChain';
import { Address, useBalance, useProvider } from 'wagmi';
import useContracts from '../../useContracts';
import useAccountPlus from '../../useAccountPlus';
import { ContractNames } from '../../../config/contracts';
import useAllowAction from '../../useAllowAction';
import useVYTokens from '../../entities/useVYTokens';
import { useAddRemoveEth } from '../useAddRemoveEth';
import { VYToken__factory } from '../../../contracts';
import { ONE_BN } from '../../../utils/constants';
import { useSWRConfig } from 'swr';
import { HistoryContext } from '../../../contexts/HistoryContext';

/* Lend Actions Hook */
export const useClosePositionVR = () => {
  const { mutate } = useSWRConfig();
  const {
    userState: { selectedBase },
    userActions,
  } = useContext(UserContext);
  const {
    historyActions: { updateVYTokenHistory },
  } = useContext(HistoryContext) as IHistoryContext;
  const { address: account } = useAccountPlus();
  const { data: vyTokens, key: vyTokensKey } = useVYTokens();
  const { removeEth } = useAddRemoveEth();

  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.proxyId === WETH ? undefined : (selectedBase?.address as Address),
  });

  const contracts = useContracts();
  const provider = useProvider();

  const { updateAssets } = userActions;
  const { sign, transact } = useChain();
  const { isActionAllowed } = useAllowAction();

  const closePositionVR = async (input: string | undefined) => {
    if (!input) return console.error('no input in useClosePositionVR');
    if (!account || !contracts || !selectedBase || !vyTokens) return;
    if (!isActionAllowed(ActionCodes.CLOSE_POSITION)) return; // return if action is not allowed

    const selectedVyToken = vyTokens.get(selectedBase.VYTokenAddress!.toLowerCase());
    if (!selectedVyToken) return console.error('selectedVyToken not found');

    const txCode = getTxCode(ActionCodes.CLOSE_POSITION, selectedVyToken.address);

    const cleanedInput = cleanValue(input, selectedBase.decimals);
    const _input = ethers.utils.parseUnits(cleanedInput, selectedBase.decimals);

    const vyTokenProxyAddr = selectedVyToken.proxyAddress;
    if (!vyTokenProxyAddr) return console.error('vyTokenProxyAddr not found');

    const vyTokenProxyContract = VYToken__factory.connect(vyTokenProxyAddr, provider);

    const ladleAddress = contracts.get(ContractNames.VR_LADLE)?.address;
    if (!ladleAddress) return console.error('ladleAddress not found');

    const isEthBase = ETH_BASED_ASSETS.includes(selectedBase.id);
    const removeEthCallData = isEthBase ? removeEth(ONE_BN) : [];

    let vyTokenValueOfInput: BigNumber;
    try {
      vyTokenValueOfInput = await vyTokenProxyContract.previewWithdraw(_input);
    } catch (e) {
      return console.log('error getting vyToken value of input', e);
    }

    const alreadyApproved = (await vyTokenProxyContract.allowance(account, ladleAddress)).gte(vyTokenValueOfInput);

    const permitCallData = await sign(
      [
        {
          target: vyTokenProxyContract as any,
          spender: ladleAddress,
          amount: vyTokenValueOfInput,
          ignoreIf: alreadyApproved,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permitCallData,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [vyTokenProxyAddr, vyTokenProxyAddr, vyTokenValueOfInput] as LadleActions.Args.TRANSFER,
        ignoreIf: false,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [_input, isEthBase ? ladleAddress : account, account] as RoutedActions.Args.WITHDRAW_VR,
        fnName: RoutedActions.Fn.WITHDRAW,
        targetContract: vyTokenProxyContract,
        ignoreIf: false,
      },
      ...removeEthCallData,
    ];

    await transact(calls, txCode);
    refetchBaseBal();
    mutate(vyTokensKey);
    updateAssets([selectedBase]);
    updateVYTokenHistory([selectedVyToken.address]);
  };

  return closePositionVR;
};
