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
import { calculateSlippage, maxBaseIn, secondsToFrom, sellBase } from '../../utils/yieldMath';
import { ChainContext } from '../../contexts/ChainContext';
import { ETH_BASED_ASSETS } from '../../config/assets';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ONE_BN, ZERO_BN } from '../../utils/constants';

export const useRepayDebt = () => {
  const {
    settingsState: { slippageTolerance },
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
    
    /* check that if input is greater than debt, after maturity only repay the max debt (or accrued debt) */
    const _inputCapped = vault.accruedArt.gt(ZERO_BN) && vault.accruedArt.lte(_input) ? vault.accruedArt : _input;
    /* cap the amount to transfer at the debt after maturity */
    const amountToTransfer = series.seriesIsMature ? _inputCapped : _input;

    const _MaxBaseIn = maxBaseIn(
      series.baseReserves,
      series.fyTokenReserves,
      series.getTimeTillMaturity(),
      series.ts,
      series.g1,
      series.decimals
    );
    /* Check the max amount of the trade that the pool can handle */
    const tradeIsNotPossible = _input.gt(_MaxBaseIn); 

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

    const inputGreaterThanEqualDebt: boolean = ethers.BigNumber.from(_inputAsFyToken).gte(vault.accruedArt);

    /* in low liq situations/ or mature send repay funds to join not pool */
    const transferToAddress =
     tradeIsNotPossible || series.seriesIsMature ? base.joinAddress : series.poolAddress;

    /* if requested, and all debt will be repaid, automatically remove collateral */
    const _collateralToRemove =
      reclaimCollateral && inputGreaterThanEqualDebt ? vault.ink.mul(-1) : ethers.constants.Zero;

    const isEthCollateral = ETH_BASED_ASSETS.includes(vault.ilkId);
    const isEthBase = ETH_BASED_ASSETS.includes(series.baseId);

    /* address to send the funds to either ladle  (if eth is used as collateral) or account */
    const reclaimToAddress = isEthCollateral ? ladleAddress : account;

    const alreadyApproved =
      (await base.getAllowance(account!, ladleAddress)).gte( amountToTransfer);

    const permits: ICallData[] = await sign(
      [
       {
          // before maturity
          target: base,
          spender: 'LADLE',
          amount: amountToTransfer.mul(2), // generous permits
          ignoreIf: alreadyApproved === true , // || inputGreaterThanMaxBaseIn,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      /* Both before and after maturity  - send token to either join or pool */
      ...addEth(isEthBase ? amountToTransfer : ZERO_BN, transferToAddress), // destination = either join or series depending if tradeable
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [
          base.address,
          transferToAddress,
          amountToTransfer,
        ] as LadleActions.Args.TRANSFER,
        ignoreIf: isEthBase,
      },

      /* BEFORE MATURITY - !series.seriesIsMature */
      {
        operation: LadleActions.Fn.REPAY,
        args: [vault.id, account, ethers.constants.Zero, _inputAsFyTokenWithSlippage] as LadleActions.Args.REPAY,
        ignoreIf:
          series.seriesIsMature ||
          inputGreaterThanEqualDebt ||
          tradeIsNotPossible, 
      },
      {
        operation: LadleActions.Fn.REPAY_VAULT,
        args: [vault.id, reclaimToAddress, _collateralToRemove, _input] as LadleActions.Args.REPAY_VAULT,
        ignoreIf:
          series.seriesIsMature ||
          !inputGreaterThanEqualDebt || // ie ignore if use if input IS NOT more than debt
          tradeIsNotPossible,
      },

      /* EdgeCase in lowLiq situations : Input GreaterThanMaxbaseIn ( user incurs a penalty because repaid at 1:1 ) */
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, reclaimToAddress, _collateralToRemove, _input.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: series.seriesIsMature || !tradeIsNotPossible, // (ie. ignore if trade IS possible )
      },

      /* AFTER MATURITY  - series.seriesIsMature */
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, reclaimToAddress, _collateralToRemove, _inputCapped.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: !series.seriesIsMature,
      },

      ...removeEth(isEthCollateral ? ONE_BN : ZERO_BN), // after the complete tranasction, this will remove all the ETH collateral (if requested). (exit_ether sweeps all the eth out of the ladle, so exact amount is not importnat -> just greater than zero)
    ];
    await transact(calls, txCode);
    updateVaults([ vault ]);
    updateAssets([base, ilk, userState.selectedIlk!]);
  };

  return repay;
};
