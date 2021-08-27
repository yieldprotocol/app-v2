import { ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, ISeries, ActionCodes, LadleActions } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { MAX_128 } from '../../utils/constants';
import { useChain } from '../useChain';

import { calculateSlippage, secondsToFrom, sellBase } from '../../utils/yieldMath';
import { useRemoveCollateral } from './useRemoveCollateral';

/* Generic hook for chain transactions */
export const useRepayDebt = () => {
  const {
    chainState: { account },
  } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { seriesMap, assetMap } = userState;
  const { updateVaults, updateAssets } = userActions;

  const { removeEth } = useRemoveCollateral();

  const { sign, transact } = useChain();

  const repay = async (
    vault: IVault,
    input: string | undefined,
    collInput: string | undefined = '0' // optional - add(+) / remove(-) collateral in same tx.
  ) => {
    const txCode = getTxCode(ActionCodes.REPAY, vault.id);

    const series: ISeries = seriesMap.get(vault.seriesId);
    const base = assetMap.get(vault.baseId);
    const ilk = assetMap.get(vault.ilkId);

    /* parse inputs */
    const _input = input ? ethers.utils.parseUnits(input, base.decimals) : ethers.constants.Zero;
    const _collInput = collInput ? ethers.utils.parseUnits(collInput, ilk.decimals) : ethers.constants.Zero;

    const _inputAsFyDai = sellBase(
      series.baseReserves,
      series.fyTokenReserves,
      _input,
      secondsToFrom(series.maturity.toString())
    );
    const _inputAsFyDaiWithSlippage = calculateSlippage(_inputAsFyDai, userState.slippageTolerance.toString(), true);
    const inputGreaterThanDebt: boolean = ethers.BigNumber.from(_inputAsFyDai).gte(vault.art);

    const permits: ICallData[] = await sign(
      [
        {
          // before maturity
          target: base,
          spender: 'LADLE',
          message: 'Signing Approval',
          ignoreIf: series.seriesIsMature,
        },
        {
          // after maturity
          target: base,
          spender: base.joinAddress,
          message: 'Signing Dai Approval',
          ignoreIf: !series.seriesIsMature,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      /* BEFORE MATURITY */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.REPAY,
        args: [vault.id, account, _collInput, _inputAsFyDaiWithSlippage] as LadleActions.Args.REPAY,
        ignoreIf: series.seriesIsMature || inputGreaterThanDebt, // use if input is NOT more than debt
      },
      {
        operation: LadleActions.Fn.REPAY_VAULT,
        args: [vault.id, account, _collInput, MAX_128] as LadleActions.Args.REPAY_VAULT,
        ignoreIf: series.seriesIsMature || !inputGreaterThanDebt, // use if input IS more than debt
      },

      /* AFTER MATURITY */
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, account, _collInput, _input.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: !series.seriesIsMature,
      },

      ...removeEth(_collInput, series),
    ];
    await transact(calls, txCode);
    updateVaults([]);
    updateAssets([base]);
  };

  return repay;
};
