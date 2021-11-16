import { ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { HistoryContext } from '../../contexts/HistoryContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions, IUserContext, IUserContextActions, IUserContextState, IAsset } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { buyBase, calculateSlippage } from '../../utils/yieldMath';
import { useChain } from '../useChain';

/* Lend Actions Hook */
export const useRollPosition = () => {

  const {
    settingsState: { slippageTolerance, approveMax },
  } = useContext(SettingsContext);
  
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

    const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;;
  const { activeAccount: account, assetMap } = userState;
  const { updateSeries, updateAssets } = userActions;

  const { historyActions: { updateTradeHistory } } = useContext(HistoryContext);

  const { sign, transact } = useChain();

  const rollPosition = async (input: string | undefined, fromSeries: ISeries, toSeries: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.ROLL_POSITION, fromSeries.id);
    const base: IAsset = assetMap.get(fromSeries.baseId)!;
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;

    const ladleAddress = contractMap.get('Ladle').address;

    const _fyTokenValueOfInput = fromSeries.seriesIsMature
      ? _input
      : buyBase(
          fromSeries.baseReserves,
          fromSeries.fyTokenReserves,
          _input,
          fromSeries.getTimeTillMaturity(),
          fromSeries.decimals
        );

    const _minimumFYTokenReceived = calculateSlippage(_fyTokenValueOfInput, slippageTolerance.toString(), true);

    const alreadyApproved = approveMax
    ? (await fromSeries.fyTokenContract.allowance(account!, ladleAddress) ).gt(_input)
    : false;

    const permits: ICallData[] = await sign(
      [
        {
          target: fromSeries,
          spender: 'LADLE',
          amount: _fyTokenValueOfInput,
          ignoreIf: alreadyApproved===true,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      {
        operation: LadleActions.Fn.TRANSFER,
        args: [
          fromSeries.fyTokenAddress, 
          fromSeries.seriesIsMature ? fromSeries.fyTokenAddress : fromSeries.poolAddress,  // mature/not
          _fyTokenValueOfInput
        ] as LadleActions.Args.TRANSFER,
        ignoreIf: false, // never ignore
      },

      /* BEFORE MATURITY */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [toSeries.poolAddress, ethers.constants.Zero] as RoutedActions.Args.SELL_FYTOKEN,
        fnName: RoutedActions.Fn.SELL_FYTOKEN,
        targetContract: fromSeries.poolContract,
        ignoreIf: fromSeries.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.ROUTE,
        args: [account, _minimumFYTokenReceived] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract: toSeries.poolContract,
        ignoreIf: fromSeries.seriesIsMature,
      },

      /* AFTER MATURITY */
      {
        // ladle.redeemAction(seriesId, pool2.address, fyTokenToRoll)
        operation: LadleActions.Fn.REDEEM,
        args: [fromSeries.id, toSeries.poolAddress, _fyTokenValueOfInput] as LadleActions.Args.REDEEM,
        ignoreIf: !fromSeries.seriesIsMature,
      },
      {
        // ladle.sellBaseAction(series2Id, receiver, minimumFYTokenToReceive)
        operation: LadleActions.Fn.ROUTE,
        args: [account, _minimumFYTokenReceived] as RoutedActions.Args.SELL_BASE,
        fnName: RoutedActions.Fn.SELL_BASE,
        targetContract: toSeries.poolContract,
        ignoreIf: !fromSeries.seriesIsMature,
      },
    ];

    await transact(calls, txCode);
    updateSeries([fromSeries, toSeries]);
    updateAssets([base]);
    updateTradeHistory([fromSeries, toSeries]);
  };

  return rollPosition;
};
