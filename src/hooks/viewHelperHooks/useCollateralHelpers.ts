import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { IAssetPair, IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { ZERO_BN } from '../../utils/constants';

import { calculateCollateralizationRatio, calculateMinCollateral, decimalNToDecimal18 } from '../../utils/yieldMath';
import { useAssetPair } from '../useAssetPair';

/* Collateralization hook calculates collateralization metrics */
export const useCollateralHelpers = (
  debtInput: string | undefined,
  collInput: string | undefined,
  vault: IVault | undefined
) => {
  /* STATE FROM CONTEXT */
  const {
    userState: { activeAccount, selectedBase, selectedIlk },
  } = useContext(UserContext);

  /* LOCAL STATE */
  const [collateralizationRatio, setCollateralizationRatio] = useState<string | undefined>();
  const [collateralizationPercent, setCollateralizationPercent] = useState<string | undefined>();
  const [undercollateralized, setUndercollateralized] = useState<boolean>(true);
  const [unhealthyCollatRatio, setUnhealthyCollatRatio] = useState<boolean>(false);

  const [oraclePrice, setOraclePrice] = useState<ethers.BigNumber>(ethers.constants.Zero);

  const [minCollateral, setMinCollateral] = useState<BigNumber>();
  const [minCollateral_, setMinCollateral_] = useState<string | undefined>();

  const [minCollatRatio, setMinCollatRatio] = useState<number | undefined>();
  const [minCollatRatioPct, setMinCollatRatioPct] = useState<string | undefined>();
  const [minSafeCollatRatio, setMinSafeCollatRatio] = useState<number | undefined>();
  const [minSafeCollatRatioPct, setMinSafeCollatRatioPct] = useState<string | undefined>();
  const [minSafeCollateral, setMinSafeCollateral] = useState<string | undefined>();
  const [maxRemovableCollateral, setMaxRemovableCollateral] = useState<string | undefined>();
  const [maxCollateral, setMaxCollateral] = useState<string | undefined>();

  const assetPairInfo: IAssetPair | undefined = useAssetPair(selectedBase, selectedIlk);

  /* update the prices/limits if anything changes with the asset pair */
  useEffect(() => {
    if (assetPairInfo) {
      /* set the pertinent oracle price */
      setOraclePrice(decimalNToDecimal18(assetPairInfo.pairPrice, assetPairInfo.baseDecimals));

      /* set min collaterateralisation ratio */
      setMinCollatRatio(assetPairInfo?.minRatio);
      setMinCollatRatioPct((assetPairInfo?.minRatio * 100).toString());

      /* set min safe coll ratio */
      const _minSafeCollatRatio = assetPairInfo?.minRatio < 1.4 ? 1.5 : assetPairInfo?.minRatio + 1;
      setMinSafeCollatRatio(_minSafeCollatRatio);
      setMinSafeCollatRatioPct((_minSafeCollatRatio * 100).toString());
    }
  }, [assetPairInfo]);

  /* CHECK collateral selection and sets the max available collateral a user can add based on his balance */
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
      const ratio = calculateCollateralizationRatio(totalCollateral, oraclePrice, totalDebt, false);
      const percent = calculateCollateralizationRatio(totalCollateral, oraclePrice, totalDebt, true);
      setCollateralizationRatio(ratio);
      setCollateralizationPercent(parseFloat(percent! || '0').toFixed(2));
    } else {
      setCollateralizationRatio('0.0');
      setCollateralizationPercent(cleanValue('0.0', 2));
    }

    /* check minimum collateral required base on debt */
    if (oraclePrice.gt(ethers.constants.Zero)) {
      const min = calculateMinCollateral(oraclePrice, totalDebt, minCollatRatio!.toString(), existingCollateralAsWei);
      const minSafeCalc = calculateMinCollateral(
        oraclePrice,
        totalDebt,
        (minSafeCollatRatio || 2.5).toString(),
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
    collInput,
    debtInput,
    selectedIlk,
    oraclePrice,
    vault,
    collateralizationRatio,
    selectedBase,
    minCollatRatio,
    minSafeCollatRatio,
  ]);

  /* Monitor for undercollaterization/ danger-collateralisation, and set flags if reqd. */
  useEffect(() => {
    parseFloat(collateralizationRatio!) >= minCollatRatio!
      ? setUndercollateralized(false)
      : setUndercollateralized(true);

    parseFloat(collateralizationRatio!) < minCollatRatio! + 0.2 && vault?.art.gt(ethers.constants.Zero)
      ? setUnhealthyCollatRatio(true)
      : setUnhealthyCollatRatio(false);
  }, [collateralizationRatio, minCollatRatio, vault?.art]);

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
