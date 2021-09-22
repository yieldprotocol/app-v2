import { ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, ISeries, ActionCodes, LadleActions, IAsset } from '../../types';
import { decimalNToDecimal18, getTxCode } from '../../utils/appUtils';
import { ETH_BASED_ASSETS, MAX_128 } from '../../utils/constants';
import { useChain } from '../useChain';

import { calculateSlippage, secondsToFrom, sellBase } from '../../utils/yieldMath';
import { useRemoveCollateral } from './useRemoveCollateral';
import { HistoryContext } from '../../contexts/HistoryContext';

/* Generic hook for chain transactions */
export const useRepayDebt = () => {
  const {
    chainState: { account },
  } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { seriesMap, assetMap } = userState;
  const { updateVaults, updateAssets } = userActions;

  const {
    historyActions: { updateVaultHistory },
  } = useContext(HistoryContext);

  const { removeEth } = useRemoveCollateral();

  const { sign, transact } = useChain();

  const repay = async (vault: IVault, input: string | undefined, reclaimCollateral: boolean) => {
    const txCode = getTxCode(ActionCodes.REPAY, vault.id);

    const series: ISeries = seriesMap.get(vault.seriesId);
    const base: IAsset = assetMap.get(vault.baseId);
    const ethIlk: boolean = ETH_BASED_ASSETS.includes(vault.ilkId);

    console.log('is eth based? ', ethIlk);

    /* parse inputs */
    const _input = input ? ethers.utils.parseUnits(input, base.decimals) : ethers.constants.Zero;
    /* if requested, and all debt will be repaid, automatically remove collateral */
    const _collateralToRemove = reclaimCollateral && _input >= vault.art ? vault.ink : ethers.constants.Zero;

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
      true
    );

    const inputGreaterThanDebt: boolean = ethers.BigNumber.from(_inputAsFyToken).gte(vault.art);

    const fyTokenInputGreaterThanReserves = _inputAsFyToken.gte(series.fyTokenRealReserves);

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
        ignoreIf: series.seriesIsMature || fyTokenInputGreaterThanReserves,
      },
      {
        operation: LadleActions.Fn.REPAY,
        args: [vault.id, account, ethers.constants.Zero, _inputAsFyTokenWithSlippage] as LadleActions.Args.REPAY,
        ignoreIf:
          series.seriesIsMature ||
          inputGreaterThanDebt || // use if input is NOT more than debt
          fyTokenInputGreaterThanReserves, // OR ignore if fytoken required is greater than fyTokenReserves
      },
      {
        operation: LadleActions.Fn.REPAY_VAULT,
        args: [vault.id, account, ethers.constants.Zero, MAX_128] as LadleActions.Args.REPAY_VAULT,
        ignoreIf:
          series.seriesIsMature ||
          !inputGreaterThanDebt || // use if input IS more than debt OR
          fyTokenInputGreaterThanReserves, // OR ignore if fytoken required is greater than fyTokenReserves
      },
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, account, ethers.constants.Zero, _input.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: series.seriesIsMature || !fyTokenInputGreaterThanReserves, // OR ignore if fytoken required is less than fyTokenReserves
      },

      /* AFTER MATURITY */
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, account, ethers.constants.Zero, _input.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: !series.seriesIsMature,
      },

      ...removeEth(_collateralToRemove, series), // after the complete tranasction, this will remove all the collateral (if requested).
    ];
    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([base]);
  };

  return repay;
};
