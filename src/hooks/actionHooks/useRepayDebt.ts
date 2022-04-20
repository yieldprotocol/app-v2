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

  /**
   * REPAY FN
   * @param vault
   * @param input
   * @param reclaimCollateral
   */
  const repay = async (vault: IVault, input: string | undefined, reclaimCollateral: boolean) => {
    const txCode = getTxCode(ActionCodes.REPAY, vault.id);

    const ladleAddress = contractMap.get('Ladle').address;
    const series: ISeries = seriesMap.get(vault.seriesId)!;
    const base: IAsset = assetMap.get(vault.baseId)!;
    const ilk: IAsset = assetMap.get(vault.ilkId)!;

    const isEthCollateral = ETH_BASED_ASSETS.includes(vault.ilkId);
    const isEthBase = ETH_BASED_ASSETS.includes(series.baseId);

    /* Parse inputs */
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;

    const _maxBaseIn = maxBaseIn(
      series.baseReserves,
      series.fyTokenReserves,
      series.getTimeTillMaturity(),
      series.ts,
      series.g1,
      series.decimals
    );
    /* Check the max amount of the trade that the pool can handle */
    const tradeIsNotPossible = _input.gt(_maxBaseIn);

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

    /* if requested, and all debt will be repaid, automatically remove collateral */
    const _collateralToRemove =
      reclaimCollateral && inputGreaterThanEqualDebt ? vault.ink.mul(-1) : ethers.constants.Zero;

    /* address to send the funds to either ladle (if eth is used as collateral) or account */
    const reclaimToAddress = isEthCollateral ? ladleAddress : account;

    /* check that if input is greater than debt, used after maturity only repay the max debt (or accrued debt) */
    const _inputCappedAtArt = vault.art.gt(ZERO_BN) && vault.art.lte(_input) ? vault.art : _input;

    /* Cap the amount to transfer after maturity */
    const amountToTransfer = series.seriesIsMature ? _input.mul(1001).div(1000) : _input; // after maturity + 0.1% for increases during tx time
    
    /* in low liq situations/ or mature send repay funds to join not pool */
    const transferToAddress = tradeIsNotPossible ? base.joinAddress : series.poolAddress;

    /* check if already apporved */ 
    const alreadyApproved = (await base.getAllowance(account!, ladleAddress)).gte(amountToTransfer)

    const permits: ICallData[] = await sign(
      [
        {
          // before maturity
          target: base,
          spender: 'LADLE',
          amount: amountToTransfer.mul(110).div(100), // generous permits on repayment we can refine at a later stage
          ignoreIf: series.seriesIsMature || alreadyApproved === true, // || inputGreaterThanMaxBaseIn,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      /* Send ETH to either base join or pool */ 
      ...addEth(isEthBase && !series.seriesIsMature ? amountToTransfer : ZERO_BN, transferToAddress), // destination = either join or series depending if tradeable
      ...addEth(isEthBase && series.seriesIsMature ? amountToTransfer : ZERO_BN), // no destination defined after maturity , input +1% will will go to weth join
      
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, transferToAddress, amountToTransfer] as LadleActions.Args.TRANSFER,
        ignoreIf: isEthBase,
      },

      /* BEFORE MATURITY - !series.seriesIsMature */
      {
        operation: LadleActions.Fn.REPAY,
        args: [vault.id, account, ethers.constants.Zero, _inputAsFyTokenWithSlippage] as LadleActions.Args.REPAY,
        ignoreIf: series.seriesIsMature || inputGreaterThanEqualDebt || tradeIsNotPossible,
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
        args: [vault.id, reclaimToAddress, _collateralToRemove, _inputCappedAtArt.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: series.seriesIsMature || !tradeIsNotPossible, // (ie. ignore if trade IS possible )
      },

      /* AFTER MATURITY  - series.seriesIsMature */
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, reclaimToAddress, _collateralToRemove, _inputCappedAtArt.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: !series.seriesIsMature,
      },

      ...removeEth(isEthCollateral ? ONE_BN : ZERO_BN), // after the complete tranasction, this will remove all the ETH collateral (if requested). (exit_ether sweeps all the eth out of the ladle, so exact amount is not importnat -> just greater than zero)
    ];
    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([base, ilk, userState.selectedIlk!]);
  };

  return repay;
};
