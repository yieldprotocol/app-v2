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
import { useWrapUnwrapAsset } from './useWrapUnwrapAsset';
import { useAddRemoveEth } from './useAddRemoveEth';
import { MAX_256, ONE_BN, ZERO_BN } from '../../utils/constants';

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
    chainState: { contractMap, connection:{ chainId } },
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
    
    /* Check the max amount the pool can handle */ 
    const inputGreaterThanMaxBaseIn = _input.gt(_MaxBaseIn);
    /* in low liq situations send repay funds to join not pool */
    const transferToAddress = inputGreaterThanMaxBaseIn? base.joinAddress : series.poolAddress
    
    /* check that if input is greater, only repay the max debt (or accrued debt) */
    const _inputforClose = (vault.accruedArt.gt(ZERO_BN) && vault.accruedArt.lte(_input)) ? vault.accruedArt : _input;

    /* if requested, and all debt will be repaid, automatically remove collateral */
    const _collateralToRemove = reclaimCollateral && inputGreaterThanDebt ? vault.ink.mul(-1) : ethers.constants.Zero;

    const isEthCollateral = ETH_BASED_ASSETS.includes(vault.ilkId);
    const isEthBase = ETH_BASED_ASSETS.includes(series.baseId);

    const unwraphandlerAddress = ilk.unwrapHandlerAddresses?.get(chainId); 

    // let reclaimToAddress = reclaimCollateral && isEthCollateral ? ladleAddress : account;
    // /* handle wrapped tokens: */
    // let unwrap: ICallData[] = [];
    // if (ilk.wrapHandlerAddress && unwrapTokens && reclaimCollateral) {
    //   reclaimToAddress = ilk.wrapHandlerAddress;
    //   unwrap = await unwrapAsset(ilk, account!);
    // }
    // if (isEthBase) {
    //   reclaimToAddress = ladleAddress;
    // }

    /* logic to determine the 'to' Address to send the reclaimed funds */
    const getReclaimToAddress = () : string => {
      if (unwraphandlerAddress && reclaimCollateral) return unwraphandlerAddress // if there is an unwrap handler send it there for unwrapping
      if (!unwraphandlerAddress && reclaimCollateral && isEthCollateral) return ladleAddress // if no unwrap handler, and eth-based collateral send to ladle
      // Eth is the base ( )
      if (!unwraphandlerAddress && isEthBase) return ladleAddress
      return account!; 
    }

    const alreadyApproved = !series.seriesIsMature && (
      await base.getAllowance(
        account!,
       inputGreaterThanMaxBaseIn ? base.joinAddress : ladleAddress
      )
    ).gte(_input);

    /* a bit hacky fix this logic  */
    const alreadyApprovedPostMaturity =  series.seriesIsMature && (
      await base.getAllowance(
        account!,
       base.joinAddress
      )
    ).gte(_inputforClose.mul(2));

    const unwrapAssetCallData : ICallData[] = reclaimCollateral ?  await unwrapAsset(ilk, account!): [] ;

    const permitCallData: ICallData[] = await sign(
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
          // After maturity
          target: base,
          spender: base.joinAddress,
          amount: MAX_256,
          ignoreIf: !series.seriesIsMature || alreadyApprovedPostMaturity === true,
        },
      ],
      txCode
    );

    const addEthCallData = addEth(isEthBase && !inputGreaterThanMaxBaseIn ? _input : ZERO_BN, transferToAddress);
    const removeEthCallData = removeEth(isEthCollateral ? ONE_BN : ZERO_BN);

    /**
     * 
     * Collate the call data
     * 
     * */
    const calls: ICallData[] = [
      
       /* add in the the permit calls */
      ...permitCallData, 

      /**
       * 
       * BEFORE MATURITY
       * 
       * */
      ...addEthCallData, /* the add eth calldata if repaying in ETH */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, transferToAddress, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: series.seriesIsMature || isEthBase,
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
        args: [vault.id, getReclaimToAddress(), _collateralToRemove, _input] as LadleActions.Args.REPAY_VAULT,
        ignoreIf:
          series.seriesIsMature ||
          !inputGreaterThanDebt || // use if input IS more than debt OR
          inputGreaterThanMaxBaseIn,
      },

      /* !! EDGECASE !!  in lowLiq situations : Input GreaterThanMaxbaseIn */
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, getReclaimToAddress(), _collateralToRemove, _input.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: series.seriesIsMature || !inputGreaterThanMaxBaseIn,
      },

      /* AFTER MATURITY  - series.seriesIsMature */
      /* No Transfer? */ 
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, getReclaimToAddress(), _collateralToRemove, _inputforClose.mul(-1)] as LadleActions.Args.CLOSE,
        ignoreIf: !series.seriesIsMature,
      },

      // after the complete tranasction, this will remove all the ETH collateral (if requested). (exit_ether sweeps all the eth out of the ladle, so exact amount is not importnat -> just greater than zero)
      ...removeEthCallData, 
      ...unwrapAssetCallData,
    ];
    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([base, ilk, userState.selectedIlk!]);
  };

  return repay;
};
