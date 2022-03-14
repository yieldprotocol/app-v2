import { ethers } from 'ethers';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import {
  ICallData,
  IVault,
  ISeries,
  ActionCodes,
  LadleActions,
  IAsset,
  IUserContext,
  IUserContextActions,
  IUserContextState,
} from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';
import { calcAccruedDebt, calculateSlippage, maxBaseIn, secondsToFrom, sellBase } from '../../utils/yieldMath';
import { useRemoveCollateral } from './useRemoveCollateral';
import { ChainContext } from '../../contexts/ChainContext';
import { ETH_BASED_ASSETS } from '../../config/assets';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';
import { useAddRemoveEth } from './useAddRemoveEth';

export const useRepayDebt = () => {
  const {
    settingsState: { slippageTolerance, unwrapTokens },
  } = useContext(SettingsContext);

  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;
  const { activeAccount: account, seriesMap, assetMap } = userState;
  const { updateVaults, updateAssets } = userActions;

  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const { addEth, removeEth } = useAddRemoveEth();

  const { unwrapAsset } = useWrapUnwrapAsset();
  const { sign, transact } = useChain();

  const repay = async (vault: IVault, input: string | undefined, reclaimCollateral: boolean) => {
    const ladleAddress = contractMap.get('Ladle').address;

    const txCode = getTxCode(ActionCodes.REPAY, vault.id);

    const series: ISeries = seriesMap.get(vault.seriesId)!;
    const base: IAsset = assetMap.get(vault.baseId)!;
    const ilk: IAsset = assetMap.get(vault.ilkId)!;

    /* Parse inputs */
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;

    const _MaxBaseIn = maxBaseIn(
      series.baseReserves,
      series.fyTokenReserves,
      series.getTimeTillMaturity(),
      series.ts,
      series.g1,
      series.decimals
    );

    const _inputAsFyToken = series.seriesIsMature
      ? _input
      : sellBase(
          series.baseReserves,
          series.fyTokenReserves,
          _input,
          secondsToFrom(series.maturity.toString()),
          series.ts,
          series.g1,
          series.decimals
        );

    const _inputAsFyTokenWithSlippage = calculateSlippage(
      _inputAsFyToken,
      slippageTolerance.toString(),
      true // minimize
    );

    const inputGreaterThanDebt: boolean = ethers.BigNumber.from(_inputAsFyToken).gte(vault.accruedArt);
    
    const inputGreaterThanMaxBaseIn = _input.gt(_MaxBaseIn);
    // const inputGreaterThanMaxBaseIn = true;

    console.log( 'inputGreteaterThanDebt: ', inputGreaterThanDebt )
    console.log( 'inputGreteaterThanMaxBaseIn: ', inputGreaterThanMaxBaseIn )

    const _inputforClose = vault.art.lt(_input)
      ? vault.art
      : calcAccruedDebt(vault.rate, vault.rateAtMaturity, _input)[1]; // this is the input value less the accrued amount.

    /* if requested, and all debt will be repaid, automatically remove collateral */
    const _collateralToRemove = reclaimCollateral && inputGreaterThanDebt ? vault.ink.mul(-1) : ethers.constants.Zero;

    const isEthCollateral = ETH_BASED_ASSETS.includes(vault.ilkId);

    let reclaimToAddress = reclaimCollateral && isEthCollateral  ? ladleAddress : account;

    /* handle wrapped tokens:  */
    let unwrap: ICallData[] = [];
    if (ilk.wrapHandlerAddress && unwrapTokens && reclaimCollateral) {
      reclaimToAddress = ilk.wrapHandlerAddress;
      unwrap = await unwrapAsset(ilk, account!);
    }

    if ( ETH_BASED_ASSETS.includes(series.baseId)  ) {
      reclaimToAddress = base.joinAddress;
    }

    const alreadyApproved = (
      await base.getAllowance(
        account!,
        series.seriesIsMature || inputGreaterThanMaxBaseIn ? base.joinAddress : ladleAddress
      )
    ).gte(_input);

    const permits: ICallData[] = await sign(
      [
        {
          // before maturity
          target: base,
          spender: 'LADLE',
          amount: _input,
          ignoreIf: series.seriesIsMature || alreadyApproved === true || inputGreaterThanMaxBaseIn,
        },
        {
          // input gretaer than max base in
          target: base,
          spender: base.joinAddress,
          amount: _input,
          ignoreIf: series.seriesIsMature || alreadyApproved === true || !inputGreaterThanMaxBaseIn,
        },
        {
          // after maturity
          target: base,
          spender: base.joinAddress,
          amount: _input,
          ignoreIf: !series.seriesIsMature || alreadyApproved === true || !inputGreaterThanMaxBaseIn,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      ...addEth(_input, !ETH_BASED_ASSETS.includes( series.baseId )), 

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
        args: [vault.id, reclaimToAddress, _collateralToRemove, _input] as LadleActions.Args.REPAY_VAULT,
        ignoreIf:
          series.seriesIsMature ||
          !inputGreaterThanDebt || // use if input IS more than debt OR
          inputGreaterThanMaxBaseIn,
      },

      /* Input GreaterThanMaxbaseIn */
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, reclaimToAddress, _collateralToRemove, _input.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: series.seriesIsMature || !inputGreaterThanMaxBaseIn,
      },

      /* AFTER MATURITY */
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, reclaimToAddress, _collateralToRemove, _inputforClose.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: !series.seriesIsMature,
      },

      ...removeEth(_collateralToRemove, ETH_BASED_ASSETS.includes( series.baseId ) ), // after the complete tranasction, this will remove all the ETH collateral (if requested).
      ...unwrap,
    ];
    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([base, ilk, userState.selectedIlk!]);
  };

  return repay;
};
