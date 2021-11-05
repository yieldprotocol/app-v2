import { BigNumber,  BigNumberish,  ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { IVault, ISeries, IAsset } from '../../types';
import { cleanValue } from '../../utils/appUtils';

import { buyBase, calculateMinCollateral, maxBaseIn, maxFyTokenIn, sellBase } from '../../utils/yieldMath';

/* Collateralization hook calculates collateralization metrics */
export const useBorrowHelpers = (
  input: string | undefined,
  collateralInput: string | undefined,
  vault: IVault | undefined,
  futureSeries: ISeries | undefined = undefined // Future or rollToSeries
) => {
  /* STATE FROM CONTEXT */
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const {
    userState: {
      activeAccount,
      selectedBaseId,
      selectedIlkId,
      assetMap,
      seriesMap,
      limitMap,
      priceMap,
      selectedSeriesId,
    },
    userActions: { updateLimit },
  } = useContext(UserContext);

  const vaultBase: IAsset | undefined = assetMap.get(vault?.baseId!);
  const selectedSeries: ISeries | undefined = seriesMap.get(selectedSeriesId!);
  const selectedBase: IAsset | undefined = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */
  const [borrowEstimate, setBorrowEstimate] = useState<BigNumber>(ethers.constants.Zero);
  const [borrowEstimate_, setBorrowEstimate_] = useState<string>();

  const [vaultDebt_, setVaultDebt_] = useState<string | undefined>();

  /* debt limits */
  const [minDebt, setMinDebt] = useState<BigNumber>();
  const [minDebt_, setMinDebt_] = useState<string | undefined>();

  const [maxDebt, setMaxDebt] = useState<BigNumber>();
  const [maxDebt_, setMaxDebt_] = useState<string | undefined>();

  const [totalDebt, setTotalDebt] = useState<BigNumber>();
  const [totalDebt_, setTotalDebt_] = useState<string | undefined>();

  const [aboveDebtLimit, setAboveDebtLimit] = useState<boolean>(true);
  const [borrowPossible, setBorrowPossible] = useState<boolean>(false);

  const [maxRepay, setMaxRepay] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRepay_, setMaxRepay_] = useState<string | undefined>();
  const [minRepay, setMinRepay] = useState<BigNumber>(ethers.constants.Zero);
  const [minRepay_, setMinRepay_] = useState<string | undefined>();

  const [maxRoll, setMaxRoll] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRoll_, setMaxRoll_] = useState<string | undefined>();
  const [rollPossible, setRollPossible] = useState<boolean>(false);

  const [userBaseAvailable, setUserBaseAvailable] = useState<BigNumber>(ethers.constants.Zero);
  const [userBaseAvailable_, setUserBaseAvailable_] = useState<string | undefined>();
  const [protocolBaseAvailable, setProtocolBaseAvailable] = useState<BigNumber>(ethers.constants.Zero);

  /* Update the borrow limits if ilk or base changes */
  useEffect(() => {
    const setLimits = (max: BigNumber, min: BigNumber, decimals: BigNumberish, total: BigNumber) => {
      
      const _decimals = decimals.toString();
      const _max = ethers.utils.parseUnits(max.toString(), _decimals) || ethers.constants.Zero;
      const _min = ethers.utils.parseUnits(min.toString(), _decimals) || ethers.constants.Zero;
      const _total = total || ethers.constants.Zero;

      const maxLessTotal = _max.sub(_total);

      setMaxDebt_(ethers.utils.formatUnits(_max, _decimals)?.toString());
      setMinDebt_(ethers.utils.formatUnits(_min, _decimals)?.toString());
       
      setMaxDebt(maxLessTotal);
      setMinDebt(_min);
      setTotalDebt(_total);
      
      setMaxDebt_(ethers.utils.formatUnits(maxLessTotal, _decimals)?.toString());
      setMinDebt_(ethers.utils.formatUnits(_min, _decimals)?.toString());
      setTotalDebt_(ethers.utils.formatUnits(_total, _decimals)?.toString());

    };

    if (limitMap.get(selectedBaseId)?.has(selectedIlkId!)) {
      const _limit = limitMap.get(selectedBaseId).get(selectedIlkId); // get the limit from the map
      setLimits(_limit[0], _limit[1], _limit[2], _limit[3]);
      diagnostics && console.log('Cached Limit:', _limit[1].toString(), _limit[0].toString());
    } else {
      (async () => {
        if (selectedIlkId && selectedBaseId) {
          /* Update Price before setting */
          const _limit = await updateLimit(selectedBaseId, selectedIlkId);
          setLimits(_limit[0], _limit[1], _limit[2], _limit[3]);
          diagnostics &&
            console.log('External call:', 'MIN LIMIT:', _limit[1].toString(), 'MAX LIMIT:', _limit[0].toString());
        }
      })();
    }
  }, [limitMap, selectedBaseId, selectedIlkId, updateLimit, diagnostics]);

  /* check max debt limit is not reached */
  useEffect(() => {
    if (input) {
      const cleanedInput = cleanValue(input, selectedBase?.decimals);
      const _input = ethers.utils.parseUnits(cleanedInput, selectedBase?.decimals);
      const inputAndTotal = _input.add(totalDebt!);
      setAboveDebtLimit(inputAndTotal.gte(maxDebt!));
    }
  }, [input, maxDebt, minDebt, selectedBase?.decimals, totalDebt]);

  /* check if the user can borrow the specified amount based on protocol base reserves */
  useEffect(() => {
    if (input && selectedSeries && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, selectedSeries?.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, selectedSeries?.decimals);
      input_.lte(selectedSeries?.baseReserves!) ? setBorrowPossible(true) : setBorrowPossible(false);
    }
  }, [input, selectedSeries, selectedSeries?.baseReserves]);

  /* Calculate an estimated sale based on the input and future strategy, assuming correct collateralisation */
  useEffect(() => {
    if (input && futureSeries && parseFloat(input) > 0) {
      const cleanedInput = cleanValue(input, futureSeries?.decimals);
      const input_ = ethers.utils.parseUnits(cleanedInput, futureSeries?.decimals);
      const estimate = sellBase(
        futureSeries.baseReserves,
        futureSeries.fyTokenReserves,
        input_,
        futureSeries.getTimeTillMaturity(),
        futureSeries.decimals
      );
      setBorrowEstimate(estimate);
      setBorrowEstimate_(ethers.utils.formatUnits(estimate, futureSeries.decimals).toString());
    }
  }, [input, futureSeries]);

  /* Check if the rollToSeries have sufficient base value AND won't be undercollaterallised */
  useEffect(() => {
    if (futureSeries && vault && vault.art) {
      const _maxFyTokenIn = maxFyTokenIn(
        futureSeries.baseReserves,
        futureSeries.fyTokenReserves,
        futureSeries.getTimeTillMaturity(),
        futureSeries.decimals
      );
      setMaxRoll(_maxFyTokenIn);
      setMaxRoll_(ethers.utils.formatUnits(_maxFyTokenIn, futureSeries.decimals).toString());

      const newDebt = buyBase(
        futureSeries.baseReserves,
        futureSeries.fyTokenReserves,
        vault.art,
        futureSeries.getTimeTillMaturity(),
        futureSeries.decimals
      );

      const price = priceMap?.get(vault.ilkId)?.get(vault.baseId);
      const minCollat = calculateMinCollateral(price, newDebt, undefined, undefined, true);
      diagnostics && console.log('min Collat', minCollat.toString());

      const rollable = vault.art.lt(_maxFyTokenIn) && vault.ink.gt(minCollat);

      diagnostics && console.log('Roll possible: ', rollable);
      setRollPossible(rollable);

      if (vault.art?.lt(_maxFyTokenIn)) {
        setMaxRoll(vault.art);
        setMaxRoll_(ethers.utils.formatUnits(vault.art, futureSeries.decimals).toString());
      }
    }
  }, [futureSeries, priceMap, vault, diagnostics]);

  /* Update the Min Max repayable amounts */
  useEffect(() => {
    if (activeAccount && vault && vaultBase) {
      const _minDebt = ethers.utils.parseUnits('0.5', vaultBase?.decimals);
      const vaultSeries: ISeries = seriesMap.get(vault?.seriesId!);

      (async () => {
        const _maxToken = await vaultBase?.getBalance(activeAccount);
        const _maxDebt = vault.art;
        setVaultDebt_(ethers.utils.formatUnits(vault.art, vaultBase.decimals));

        /* max user is either the max tokens they have or max debt */
        const _maxUser = _maxToken && _maxDebt?.gt(_maxToken) ? _maxToken : _maxDebt;
        const _maxToDust = _maxUser.sub(_minDebt);
        const _maxBaseIn = maxBaseIn(
          vaultSeries?.baseReserves,
          vaultSeries?.fyTokenReserves,
          vaultSeries?.getTimeTillMaturity(),
          vaultSeries?.decimals
        );

        /* set the dust limit */
        _maxToDust && setMinRepay(_maxToDust);
        _maxToDust && setMinRepay_(ethers.utils.formatUnits(_maxToDust, vaultBase?.decimals)?.toString());

        _maxBaseIn && setProtocolBaseAvailable(_maxBaseIn);

        /* set the maxBase available for both user and protocol */
        if (_maxUser) {
          setUserBaseAvailable(_maxUser);
          setUserBaseAvailable_(ethers.utils.formatUnits(_maxUser, vaultBase.decimals!).toString());
        }

        /* set the maxRepay as the biggest of the two, human readbale and BN */
        if (_maxUser && _maxBaseIn && _maxUser.gt(_maxBaseIn)) {
          setMaxRepay_(ethers.utils.formatUnits(_maxBaseIn, vaultBase?.decimals)?.toString());
          setMaxRepay(_maxBaseIn);
        } else {
          setMaxRepay_(ethers.utils.formatUnits(_maxUser, vaultBase?.decimals)?.toString());
          setMaxRepay(_maxUser);
        }
      })();
    }
  }, [activeAccount, seriesMap, vault, vaultBase]);

  return {
    borrowEstimate,
    borrowEstimate_,
    borrowPossible,

    maxRepay_,
    maxRepay,

    minRepay,
    minRepay_,

    maxRoll,
    maxRoll_,
    rollPossible,

    userBaseAvailable,
    protocolBaseAvailable,
    userBaseAvailable_,

    vaultDebt_,
    totalDebt_,

    maxDebt_,
    minDebt_,
    aboveDebtLimit,
  };
};
