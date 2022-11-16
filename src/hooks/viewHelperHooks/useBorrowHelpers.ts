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
import { ISeries, IAssetPair } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { ZERO_BN } from '../../utils/constants';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { useAccount } from 'wagmi';
import useAsset from '../useAsset';
import useVault from '../useVault';
import useSeriesEntity from '../useSeriesEntity';

/* Collateralization hook calculates collateralization metrics */
export const useBorrowHelpers = (
  input: string | undefined,
  collateralInput: string | undefined,
  vaultId: string | undefined,
  assetPairInfo: IAssetPair | undefined,
  futureSeries: ISeries | null = null // Future or rollToSeries
) => {
  /* STATE FROM CONTEXT */
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const {
    userState: { selectedSeries },
  } = useContext(UserContext);

  const { data: vault } = useVault(vaultId);
  const { data: vaultBase } = useAsset(vault?.baseId!);
  const { data: vaultIlk } = useAsset(vault?.ilkId!);
  const { data: seriesEntity } = useSeriesEntity(vault ? vault.seriesId : selectedSeries?.id);
  const { data: futureSeriesEntity } = useSeriesEntity(futureSeries?.id);

  const { address: account } = useAccount();

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
    if (!seriesEntity) return;

    const { decimals, getBase, sharesReserves } = seriesEntity;

    if (input && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, decimals);
      input_.lte(getBase(sharesReserves.value)) ? setBorrowPossible(true) : setBorrowPossible(false);
    }
  }, [input, seriesEntity]);

  /* check the new debt level after potential repaying */
  useEffect(() => {
    if (input && vault && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, vault.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, vault.decimals);
      /* remaining debt is debt in base less input (with a minimum of zero) */
      const remainingDebt = debtInBase.sub(input_).gte(ZERO_BN) ? debtInBase.sub(input_) : ZERO_BN;
      setDebtAfterRepay(remainingDebt);
    }
  }, [input, vault, debtInBase]);

  /* Calculate an estimated sale based on the input and future strategy, assuming correct collateralisation */
  useEffect(() => {
    if (!futureSeriesEntity) return;

    const { decimals, getShares, sharesReserves, fyTokenReserves, maturity, ts, g2, c, mu } = futureSeriesEntity;

    if (input && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, decimals);
      const estimate = buyBase(
        sharesReserves.value,
        fyTokenReserves.value,
        getShares(input_),
        getTimeTillMaturity(maturity),
        ts,
        g2,
        decimals,
        c,
        mu
      );

      const estimatePlusVaultUsed = vault?.accruedArt?.value.gt(ethers.constants.Zero)
        ? estimate.add(vault.accruedArt.value)
        : estimate;
      setBorrowEstimate(estimatePlusVaultUsed);
      setBorrowEstimate_(ethers.utils.formatUnits(estimatePlusVaultUsed, decimals).toString());
    }
  }, [futureSeriesEntity, getTimeTillMaturity, input, vault]);

  /* SET MAX ROLL and ROLLABLE including Check if the rollToSeries have sufficient base value AND won't be undercollaterallised */
  useEffect(() => {
    if (!futureSeriesEntity) return;

    const { sharesReserves, fyTokenReserves, decimals, c, mu, maturity, ts, g2, getShares } = futureSeriesEntity;

    if (vault && vault.accruedArt) {
      const _maxFyTokenIn = maxFyTokenIn(
        sharesReserves.value,
        fyTokenReserves.value,
        getTimeTillMaturity(maturity),
        ts,
        g2,
        decimals,
        c,
        mu
      );

      const newDebt = buyBase(
        sharesReserves.value,
        fyTokenReserves.value,
        getShares(vault.accruedArt.value),
        getTimeTillMaturity(maturity),
        ts,
        g2,
        decimals,
        c,
        mu
      );

      const _minCollat = calculateMinCollateral(
        assetPairInfo!.pairPrice,
        newDebt,
        assetPairInfo!.minRatio.toString(),
        undefined
      );
      diagnostics && console.log('min Collat of roll to series', _minCollat.toString());

      /* SET MAX ROLL */
      if (vault.accruedArt.value.lt(_maxFyTokenIn)) {
        setMaxRoll(vault.accruedArt.value);
        setMaxRoll_(ethers.utils.formatUnits(vault.accruedArt.value, decimals).toString());
        setRollProtocolLimited(false);
      } else {
        setMaxRoll(_maxFyTokenIn);
        setMaxRoll_(ethers.utils.formatUnits(_maxFyTokenIn, decimals).toString());
        setRollProtocolLimited(true);
      }

      // conditions for allowing rolling
      const conditionsMet =
        vault.accruedArt.value.lt(_maxFyTokenIn) &&
        decimalNToDecimal18(vault.ink.value, vaultIlk?.decimals || 18).gt(_minCollat) &&
        vault.accruedArt.value.gt(minDebt!);

      /* SET ROLLABLE */
      const rollable = vault.accruedArt.value.eq(ZERO_BN) // always rollable if zero debt
        ? true
        : conditionsMet;

      diagnostics && console.log('Roll possible: ', rollable);
      setRollPossible(rollable);
    }
  }, [assetPairInfo, diagnostics, futureSeriesEntity, getTimeTillMaturity, minDebt, vault, vaultIlk?.decimals]);

  /* Update the Min Max repayable amounts */
  useEffect(() => {
    if (!seriesEntity) return;

    const { sharesReserves, fyTokenReserves, maturity, ts, g1, decimals, c, mu, seriesIsMature, getBase } =
      seriesEntity;

    if (account && vault && vaultBase && minDebt) {
      /* estimate max fyToken out to assess protocol limits */
      const _maxFyTokenOut = maxFyTokenOut(
        sharesReserves.value,
        fyTokenReserves.value,
        getTimeTillMaturity(maturity),
        ts,
        g1,
        decimals,
        c,
        mu
      );

      const limited = _maxFyTokenOut.lt(vault.accruedArt.value);

      /* adjust max repayable to vault art if protocol limited */
      if (limited) {
        const accruedArt_ = ethers.utils.formatUnits(vault.accruedArt.value, vault.decimals);
        setMaxRepay(vault.accruedArt.value);
        setMaxRepay_(accruedArt_);
        setDebtInBase(vault.accruedArt.value);
        setDebtInBase_(accruedArt_);
      } else {
        const _sharesRequired = buyFYToken(
          sharesReserves.value,
          fyTokenReserves.value,
          vault.accruedArt.value,
          getTimeTillMaturity(maturity),
          ts,
          g1,
          decimals,
          c,
          mu
        );

        const _baseRequired = vault.accruedArt.value.eq(ethers.constants.Zero)
          ? ethers.constants.Zero
          : getBase(_sharesRequired);

        const _debtInBase = isMature(maturity) ? vault.accruedArt.value : _baseRequired;
        // add buffer to handle moving interest accumulation
        const _debtInBaseWithBuffer = _debtInBase.mul(1000).div(999);

        setDebtInBase(_debtInBaseWithBuffer);
        setDebtInBase_(ethers.utils.formatUnits(_debtInBaseWithBuffer, vaultBase.decimals));

        /* maxRepayable is either the max tokens they have or max debt */
        const _maxRepayable =
          vaultBase.balance.value && _debtInBaseWithBuffer.gt(vaultBase.balance.value)
            ? vaultBase.balance.value
            : _debtInBaseWithBuffer;

        /* set the min repayable up to the dust limit */
        const _maxToDust = vault.accruedArt.value.gt(minDebt) ? _maxRepayable.sub(minDebt) : vault.accruedArt.value;
        _maxToDust && setMinRepayable(_maxToDust);
        _maxToDust && setMinRepayable_(ethers.utils.formatUnits(_maxToDust, vaultBase?.decimals)?.toString());

        /* if the series is mature re-set max as all debt (if balance allows) */
        if (seriesIsMature) {
          const _accruedArt = vault.accruedArt.value.gt(vaultBase.balance.value || ethers.constants.Zero)
            ? vaultBase.balance.value
            : vault.accruedArt.value;
          setMaxRepay(_accruedArt);
          setMaxRepay_(ethers.utils.formatUnits(_accruedArt, vaultBase?.decimals)?.toString());
        } else {
          setMaxRepay_(ethers.utils.formatUnits(_maxRepayable, vaultBase.decimals));
          setMaxRepay(_maxRepayable);
        }
      }
    }
  }, [account, getTimeTillMaturity, isMature, minDebt, seriesEntity, vault, vaultBase]);

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

    userBaseBalance: vaultBase?.balance.value || ethers.constants.Zero,
    userBaseBalance_: vaultBase?.balance.formatted || '0',
    maxDebt,
    minDebt,
    maxDebt_,
    minDebt_,
  };
};
