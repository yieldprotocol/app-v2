import { ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, ISeries, ActionCodes, LadleActions, IAsset } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';
import { calculateSlippage, maxBaseIn, secondsToFrom, sellBase } from '../../utils/yieldMath';
import { useRemoveCollateral } from './useRemoveCollateral';

export const useRepayDebt = () => {

  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, seriesMap, assetMap } = userState;
  const { updateVaults, updateAssets } = userActions;

  const { removeEth } = useRemoveCollateral();
  const { sign, transact } = useChain();

  const repay = async (vault: IVault, input: string | undefined, reclaimCollateral: boolean) => {
    const txCode = getTxCode(ActionCodes.REPAY, vault.id);
    const series: ISeries = seriesMap.get(vault.seriesId);
    const base: IAsset = assetMap.get(vault.baseId);

    /* Parse inputs */
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;

    /* if requested, and all debt will be repaid, automatically remove collateral */
    const _collateralToRemove = reclaimCollateral && _input >= vault.art ? vault.ink : ethers.constants.Zero;

    const _MaxBaseIn = maxBaseIn(
      series.baseReserves,
      series.fyTokenReserves,
      series.getTimeTillMaturity(),
      series.decimals
    );

    const _inputAsFyToken = sellBase(
      series.baseReserves,
      series.fyTokenReserves,
      _input,
      secondsToFrom(series.maturity.toString()),
      series.decimals
    );

    const _inputAsFyTokenWithSlippage = calculateSlippage(
      _inputAsFyToken,
      userState.slippageTolerance.toString(),
      true // minimize
    );

    const inputGreaterThanDebt: boolean = ethers.BigNumber.from(_inputAsFyToken).gte(vault.art);
    const inputGreaterThanMaxBaseIn = _input.gt(_MaxBaseIn);

    const permits: ICallData[] = await sign(
      [
        {
          // before maturity
          target: base,
          spender: 'LADLE',
          amount: _input,
          ignoreIf: series.seriesIsMature,
        },
        {
          // after maturity
          target: base,
          spender: base.joinAddress,
          amount: _input,
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
        ignoreIf: series.seriesIsMature || inputGreaterThanMaxBaseIn,
      },

      {
        operation: LadleActions.Fn.REPAY,
        args: [vault.id, account, ethers.constants.Zero, _inputAsFyTokenWithSlippage] as LadleActions.Args.REPAY,
        ignoreIf:
          series.seriesIsMature ||
          inputGreaterThanDebt || // use if input is NOT more than debt
          inputGreaterThanMaxBaseIn,
      },

      {
        operation: LadleActions.Fn.REPAY_VAULT,
        args: [vault.id, account, _collateralToRemove, _input] as LadleActions.Args.REPAY_VAULT,
        ignoreIf:
          series.seriesIsMature ||
          !inputGreaterThanDebt || // use if input IS more than debt OR
          inputGreaterThanMaxBaseIn,
      },

      /* AFTER MATURITY */
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, account, _collateralToRemove, _input.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: !series.seriesIsMature,
      },

      ...removeEth(_collateralToRemove), // after the complete tranasction, this will remove all the collateral (if requested).
    ];
    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([base]);
  };

  return repay;
};
