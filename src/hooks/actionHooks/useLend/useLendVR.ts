import { ethers } from 'ethers';
import { useContext } from 'react';
import { MAX_256 } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS, USDT } from '../../../config/assets';
import { HistoryContext } from '../../../contexts/HistoryContext';
import { SettingsContext } from '../../../contexts/SettingsContext';
import { UserContext } from '../../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions } from '../../../types';
import { cleanValue, getTxCode } from '../../../utils/appUtils';
import { useChain } from '../../useChain';
import { useAddRemoveEth } from '../useAddRemoveEth';
import useTimeTillMaturity from '../../useTimeTillMaturity';
import { Address, useBalance } from 'wagmi';
import useContracts from '../../useContracts';
import useChainId from '../../useChainId';
import useAccountPlus from '../../useAccountPlus';
import { ContractNames } from '../../../config/contracts';
import useAllowAction from '../../useAllowAction';

/* Lend Actions Hook */
export const useLendVR = () => {
  const {
    settingsState: { slippageTolerance },
  } = useContext(SettingsContext);

  const { userState, userActions } = useContext(UserContext);
  const { assetMap, selectedBase } = userState;
  const { updateSeries, updateAssets } = userActions;
  const { address: account } = useAccountPlus();
  const chainId = useChainId();
  const { isActionAllowed } = useAllowAction();

  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.address as Address,
  });

  const {
    historyActions: { updateTradeHistory },
  } = useContext(HistoryContext);

  const { sign, transact } = useChain();
  const { addEth } = useAddRemoveEth();
  const { getTimeTillMaturity } = useTimeTillMaturity();
  const contracts = useContracts();

  const lend = async (input: string | undefined) => {
    if (!selectedBase || !contracts || !assetMap || !account) return;
    if (!isActionAllowed(ActionCodes.LEND_FR)) return;

    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.LEND, `${selectedBase?.id}-vr`);

    const base = assetMap.get(selectedBase.id);
    if (!base) return;

    const cleanedInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanedInput, base?.decimals) : ethers.constants.Zero;

    const ladleAddress = contracts.get(ContractNames.VR_LADLE)?.address;

    if (!ladleAddress) return;

    /* check if signature is required */
    const alreadyApproved = (await base.getAllowance(account, ladleAddress)).gte(_input);

    /* ETH is used as a base */
    const isEthBase = ETH_BASED_ASSETS.includes(selectedBase.id);

    const permitCallData: ICallData[] = await sign(
      [
        {
          target: base,
          spender: ladleAddress,
          amount: base.id === USDT && chainId !== 42161 ? MAX_256 : _input, // USDT allowance when non-zero needs to be set to 0 explicitly before settting to a non-zero amount; instead of having multiple approvals, we approve max from the outset on mainnet
          ignoreIf: alreadyApproved === true,
        },
      ],
      txCode
    );

    const addEthCallData = () => {
      // if (isEthBase) return addEth(_input, series.poolAddress); // TODO addETH using vr
      return [];
    };

    const vyPool = 'something'; // TODO
    const proxyContract = 'something' as ProxyContractVR; // TODO

    const calls: ICallData[] = [
      ...permitCallData,
      ...addEthCallData(),
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, vyPool, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: isEthBase,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _input] as RoutedActions.Args.LEND, // TODO get real routed action/func args
        fnName: RoutedActions.Fn.LEND_VR, // TODO get real routed action/func name
        targetContract: proxyContract,
        ignoreIf: false,
      },
    ];

    await transact(calls, txCode);
    refetchBaseBal();
    updateAssets([base]);
    updateLendVRHistory(); // TODO update vr lend history
  };

  return lend;
};
