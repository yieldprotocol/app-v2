import { ethers } from 'ethers';
import { useContext } from 'react';
import { useAccount } from 'wagmi';
import { ETH_BASED_ASSETS } from '../../config/assets';
import { ChainContext } from '../../contexts/ChainContext';
import { HistoryContext } from '../../contexts/HistoryContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import {
  ICallData,
  ISeries,
  ActionCodes,
  LadleActions,
  RoutedActions,
  IUserContext,
  IUserContextActions,
  IUserContextState,
} from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { calculateSlippage, sellBase } from '../../utils/yieldMath';
import { useChain } from '../useChain';
import { useAddRemoveEth } from './useAddRemoveEth';

/* Lend Actions Hook */
export const useLend = () => {
  const {
    data: { address: account },
  } = useAccount();

  const {
    settingsState: { slippageTolerance },
  } = useContext(SettingsContext);

  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;
  const { assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;

  const {
    historyActions: { updateTradeHistory },
  } = useContext(HistoryContext);

  const { sign, transact } = useChain();

  const { addEth } = useAddRemoveEth();

  const lend = async (input: string | undefined, series: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.LEND, series.id);

    const base = assetMap.get(series.baseId)!;
    const cleanedInput = cleanValue(input, base?.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanedInput, base?.decimals) : ethers.constants.Zero;

    const ladleAddress = contractMap.get('Ladle').address;

    const _inputAsFyToken = sellBase(
      series.baseReserves,
      series.fyTokenReserves,
      _input,
      series.getTimeTillMaturity(),
      series.ts,
      series.g1,
      series.decimals
    );
    const _inputAsFyTokenWithSlippage = calculateSlippage(_inputAsFyToken, slippageTolerance.toString(), true);

    /* if approveMAx, check if signature is required */
    const alreadyApproved = (await base.getAllowance(account!, ladleAddress)).gte(_input);

    /* ETH is used as a base */
    const isEthBase = ETH_BASED_ASSETS.includes(series.baseId);

    const permitCallData: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          amount: _input,
          ignoreIf: alreadyApproved === true,
        },
      ],
      txCode
    );

    const addEthCallData = () => {
      if (isEthBase) return addEth(_input, series.poolAddress);
      return [];
    };

    const calls: ICallData[] = [
      ...permitCallData,
      ...addEthCallData(),
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: isEthBase,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _inputAsFyTokenWithSlippage] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract: series.poolContract,
        ignoreIf: false,
      },
    ];

    await transact(calls, txCode);
    updateSeries([series]);
    updateAssets([base]);
    updateTradeHistory([series]);
  };

  return lend;
};
