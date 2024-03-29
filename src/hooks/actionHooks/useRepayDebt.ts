import { ethers } from 'ethers';
import { useContext } from 'react';
import { calculateSlippage, maxBaseIn, MAX_256, sellBase } from '@yield-protocol/ui-math';

import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, ISeries, ActionCodes, LadleActions, IAsset, RoutedActions } from '../../types';
import { cleanValue, getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';
import { CONVEX_BASED_ASSETS, ETH_BASED_ASSETS, USDT, WETH } from '../../config/assets';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useAddRemoveEth } from './useAddRemoveEth';
import { ONE_BN, ZERO_BN } from '../../utils/constants';
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';
import { ConvexJoin__factory } from '../../contracts';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { Address, useBalance, useNetwork, useProvider } from 'wagmi';
import useContracts from '../useContracts';
import useChainId from '../useChainId';
import useAccountPlus from '../useAccountPlus';
import { ContractNames } from '../../config/contracts';
import useAllowAction from '../useAllowAction';

export const useRepayDebt = () => {
  const {
    settingsState: { slippageTolerance, diagnostics },
  } = useContext(SettingsContext);

  const { userState, userActions } = useContext(UserContext);
  const { seriesMap, assetMap, selectedIlk, selectedBase } = userState;
  const { updateVaults, updateAssets, updateSeries } = userActions;
  const { address: account } = useAccountPlus();
  const { chain } = useNetwork();
  const provider = useProvider();
  const contracts = useContracts();
  const { refetch: refetchIlkBal } = useBalance({
    address: account,
    token: selectedIlk?.address as Address,
  });
  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.id === WETH ? undefined : (selectedBase?.address as Address),
  });

  const { addEth, removeEth } = useAddRemoveEth();
  const { unwrapAsset } = useWrapUnwrapAsset();
  const { sign, transact } = useChain();
  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();
  const chainId = useChainId();

  const {isActionAllowed} = useAllowAction();

  /**
   * REPAY FN
   * @param vault
   * @param input
   * @param reclaimCollateral
   */
  const repay = async (vault: IVault, input: string | undefined, reclaimCollateral: boolean) => {
    
    if (!contracts) return;
   
    const txCode = getTxCode(ActionCodes.REPAY, vault.id);

    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;
    const series: ISeries = seriesMap?.get(vault.seriesId)!;
    const base: IAsset = assetMap?.get(vault.baseId)!;
    const ilk: IAsset = assetMap?.get(vault.ilkId)!;

    if (!isActionAllowed(ActionCodes.REPAY, series )) return; // return if action is not allowed

    const isEthCollateral = ETH_BASED_ASSETS.includes(vault.ilkId);
    const isEthBase = ETH_BASED_ASSETS.includes(series.baseId);

    /* is convex-type collateral */
    const isConvexCollateral = CONVEX_BASED_ASSETS.includes(ilk.proxyId);
    const convexJoinContract = ConvexJoin__factory.connect(ilk.joinAddress, provider);

    /* Parse inputs */
    const cleanInput = cleanValue(input, base.decimals);
    const _input = input ? ethers.utils.parseUnits(cleanInput, base.decimals) : ethers.constants.Zero;

    const _maxSharesIn = series.sharesReserves.eq(ZERO_BN) ? ZERO_BN 
    : maxBaseIn(
      series.sharesReserves,
      series.fyTokenReserves,
      getTimeTillMaturity(series.maturity),
      series.ts,
      series.g1,
      series.decimals,
      series.c,
      series.mu
    );

    /* Check if the trade of that size is possible */
    const tradeIsNotPossible =  series.getShares(_input).gt(_maxSharesIn);

    diagnostics && tradeIsNotPossible ? console.log('Trade is not possible:'): console.log('Trade is possible:')
    diagnostics && tradeIsNotPossible && console.log('Trade input', _input.toString());
    diagnostics && tradeIsNotPossible && console.log('TradeMax base in:', _maxSharesIn.toString());

    const _inputAsFyToken = isMature(series.maturity)
      ? _input
      : sellBase(
          series.sharesReserves,
          series.fyTokenReserves,
          series.getShares(_input),
          getTimeTillMaturity(series.maturity),
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

    /* In low liq situations/or mature, send repay funds to join not pool */
    const transferToAddress = tradeIsNotPossible || series.seriesIsMature ? base.joinAddress : series.poolAddress;

    /* Check if already approved */
    const alreadyApproved = (await base.getAllowance(account!, ladleAddress!)).gte(amountToTransfer);

    // const wrapAssetCallData : ICallData[] = await wrapAsset(ilk, account!);
    const unwrapAssetCallData: ICallData[] = reclaimCollateral ? await unwrapAsset(ilk, account!) : [];

    const approveAmount = base.id === USDT && chainId !== 42161 ? MAX_256 : amountToTransfer.mul(110).div(100);
    const permitCallData: ICallData[] = await sign(
      [
        {
          // before maturity
          target: base,
          spender: 'LADLE',
          amount: approveAmount, // generous approval permits on repayment we can refine at a later stage
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
      if (unwrapAssetCallData.length && ilk.unwrapHandlerAddresses?.has(chain?.id!))
        return ilk.unwrapHandlerAddresses?.get(chain?.id!); // if there is somethign to unwrap
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

      /* convex-type collateral; ensure checkpoint before giving collateral back to account */
      {
        operation: LadleActions.Fn.ROUTE,
        args: [vault.owner] as RoutedActions.Args.CHECKPOINT,
        fnName: RoutedActions.Fn.CHECKPOINT,
        targetContract: convexJoinContract, // use the convex join contract to checkpoint
        ignoreIf: !isConvexCollateral || _collateralToRemove.eq(ethers.constants.Zero),
      },

      /* BEFORE MATURITY - !series.seriesIsMature */
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

    if (selectedBase?.proxyId !== WETH) refetchBaseBal();
    if (selectedIlk?.proxyId !== WETH) refetchIlkBal();

    updateVaults([vault]);
    updateAssets([base, ilk, userState.selectedIlk!]);
    updateSeries([series]);
  };

  return repay;
};
