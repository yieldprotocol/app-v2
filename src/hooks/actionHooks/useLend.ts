import { ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { calculateSlippage, sellBase } from '../../utils/yieldMath';
import { useChain } from '../useChain';

/* Lend Actions Hook */
export const useLend = () => {
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, assetMap, slippageTolerance } = userState;
  const { updateSeries, updateAssets } = userActions;

  const { sign, transact } = useChain();

  const lend = async (input: string | undefined, series: ISeries) => {
    /* generate the reproducible txCode for tx tracking and tracing */
    const txCode = getTxCode(ActionCodes.LEND, series.id);

    const base = assetMap.get(series.baseId);
    const _input = input ? ethers.utils.parseUnits(input, base.decimals) : ethers.constants.Zero;

    const _inputAsFyToken = sellBase(series.baseReserves, series.fyTokenReserves, _input, series.getTimeTillMaturity());
    const _inputAsFyTokenWithSlippage = calculateSlippage(_inputAsFyToken, slippageTolerance.toString(), true);

    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          message: 'Signing ERC20 Token approval',
          ignoreIf: false,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _input.toString()] as LadleActions.Args.TRANSFER,
        ignoreIf: false,
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
  };

  return lend;
};
