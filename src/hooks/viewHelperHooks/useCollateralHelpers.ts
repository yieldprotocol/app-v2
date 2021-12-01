import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { ZERO_BN } from '../../utils/constants';

import { calcCollateralizationRatio, calcMinCollateral, decimalNToDecimal18 } from '../../utils/yieldMath';

/* Collateralization hook calculates collateralization metrics */
export const useCollateralHelpers = (
  debtInput: string | undefined,
  collInput: string | undefined,
  vault: IVault | undefined,
) => {
  /* STATE FROM CONTEXT */
  const {
    userState: { activeAccount, selectedBase, selectedIlk, priceMap },
    userActions: { updatePrice },
  } = useContext(UserContext);
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  /* LOCAL STATE */
  const [collateralizationRatio, setCollateralizationRatio] = useState<string | undefined>();
  const [collateralizationPercent, setCollateralizationPercent] = useState<string | undefined>();
  const [undercollateralized, setUndercollateralized] = useState<boolean>(true);
  const [unhealthyCollatRatio, setUnhealthyCollatRatio] = useState<boolean>(false);

  const [oraclePrice, setOraclePrice] = useState<ethers.BigNumber>(ethers.constants.Zero);

  const [minCollateral, setMinCollateral] = useState<BigNumber>();
  const [minCollateral_, setMinCollateral_] = useState<string | undefined>();

  const [minCollatRatioPct, setMinCollatRatioPct] = useState<string | undefined>();
  const [minSafeCollatRatio, setMinSafeCollatRatio] = useState<number | undefined>();
  const [minSafeCollatRatioPct, setMinSafeCollatRatioPct] = useState<string | undefined>();
  const [minSafeCollateral, setMinSafeCollateral] = useState<string | undefined>();
  const [maxRemovableCollateral, setMaxRemovableCollateral] = useState<string | undefined>();
  const [maxCollateral, setMaxCollateral] = useState<string | undefined>();

  /* update the prices if anything changes */
  useEffect(() => {
    if (selectedBase && selectedIlk && priceMap.get(selectedIlk.idToUse)?.has(selectedBase.idToUse)) {
      const _price = priceMap.get(selectedIlk.idToUse).get(selectedBase.idToUse); // get the price
      setOraclePrice(decimalNToDecimal18(_price, selectedBase.decimals)); // make sure the price is 18decimals based
    } else {
      (async () => {
        if (selectedBase && selectedIlk) {
          /* Update Price before setting */
          const _price = await updatePrice(selectedIlk.idToUse, selectedBase.idToUse, selectedIlk.decimals);
          setOraclePrice(decimalNToDecimal18(_price, selectedBase.decimals)); // make sure the price is 18decimals based
        }
      })();
    }
  }, [priceMap, updatePrice, selectedBase, selectedIlk]);

  /* CHECK collateral selection and sets the max available collateral a user can add */
  useEffect(() => {
    activeAccount &&
      (async () => {
        const _max = await selectedIlk?.getBalance(activeAccount);
        _max && setMaxCollateral(ethers.utils.formatUnits(_max, selectedIlk.decimals)?.toString());
      })();
  }, [activeAccount, selectedIlk, setMaxCollateral]);

  /* handle changes to input values */
  useEffect(() => {
    /* NOTE: this whole function ONLY deals with decimal18, existing values are converted to decimal18 */
    const existingCollateral_ = vault?.ink ? vault.ink : ethers.constants.Zero;
    const existingCollateralAsWei = decimalNToDecimal18(existingCollateral_, selectedIlk?.decimals);

    const existingDebt_ = vault?.art ? vault.art : ethers.constants.Zero;
    const existingDebtAsWei = decimalNToDecimal18(existingDebt_, selectedBase?.decimals);

    const dInput =
      debtInput && Math.abs(parseFloat(debtInput)) > 0 ? ethers.utils.parseUnits(debtInput, 18) : ethers.constants.Zero;
    const cInput =
      collInput && Math.abs(parseFloat(collInput)) > 0 ? ethers.utils.parseUnits(collInput, 18) : ethers.constants.Zero;

    const totalCollateral = existingCollateralAsWei.add(cInput);
    const totalDebt = existingDebtAsWei.add(dInput);

    /* set the collateral ratio when collateral is entered */
    if (oraclePrice.gt(ethers.constants.Zero) && totalCollateral.gt(ethers.constants.Zero)) {
      const ratio = calcCollateralizationRatio(totalCollateral, oraclePrice, totalDebt, false);
      const percent = calcCollateralizationRatio(totalCollateral, oraclePrice, totalDebt, true);
      setCollateralizationRatio(ratio);
      setCollateralizationPercent(parseFloat(percent! || '0').toFixed(2));
    } else {
      setCollateralizationRatio('0.0');
      setCollateralizationPercent(cleanValue('0.0', 2));
    }

    /* check minimum collateral required base on debt */
    if (oraclePrice.gt(ethers.constants.Zero)) {
      const min = calcMinCollateral(oraclePrice, totalDebt, vault?.minRatio! || 1.5, existingCollateralAsWei);
      const minSafeCalc = calcMinCollateral(
        oraclePrice,
        totalDebt,
        (minSafeCollatRatio || 2.5),
        existingCollateralAsWei
      );

      /* Check max collateral that is removable (based on exisiting debt)
         use a buffer of 1% if there is vault debt to prevent undercollateralized failed tx's
         else use the existing collateral
      */
      const _maxRemove = vault?.art.gt(ethers.constants.Zero)
        ? existingCollateralAsWei.sub(min).mul(99).div(100)
        : existingCollateralAsWei;
      setMaxRemovableCollateral(ethers.utils.formatUnits(_maxRemove, 18).toString());

      // factor in the current collateral input if there is a valid chosen vault
      const minSafeWithCollat = BigNumber.from(minSafeCalc).sub(existingCollateralAsWei);

      // check for valid min safe scenarios
      const minSafe = minSafeWithCollat.gt(ethers.constants.Zero)
        ? ethers.utils.formatUnits(minSafeWithCollat, 18).toString()
        : undefined;
      setMinCollateral(min as BigNumber);
      setMinCollateral_(ethers.utils.formatUnits(min, 18).toString());
      setMinSafeCollateral(minSafe);
    } else {
      setMinCollateral(ZERO_BN);
      setMinCollateral_('0');
    }
  }, [
    priceMap,
    collInput,
    debtInput,
    selectedIlk,
    oraclePrice,
    vault,
    collateralizationRatio,
    selectedBase,
    minSafeCollatRatio,
  ]);

  /* Monitor for undercollaterization */
  useEffect(() => {
    parseFloat(collateralizationRatio!) >= vault?.minRatio!
      ? setUndercollateralized(false)
      : setUndercollateralized(true);

    parseFloat(collateralizationRatio!) < vault?.minRatio! + 0.2 && vault?.art.gt(ethers.constants.Zero)
      ? setUnhealthyCollatRatio(true)
      : setUnhealthyCollatRatio(false);
  }, [collateralizationRatio, vault?.art, vault?.minRatio]);

  return {
    collateralizationRatio,
    collateralizationPercent,
    undercollateralized,
    minCollateral,
    minCollateral_,
    minCollatRatioPct,
    minSafeCollatRatioPct,
    minSafeCollateral,
    maxCollateral,
    maxRemovableCollateral,
    unhealthyCollatRatio,
  };
};
