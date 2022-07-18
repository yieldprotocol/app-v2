import { ethers } from 'ethers';
import { useContext } from 'react';
import { calculateSlippage, maxBaseIn, secondsToFrom, sellBase } from '@yield-protocol/ui-math';

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
  RoutedActions,
} from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';
import { ChainContext } from '../../contexts/ChainContext';
import { CONVEX_BASED_ASSETS, ETH_BASED_ASSETS } from '../../config/assets';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ONE_BN, ZERO_BN } from '../../utils/constants';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';
import { ConvexJoin__factory } from '../../contracts';

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
    chainState: {
      contractMap,
      connection: { chainId },
      provider,
    },
  } = useContext(ChainContext);

  const { addEth, removeEth } = useAddRemoveEth();
  const { unwrapAsset } = useWrapUnwrapAsset();
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

    /* is convex-type collateral */
    const isConvexCollateral = CONVEX_BASED_ASSETS.includes(ilk.proxyId);
    const convexJoinContract = ConvexJoin__factory.connect(ilk.joinAddress, provider);

    /* Parse inputs */
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;

    const _maxSharesIn = maxBaseIn(
      series.sharesReserves,
      series.fyTokenReserves,
      series.getTimeTillMaturity(),
      series.ts,
      series.g1,
      series.decimals,
      series.c,
      series.mu
    );

    /* Check the max amount of the trade that the pool can handle */
    const tradeIsNotPossible = series.getShares(_input).gt(_maxSharesIn);

    tradeIsNotPossible && console.log('trade is not possible:');
    tradeIsNotPossible && console.log('input', _input.toString());
    tradeIsNotPossible && console.log('Max base in:', _maxSharesIn.toString());

    const _inputAsFyToken = series.isMature()
      ? _input
      : sellBase(
          series.sharesReserves,
          series.fyTokenReserves,
          series.getShares(_input),
          series.getTimeTillMaturity(),
          series.ts,
          series.g1,
          series.decimals,
          series.c,
          series.mu
        );
    const _inputAsFyTokenWithSlippage = calculateSlippage(
      _inputAsFyToken,
      slippageTolerance.toString(),
      true // minimize
    );

    /* Check if input is more than the debt */
    const inputGreaterThanEqualDebt: boolean = ethers.BigNumber.from(_inputAsFyToken).gte(vault.accruedArt);

    /* If requested, and all debt will be repaid, automatically remove collateral */
    const _collateralToRemove =
      reclaimCollateral && inputGreaterThanEqualDebt ? vault.ink.mul(-1) : ethers.constants.Zero;

    /* Cap the amount to transfer: check that if input is greater than debt, used after maturity only repay the max debt (or accrued debt) */
    const _inputCappedAtArt = vault.art.gt(ZERO_BN) && vault.art.lte(_input) ? vault.art : _input;

    /* Set the amount to transfer ( + 0.1% after maturity ) */
    const amountToTransfer = series.seriesIsMature ? _input.mul(10001).div(10000) : _input; // After maturity + 0.1% for increases during tx time

    /* In low liq situations/or mature,  send repay funds to join not pool */
    const transferToAddress = tradeIsNotPossible || series.seriesIsMature ? base.joinAddress : series.poolAddress;

    /* Check if already approved */
    const alreadyApproved = (await base.getAllowance(account!, ladleAddress)).gte(amountToTransfer);

    // const wrapAssetCallData : ICallData[] = await wrapAsset(ilk, account!);
    const unwrapAssetCallData: ICallData[] = reclaimCollateral ? await unwrapAsset(ilk, account!) : [];

    const permitCallData: ICallData[] = await sign(
      [
        {
          // before maturity
          target: base,
          spender: 'LADLE',
          amount: amountToTransfer.mul(110).div(100), // generous approval permits on repayment we can refine at a later stage
          ignoreIf: alreadyApproved === true,
        },
      ],
      txCode
    );

    /* Remove ETH collateral. (exit_ether sweeps all the eth out of the ladle, so exact amount is not importnat -> just greater than zero) */
    const removeEthCallData = isEthCollateral ? removeEth(ONE_BN) : [];

    /* Address to send the funds to either ladle (if eth is used as collateral) or account */
    const reclaimToAddress = () => {
      if (isEthCollateral) return ladleAddress;
      if (unwrapAssetCallData.length && ilk.unwrapHandlerAddresses?.has(chainId))
        return ilk.unwrapHandlerAddresses?.get(chainId); // if there is somethign to unwrap
      return account;
    };

    const calls: ICallData[] = [
      ...permitCallData,

      /* Reqd. when we have a wrappedBase */
      // ...wrapAssetCallData

      /* If ethBase, Send ETH to either base join or pool  */
      ...addEth(isEthBase && !series.seriesIsMature ? amountToTransfer : ZERO_BN, transferToAddress), // destination = either join or series depending if tradeable
      ...addEth(isEthBase && series.seriesIsMature ? amountToTransfer : ZERO_BN), // no destination defined after maturity , input +1% will will go to weth join

      /* Else, Send Token to either join or pool via a ladle.transfer() */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, transferToAddress, amountToTransfer] as LadleActions.Args.TRANSFER,
        ignoreIf: isEthBase,
      },

      /* BEFORE MATURITY - !series.seriesIsMature */
      /* convex-type collateral; ensure checkpoint before giving collateral back to account */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [vault.owner] as RoutedActions.Args.CHECKPOINT,
        fnName: RoutedActions.Fn.CHECKPOINT,
        targetContract: convexJoinContract, // use the convex join contract to checkpoint
        ignoreIf: !isConvexCollateral || _collateralToRemove.eq(ethers.constants.Zero),
      },

      {
        operation: LadleActions.Fn.REPAY,
        args: [vault.id, account, ethers.constants.Zero, _inputAsFyTokenWithSlippage] as LadleActions.Args.REPAY,
        ignoreIf: series.seriesIsMature || inputGreaterThanEqualDebt || tradeIsNotPossible,
      },
      {
        operation: LadleActions.Fn.REPAY_VAULT,
        args: [vault.id, reclaimToAddress(), _collateralToRemove, _input] as LadleActions.Args.REPAY_VAULT,
        ignoreIf:
          series.seriesIsMature ||
          !inputGreaterThanEqualDebt || // ie ignore if use if input IS NOT more than debt
          tradeIsNotPossible,
      },

      /* EdgeCase in lowLiq situations : Input GreaterThanMaxbaseIn ( user incurs a penalty because repaid at 1:1 ) */
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, reclaimToAddress(), _collateralToRemove, _inputCappedAtArt.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: series.seriesIsMature || !tradeIsNotPossible, // (ie. ignore if trade IS possible )
      },

      /* AFTER MATURITY  - series.seriesIsMature */
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, reclaimToAddress(), _collateralToRemove, _inputCappedAtArt.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: !series.seriesIsMature,
      },
      ...removeEthCallData,
      ...unwrapAssetCallData,
    ];
    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([base, ilk, userState.selectedIlk!]);
  };

  return repay;
};
