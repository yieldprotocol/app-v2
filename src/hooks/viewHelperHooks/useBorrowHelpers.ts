import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { IVault, ISeries, IAsset, IAssetPair } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { ZERO_BN } from '../../utils/constants';

import {
  buyBase,
  buyFYToken,
  calculateMinCollateral,
  decimalNToDecimal18,
  maxBaseIn,
  maxFyTokenIn
} from '../../utils/yieldMath';

/* Collateralization hook calculates collateralization metrics */
export const useBorrowHelpers = (
  input: string | undefined,
  collateralInput: string | undefined,
  vault: IVault | undefined,
  assetPairInfo: IAssetPair | undefined,
  futureSeries: ISeries | null = null // Future or rollToSeries
) => {
  /* STATE FROM CONTEXT */
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const {
    userState: { activeAccount, assetMap, seriesMap, selectedSeries },
  } = useContext(UserContext);

  const vaultBase: IAsset | undefined = assetMap.get(vault?.baseId!);
  const vaultIlk: IAsset | undefined = assetMap.get(vault?.ilkId!);

  /* LOCAL STATE */
  const [borrowEstimate, setBorrowEstimate] = useState<BigNumber>(ethers.constants.Zero);
  const [borrowEstimate_, setBorrowEstimate_] = useState<string>();

  const [userBaseBalance_, setUserBaseBalance_] = useState<string | undefined>();

  const [debtAfterRepay, setDebtAfterRepay] = useState<BigNumber>();

  const [debtInBase, setDebtInBase] = useState<BigNumber>(ethers.constants.Zero);
  const [debtInBase_, setDebtInBase_] = useState<string | undefined>();

  const [minDebt, setMinDebt] = useState<BigNumber>();
  const [minDebt_, setMinDebt_] = useState<string | undefined>();

  const [maxDebt, setMaxDebt] = useState<BigNumber>();
  const [maxDebt_, setMaxDebt_] = useState<string | undefined>();

  const [maxRepay, setMaxRepay] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRepay_, setMaxRepay_] = useState<string | undefined>();

  const [minRepayable, setMinRepayable] = useState<BigNumber>(ethers.constants.Zero);
  const [minRepayable_, setMinRepayable_] = useState<string | undefined>();

  const [maxRoll, setMaxRoll] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRoll_, setMaxRoll_] = useState<string | undefined>();

  const [borrowPossible, setBorrowPossible] = useState<boolean>(false);
  const [rollPossible, setRollPossible] = useState<boolean>(false);
  const [protocolLimited, setProtocolLimited] = useState<boolean>(false);

  /* Update the borrow limits if asset pair changes */
  useEffect(() => {
    if (assetPairInfo) {
      const _decimals = assetPairInfo.limitDecimals;
      const _maxLessTotal = assetPairInfo.maxDebtLimit.sub(assetPairInfo.pairTotalDebt);
      const min = assetPairInfo.minDebtLimit;

      setMaxDebt(_maxLessTotal);
      setMaxDebt_(ethers.utils.formatUnits(_maxLessTotal, _decimals)?.toString());
      setMinDebt(min);
      setMinDebt_(ethers.utils.formatUnits(min, assetPairInfo.baseDecimals)?.toString());
    }
  }, [assetPairInfo]);

  /* check if the user can borrow the specified amount based on protocol base reserves */
  useEffect(() => {
    if (input && selectedSeries && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, selectedSeries.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, selectedSeries.decimals);
      input_.lte(selectedSeries.baseReserves) ? setBorrowPossible(true) : setBorrowPossible(false);
    }
  }, [input, selectedSeries, selectedSeries?.baseReserves]);

  /* check the new debt level after potential repaying */
  useEffect(() => {
    if (input && vault && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, vault.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, vault.decimals);  // input is in terms of base
      const remainingDebt = debtInBase.sub(input_).gte(ZERO_BN) ? debtInBase.sub(input_) : ZERO_BN;
      diagnostics && console.log('remaining debt', remainingDebt.toString());
      setDebtAfterRepay(remainingDebt);
    }
  }, [input, vault]);

  /* Calculate an estimated sale based on the input and future strategy, assuming correct collateralisation */
  useEffect(() => {
    if (input && futureSeries && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, futureSeries.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, futureSeries.decimals);
      const estimate = buyBase(
        futureSeries.baseReserves,
        futureSeries.fyTokenReserves,
        input_,
        futureSeries.getTimeTillMaturity(),
        futureSeries.ts,
        futureSeries.g1,
        futureSeries.decimals
      );
      const estimatePlusVaultUsed = vault?.accruedArt?.gt(ethers.constants.Zero)
        ? estimate.add(vault.accruedArt)
        : estimate;
      setBorrowEstimate(estimatePlusVaultUsed);
      setBorrowEstimate_(ethers.utils.formatUnits(estimatePlusVaultUsed, futureSeries.decimals).toString());
    }
  }, [input, futureSeries, vault]);

  /* SET MAX ROLL and ROLLABLE including Check if the rollToSeries have sufficient base value AND won't be undercollaterallised */
  useEffect(() => {
    if (futureSeries && vault && vault.accruedArt) {
      const _maxFyTokenIn = maxFyTokenIn(
        futureSeries.baseReserves,
        futureSeries.fyTokenReserves,
        futureSeries.getTimeTillMaturity(),
        futureSeries.ts,
        futureSeries.g2,
        futureSeries.decimals
      );

      const newDebt = buyBase(
        futureSeries.baseReserves,
        futureSeries.fyTokenReserves,
        vault.accruedArt,
        futureSeries.getTimeTillMaturity(),
        futureSeries.ts,
        futureSeries.g2,
        futureSeries.decimals
      );

      const _minCollat = calculateMinCollateral(
        assetPairInfo!.pairPrice,
        newDebt,
        assetPairInfo!.minRatio.toString(),
        undefined,
        true
      );
      diagnostics && console.log('min Collat of roll to series', _minCollat.toString());

      /* SET MAX ROLL */
      if (vault.accruedArt.lt(_maxFyTokenIn)) {
        setMaxRoll(vault.accruedArt);
        setMaxRoll_(ethers.utils.formatUnits(vault.accruedArt, futureSeries.decimals).toString());
      } else {
        setMaxRoll(_maxFyTokenIn);
        setMaxRoll_(ethers.utils.formatUnits(_maxFyTokenIn, futureSeries.decimals).toString());
      }

      // conditions for allowing rolling
      const conditionsMet =
        vault.accruedArt.lt(_maxFyTokenIn) &&
        decimalNToDecimal18(vault.ink, vaultIlk?.decimals || 18).gt(_minCollat) &&
        vault.accruedArt.gt(minDebt!);

      /* SET ROLLABLE */
      const rollable = vault.accruedArt.eq(ZERO_BN) // always rollable if zero debt
        ? true
        : conditionsMet;

      diagnostics && console.log('Roll possible: ', rollable);
      setRollPossible(rollable);
    }
  }, [futureSeries, vault, diagnostics, assetPairInfo, minDebt, vaultIlk?.decimals]);

  /* Update the Min Max repayable amounts */
  useEffect(() => {
    if (activeAccount && vault && vaultBase && minDebt) {
      const vaultSeries: ISeries = seriesMap.get(vault?.seriesId!);
      (async () => {
        const _userBalance = await vaultBase.getBalance(activeAccount);
        setUserBaseBalance_(ethers.utils.formatUnits(_userBalance, vaultBase.decimals));

        const _baseRequired = buyFYToken(
          vaultSeries.baseReserves,
          vaultSeries.fyTokenReserves,
          vault.accruedArt,
          vaultSeries.getTimeTillMaturity(),
          vaultSeries.ts,
          vaultSeries.g1,
          vaultSeries.decimals
        );

        const _debtInBase = vaultSeries.isMature() ? vault.accruedArt : _baseRequired.mul(100000001).div(100000000);
        setDebtInBase(_debtInBase);
        setDebtInBase_(ethers.utils.formatUnits(_debtInBase, vaultSeries.decimals).toString());

        /* maxRepayable is either the max tokens they have or max debt */
        const _maxRepayable = _userBalance && _debtInBase.gt(_userBalance) ? _userBalance : _debtInBase;

        /* set the min repayable up to the dust limit */
        const _maxToDust = _debtInBase.gt(minDebt) ? _maxRepayable.sub(minDebt) : _debtInBase;
        _maxToDust && setMinRepayable(_maxToDust);
        _maxToDust && setMinRepayable_(ethers.utils.formatUnits(_maxToDust, vaultBase?.decimals)?.toString());

        const _maxBaseIn = maxBaseIn(
          vaultSeries?.baseReserves,
          vaultSeries?.fyTokenReserves,
          vaultSeries?.getTimeTillMaturity(),
          vaultSeries?.ts,
          vaultSeries?.g1,
          vaultSeries?.decimals
        );

        /* if maxBasein is less than debt, and set protocol Limited flag */
        if (_maxBaseIn.lt(_debtInBase) && !vaultSeries.seriesIsMature) {
          console.log('MaxbaseIn: ', _maxBaseIn.toString());
          console.log('AccruedArt: ', vault.accruedArt.toString());
          setProtocolLimited(false);
        } else {
          setProtocolLimited(false);
        }

        /* if the series is mature re-set max as all debt ( if balance allows) */
        if (vaultSeries.seriesIsMature) {
          const _accruedArt = vault.accruedArt.gt(_userBalance) ? _userBalance : vault.accruedArt;
          setMaxRepay(_accruedArt);
          setMaxRepay_(ethers.utils.formatUnits(_accruedArt, vaultBase?.decimals)?.toString());
        } else {
          setMaxRepay_(ethers.utils.formatUnits(_maxRepayable, vaultBase?.decimals)?.toString());
          setMaxRepay(_maxRepayable);
        }
      })();
    }
  }, [activeAccount, minDebt, seriesMap, vault, vaultBase]);



  return {
    borrowPossible,
    rollPossible,
    protocolLimited,

    borrowEstimate,
    borrowEstimate_,

    maxRepay_,
    maxRepay,

    debtAfterRepay,
    
    debtInBase,
    debtInBase_,

    minRepayable,
    minRepayable_,

    maxRoll,
    maxRoll_,

    userBaseBalance_,

    maxDebt,
    minDebt,
    maxDebt_,
    minDebt_,
  };
};
