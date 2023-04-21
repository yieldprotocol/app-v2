import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import {
  buyBase,
  buyFYToken,
  calculateMinCollateral,
  decimalNToDecimal18,
  maxFyTokenIn,
  maxFyTokenOut,
} from '@yield-protocol/ui-math';

import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { IVault, ISeries, IAssetPair } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { ZERO_BN } from '../../utils/constants';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { Address, useAccount, useBalance } from 'wagmi';
import { WETH } from '../../config/assets';
import useAccountPlus from '../useAccountPlus';

/* Collateralization hook calculates collateralization metrics */
export const useBorrowHelpers = (
  input: string | undefined,
  collateralInput: string | undefined,
  vault: IVault | undefined,
  assetPairInfo: IAssetPair | null | undefined,
  futureSeries: ISeries | null = null // Future or rollToSeries
) => {
  /* STATE FROM CONTEXT */
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const {
    userState: { assetMap, seriesMap, selectedSeries },
  } = useContext(UserContext);

  const vaultBase = assetMap.get(vault?.baseId!);
  const vaultIlk = assetMap.get(vault?.ilkId!);
  const vaultSeries = seriesMap.get(vault?.seriesId!);

  const { address: account } = useAccountPlus();
  const { data: baseBalance } = useBalance({
    address: account,
    token: vaultBase?.proxyId === WETH ? undefined : (vaultBase?.address as Address),
  });

  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();

  /* LOCAL STATE */
  const [borrowEstimate, setBorrowEstimate] = useState<BigNumber>(ethers.constants.Zero);
  const [borrowEstimate_, setBorrowEstimate_] = useState<string>();

  const [debtAfterRepay, setDebtAfterRepay] = useState<BigNumber>();

  /* the accrued art in base terms at this moment */
  /* before maturity, this is the estimated amount of fyToken (using art) that can be bought using base */
  /* after maturity, this is the vault's art plus any variable rate accrued art */

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
  const [rollProtocolLimited, setRollProtocolLimited] = useState<boolean>(false);

  /* Update the borrow limits if asset pair changes */
  useEffect(() => {
    if (assetPairInfo) {
      const _decimals = assetPairInfo.limitDecimals;
      const _maxLessTotal = assetPairInfo.maxDebtLimit.sub(assetPairInfo.pairTotalDebt);
      const _min = assetPairInfo.minDebtLimit;

      setMaxDebt(_maxLessTotal);
      setMaxDebt_(ethers.utils.formatUnits(_maxLessTotal, _decimals)?.toString());
      setMinDebt(_min);
      setMinDebt_(ethers.utils.formatUnits(_min, assetPairInfo.baseDecimals)?.toString());
    }
  }, [assetPairInfo]);

  /* check if the user can borrow the specified amount based on protocol base reserves */
  useEffect(() => {
    if (input && selectedSeries && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, selectedSeries.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, selectedSeries.decimals);
      input_.lte(selectedSeries.sharesReserves) ? setBorrowPossible(true) : setBorrowPossible(false);
    }
  }, [input, selectedSeries, selectedSeries?.sharesReserves]);

  /* check the new debt level after potential repaying */
  useEffect(() => {
    if (input && vault && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, vault.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, vault.decimals);
      /* remaining debt is debt in base less input (with a minimum of zero) */
      const remainingDebt = debtInBase.sub(input_).gte(ZERO_BN) ? debtInBase.sub(input_) : ZERO_BN;
      console.log('remainingDebt', debtInBase.sub(input_).gte(ZERO_BN));
      setDebtAfterRepay(remainingDebt);
    }
  }, [input, vault, debtInBase]);

  /* Calculate an estimated sale based on the input and future strategy, assuming correct collateralisation */
  useEffect(() => {
    if (input && futureSeries && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, futureSeries.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, futureSeries.decimals);
      const estimate = buyBase(
        futureSeries.sharesReserves,
        futureSeries.fyTokenReserves,
        futureSeries.getShares(input_),
        getTimeTillMaturity(futureSeries.maturity),
        futureSeries.ts,
        futureSeries.g2,
        futureSeries.decimals,
        futureSeries.c,
        futureSeries.mu
      );
      const estimatePlusVaultUsed = vault?.accruedArt?.gt(ethers.constants.Zero)
        ? estimate.add(vault.accruedArt)
        : estimate;
      setBorrowEstimate(estimatePlusVaultUsed);
      setBorrowEstimate_(ethers.utils.formatUnits(estimatePlusVaultUsed, futureSeries.decimals).toString());
    }
  }, [input, futureSeries, vault, getTimeTillMaturity]);

  /* SET MAX ROLL and ROLLABLE including Check if the rollToSeries have sufficient base value AND won't be undercollaterallised */
  useEffect(() => {
    if (futureSeries && vault && vault.accruedArt && vault.seriesId) {
      const _maxFyTokenIn = maxFyTokenIn(
        futureSeries.sharesReserves,
        futureSeries.fyTokenReserves,
        getTimeTillMaturity(futureSeries.maturity),
        futureSeries.ts,
        futureSeries.g2,
        futureSeries.decimals,
        futureSeries.c,
        futureSeries.mu
      );

      const newDebt = buyBase(
        futureSeries.sharesReserves,
        futureSeries.fyTokenReserves,
        futureSeries.getShares(vault.accruedArt),
        getTimeTillMaturity(futureSeries.maturity),
        futureSeries.ts,
        futureSeries.g2,
        futureSeries.decimals,
        futureSeries.c,
        futureSeries.mu
      );

      const _minCollat = calculateMinCollateral(
        assetPairInfo?.pairPrice!,
        newDebt,
        assetPairInfo?.minRatio.toString()!,
        undefined
      );
      diagnostics && console.log('min Collat of roll to series', _minCollat.toString());

      /* SET MAX ROLL */
      if (vault.accruedArt.lt(_maxFyTokenIn)) {
        setMaxRoll(vault.accruedArt);
        setMaxRoll_(ethers.utils.formatUnits(vault.accruedArt, futureSeries.decimals).toString());
        setRollProtocolLimited(false);
      } else {
        setMaxRoll(_maxFyTokenIn);
        setMaxRoll_(ethers.utils.formatUnits(_maxFyTokenIn, futureSeries.decimals).toString());
        setRollProtocolLimited(true);
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
  }, [futureSeries, vault, diagnostics, assetPairInfo, minDebt, vaultIlk?.decimals, getTimeTillMaturity]);

  /* Update the Min Max repayable amounts */
  useEffect(() => {
    if (account && vault && vaultBase && minDebt) {
      console.log('in borrowHelpers just below useEffect if', vault, vaultBase, minDebt);

      const isVRVault = !vault?.seriesId;

      if (isVRVault) {
        console.log('%c VR VAULT', 'color: green; font-weight: bold; font-size: 36px;');
        // setMaxRepay(vault.accruedArt);
        // setMaxRepay_(vault.accruedArt_);
        setDebtInBase(vault.accruedArt);
        setDebtInBase_(vault.accruedArt_);

        // some of the below is dupe code from the else statement - TODO refactor - jacob b

        /*
          an assumption is made in much of the below logic that because VR borrows arent series,
          and thus have no maturity date, I've modified the conditionals from the else statement to default
          to the isMature option. Is this the right way to think about it? - jacob b
        */

        const _baseRequired = vault.accruedArt.eq(ethers.constants.Zero) ? ethers.constants.Zero : vault.accruedArt; // modified this logic from original, TODO verify this logic - jacob b

        const _debtInBase = isMature(vaultSeries?.maturity!) ? vault.accruedArt : _baseRequired;
        // assume that if sharesReserves are zero then the pool is not functioning correctly, so use the total vault debt
        // this assumption is invalid if the pool has liquidity, but someone borrowed (took out) all shares from the pool
        // in the above scenario, the pool would be valid, and all functionality should be available
        const debtInBaseChecked = vaultSeries?.sharesReserves.eq(ethers.constants.Zero)
          ? vault.accruedArt
          : _debtInBase;
        // add buffer to handle moving interest accumulation
        const _debtInBaseWithBuffer = debtInBaseChecked.mul(10000).div(9999);

        setDebtInBase(_debtInBaseWithBuffer);
        setDebtInBase_(ethers.utils.formatUnits(_debtInBaseWithBuffer, vaultBase.decimals));

        /* maxRepayable is either the max tokens they have or max debt */
        const _maxRepayable =
          baseBalance?.value && _debtInBaseWithBuffer.gt(baseBalance.value) ? baseBalance.value : _debtInBaseWithBuffer;

        /* set the min repayable up to the dust limit */
        const _maxToDust = vault.accruedArt.gt(minDebt) ? _maxRepayable.sub(minDebt) : vault.accruedArt;
        _maxToDust && setMinRepayable(_maxToDust);
        _maxToDust && setMinRepayable_(ethers.utils.formatUnits(_maxToDust, vaultBase?.decimals)?.toString());

        const _accruedArt = vault.accruedArt.gt(baseBalance?.value || ethers.constants.Zero)
          ? baseBalance?.value!
          : vault.accruedArt;
        setMaxRepay(_accruedArt);
        setMaxRepay_(debtInBase_);
      } else {
        const vaultSeries = seriesMap.get(vault?.seriesId!);
        if (!vaultSeries) return;

        /* estimate max fyToken out to assess protocol limits */
        const _maxFyTokenOut = maxFyTokenOut(
          vaultSeries.sharesReserves,
          vaultSeries.fyTokenReserves,
          getTimeTillMaturity(vaultSeries.maturity),
          vaultSeries.ts,
          vaultSeries.g1,
          vaultSeries.decimals,
          vaultSeries.c,
          vaultSeries.mu
        );

        const limited = _maxFyTokenOut.lt(vault.accruedArt);

        /* adjust max repayable to vault art if protocol limited */
        if (limited) {
          const accruedArt_ = ethers.utils.formatUnits(vault.accruedArt, vault.decimals); // is this necessary? seems this is already done in vault - jacob b
          setMaxRepay(vault.accruedArt);
          setMaxRepay_(accruedArt_);
          setDebtInBase(vault.accruedArt);
          setDebtInBase_(accruedArt_);
        } else {
          const _sharesRequired = buyFYToken(
            vaultSeries.sharesReserves,
            vaultSeries.fyTokenReserves,
            vault.accruedArt,
            getTimeTillMaturity(vaultSeries.maturity),
            vaultSeries.ts,
            vaultSeries.g1,
            vaultSeries.decimals,
            vaultSeries.c,
            vaultSeries.mu
          );

          const _baseRequired = vault.accruedArt.eq(ethers.constants.Zero)
            ? ethers.constants.Zero
            : vaultSeries.getBase(_sharesRequired);

          const _debtInBase = isMature(vaultSeries.maturity) ? vault.accruedArt : _baseRequired;
          // add buffer to handle moving interest accumulation
          const _debtInBaseWithBuffer = _debtInBase.mul(1000).div(999);

          setDebtInBase(_debtInBaseWithBuffer);
          setDebtInBase_(ethers.utils.formatUnits(_debtInBaseWithBuffer, vaultBase.decimals));

          /* maxRepayable is either the max tokens they have or max debt */
          const _maxRepayable =
            baseBalance?.value && _debtInBaseWithBuffer.gt(baseBalance.value)
              ? baseBalance.value
              : _debtInBaseWithBuffer;

          /* set the min repayable up to the dust limit */
          const _maxToDust = vault.accruedArt.gt(minDebt) ? _maxRepayable.sub(minDebt) : vault.accruedArt;
          _maxToDust && setMinRepayable(_maxToDust);
          _maxToDust && setMinRepayable_(ethers.utils.formatUnits(_maxToDust, vaultBase?.decimals)?.toString());

          /* if the series is mature re-set max as all debt (if balance allows) */
          if (vaultSeries.seriesIsMature) {
            const _accruedArt = vault.accruedArt.gt(baseBalance?.value || ethers.constants.Zero)
              ? baseBalance?.value!
              : vault.accruedArt;
            setMaxRepay(_accruedArt);
            setMaxRepay_(ethers.utils.formatUnits(_accruedArt, vaultBase?.decimals)?.toString());
          } else {
            setMaxRepay_(ethers.utils.formatUnits(_maxRepayable, vaultBase.decimals));
            setMaxRepay(_maxRepayable);
          }
        }
      }
    }
  }, [
    account,
    baseBalance?.formatted,
    baseBalance?.value,
    getTimeTillMaturity,
    isMature,
    minDebt,
    seriesMap,
    vault,
    vaultBase,
  ]);

  console.log('useBorrowHelpers RETURNs', vault, debtAfterRepay?.toString(), vaultBase);
  console.table({
    borrowPossible,
    rollPossible,
    rollProtocolLimited,

    borrowEstimate,
    borrowEstimate_,

    maxRepay_,
    maxRepay,

    debtInBase,
    debtInBase_,

    debtAfterRepay,

    minRepayable,
    minRepayable_,

    maxRoll,
    maxRoll_,

    userBaseBalance: baseBalance?.value,
    userBaseBalance_: baseBalance?.formatted,
    maxDebt,
    minDebt,
    maxDebt_,
    minDebt_,
  });

  return {
    borrowPossible,
    rollPossible,
    rollProtocolLimited,

    borrowEstimate,
    borrowEstimate_,

    maxRepay_,
    maxRepay,

    debtInBase,
    debtInBase_,

    debtAfterRepay,

    minRepayable,
    minRepayable_,

    maxRoll,
    maxRoll_,

    userBaseBalance: baseBalance?.value,
    userBaseBalance_: baseBalance?.formatted,
    maxDebt,
    minDebt,
    maxDebt_,
    minDebt_,
  };
};
