import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import {
  buyBase,
  calcLiquidationPrice,
  calculateCollateralizationRatio,
  calculateMinCollateral,
  decimalNToDecimal18,
} from '@yield-protocol/ui-math';

import { UserContext } from '../../contexts/UserContext';
import { IAssetPair, IVault } from '../../types';
import { cleanValue } from '../../utils/appUtils';
import { ZERO_BN } from '../../utils/constants';
import useTimeTillMaturity from '../useTimeTillMaturity';
import { Address, useAccount, useBalance } from 'wagmi';
import { WETH } from '../../config/assets';
import useAccountPlus from '../useAccountPlus';

/* Collateralization hook calculates collateralization metrics */
export const useCollateralHelpers = (
  debtInput: string | undefined,
  collInput: string | undefined,
  vault: IVault | undefined,
  assetPairInfo: IAssetPair | undefined | null,
  isVR: boolean | null
) => {
  console.log('%c useCollateralHelpers singular hook', 'color: orange; font-weight: bold;');
  /* STATE FROM CONTEXT */
  const {
    userState: { selectedBase, selectedIlk, selectedSeries, assetMap, seriesMap },
  } = useContext(UserContext);

  const _selectedBase = vault ? assetMap?.get(vault.baseId) : selectedBase;
  const _selectedIlk = vault ? assetMap?.get(vault.ilkId) : selectedIlk;
  const _selectedSeries = vault && vault.seriesId ? seriesMap?.get(vault.seriesId) : selectedSeries;

  /* HOOKS */
  const { getTimeTillMaturity } = useTimeTillMaturity();
  const { address: activeAccount } = useAccountPlus();
  const { data: userIlkBalance } = useBalance({
    address: activeAccount,
    token: _selectedIlk?.proxyId === WETH ? undefined : (_selectedIlk?.address as Address),
    enabled: !!_selectedIlk,
  });

  /* LOCAL STATE */
  const [collateralizationRatio, setCollateralizationRatio] = useState<string | undefined>();
  const [collateralizationPercent, setCollateralizationPercent] = useState<string | undefined>();
  const [undercollateralized, setUndercollateralized] = useState<boolean>(true);
  const [unhealthyCollatRatio, setUnhealthyCollatRatio] = useState<boolean>(false);

  const [oraclePrice, setOraclePrice] = useState<ethers.BigNumber>(ethers.constants.Zero);

  const [liquidationPrice_, setLiquidationPrice_] = useState<string | undefined>();

  const [minCollateral, setMinCollateral] = useState<BigNumber>();
  const [minCollateral_, setMinCollateral_] = useState<string | undefined>();

  const [minCollatRatio, setMinCollatRatio] = useState<number | undefined>();
  const [minCollatRatioPct, setMinCollatRatioPct] = useState<string | undefined>();
  const [minSafeCollatRatio, setMinSafeCollatRatio] = useState<number | undefined>();
  const [minSafeCollatRatioPct, setMinSafeCollatRatioPct] = useState<string | undefined>();
  const [minSafeCollateral, setMinSafeCollateral] = useState<string | undefined>();
  const [maxRemovableCollateral, setMaxRemovableCollateral] = useState<string | undefined>();
  const [maxCollateral, setMaxCollateral] = useState<string | undefined>();

  const [totalDebt, setTotalDebt] = useState<BigNumber>();
  const [totalDebt_, setTotalDebt_] = useState<string | undefined>();

  const [totalCollateral, setTotalCollateral] = useState<BigNumber>();
  const [totalCollateral_, setTotalCollateral_] = useState<string | undefined>();

  /* update the prices/limits if anything changes with the asset pair */
  useEffect(() => {
    if (assetPairInfo) {
      /* set the pertinent oracle price */
      setOraclePrice(decimalNToDecimal18(assetPairInfo.pairPrice, assetPairInfo.baseDecimals));

      /* set min collaterateralisation ratio */
      setMinCollatRatio(assetPairInfo.minRatio);
      setMinCollatRatioPct(Math.round(assetPairInfo.minRatio * 100).toString());

      /* set min safe coll ratio */
      const _minSafe = () => {
        if (assetPairInfo.minRatio >= 1.5) return assetPairInfo.minRatio + 1; // eg. 150% -> 250%
        if (assetPairInfo.minRatio < 1.5 && assetPairInfo.minRatio >= 1.4) return assetPairInfo.minRatio + 0.65; // eg. 140% -> 200%
        if (assetPairInfo.minRatio < 1.4 && assetPairInfo.minRatio > 1.01) return assetPairInfo.minRatio + 0.1; // eg. 133% -> 143%
        return assetPairInfo.minRatio; // eg. 110% -> 110%
      };

      setMinSafeCollatRatio(_minSafe());
      setMinSafeCollatRatioPct((_minSafe() * 100).toString());

      const liqPrice = vault
        ? cleanValue(
            calcLiquidationPrice(vault.ink_, vault.accruedArt_, assetPairInfo.minRatio),
            _selectedBase?.digitFormat
          )
        : cleanValue(
            calcLiquidationPrice(totalCollateral_!, totalDebt_!, assetPairInfo.minRatio),
            _selectedBase?.digitFormat
          );

      setLiquidationPrice_(liqPrice);
    }
  }, [_selectedBase?.digitFormat, assetPairInfo, totalCollateral_, totalDebt_, vault]);

  /* CHECK collateral selection and sets the max available collateral a user can add based on his balance */
  useEffect(() => {
    setMaxCollateral(userIlkBalance?.formatted);
  }, [userIlkBalance?.formatted]);

  /* handle changes to input values */
  useEffect(() => {
    /* NOTE: this whole function ONLY deals with decimal18, existing values are converted to decimal18 */
    const _existingCollateral = vault?.ink ? vault.ink : ethers.constants.Zero;
    const existingCollateralAsWei = decimalNToDecimal18(_existingCollateral, _selectedIlk?.decimals || 18);

    const newCollateralAsWei =
      collInput && Math.abs(parseFloat(collInput)) > 0 ? ethers.utils.parseUnits(collInput, 18) : ethers.constants.Zero;
    const _totalCollateral = existingCollateralAsWei.add(newCollateralAsWei);

    setTotalCollateral(_totalCollateral);
    setTotalCollateral_(ethers.utils.formatUnits(_totalCollateral, 18));

    const existingDebt_ = vault?.accruedArt ? vault.accruedArt : ethers.constants.Zero;
    const existingDebtAsWei = decimalNToDecimal18(existingDebt_, _selectedBase?.decimals || 18);
    let newDebt;
    if (isVR) {
      newDebt =
        debtInput && Math.abs(parseFloat(debtInput)) > 0
          ? ethers.utils.parseUnits(debtInput, _selectedBase?.decimals)
          : ZERO_BN;
    } else {
      newDebt =
        debtInput && Math.abs(parseFloat(debtInput)) > 0 && _selectedSeries
          ? buyBase(
              _selectedSeries.sharesReserves,
              _selectedSeries.fyTokenReserves,
              _selectedSeries.getShares(ethers.utils.parseUnits(debtInput, _selectedBase?.decimals)),
              getTimeTillMaturity(_selectedSeries.maturity),
              _selectedSeries.ts,
              _selectedSeries.g2,
              _selectedSeries.decimals,
              _selectedSeries.c,
              _selectedSeries.mu
            )
          : ZERO_BN;
    }
    const newDebtAsWei = decimalNToDecimal18(newDebt, _selectedBase?.decimals || 18);
    const _totalDebt = existingDebtAsWei.add(newDebtAsWei);

    setTotalDebt(_totalDebt);
    setTotalDebt_(ethers.utils.formatUnits(_totalDebt, 18));

    /* set the collateral ratio when collateral is entered */
    if (oraclePrice.gt(ethers.constants.Zero) && _totalCollateral.gt(ethers.constants.Zero)) {
      const ratio = calculateCollateralizationRatio(_totalCollateral, oraclePrice, _totalDebt, false);
      const percent = calculateCollateralizationRatio(_totalCollateral, oraclePrice, _totalDebt, true);
      setCollateralizationRatio(ratio?.toString() || '0');
      setCollateralizationPercent(parseFloat(percent?.toString()! || '0').toFixed(2));
    } else {
      setCollateralizationRatio('0.0');
      setCollateralizationPercent(cleanValue('0.0', 2));
    }

    /* check minimum collateral required base on debt */
    if (oraclePrice.gt(ethers.constants.Zero)) {
      const min = calculateMinCollateral(oraclePrice, _totalDebt, minCollatRatio!.toString(), existingCollateralAsWei);
      const minSafeCalc = calculateMinCollateral(
        oraclePrice,
        _totalDebt,
        (minSafeCollatRatio || 2.5).toString(),
        existingCollateralAsWei
      );

      /* 
        Check max collateral that is removable (based on exisiting debt)
         use a buffer of 1% if there is vault debt to prevent undercollateralized failed tx's
         else use the existing collateral 
         UPDATE: not required anymore
      */
      const _maxRemove = vault?.accruedArt?.gt(ethers.constants.Zero)
        ? existingCollateralAsWei.sub(min).mul(95).div(100)
        : existingCollateralAsWei;
      setMaxRemovableCollateral(
        ethers.utils
          .formatUnits(_maxRemove.gt(ethers.constants.Zero) ? _maxRemove : ethers.constants.Zero, 18)
          .toString()
      );

      // factor in the current collateral input if there is a valid chosen vault
      const minSafeWithCollat = BigNumber.from(minSafeCalc).sub(existingCollateralAsWei);

      // check for valid min safe scenarios
      const minSafe = minSafeWithCollat.gt(ethers.constants.Zero)
        ? ethers.utils.formatUnits(minSafeWithCollat, 18).toString()
        : undefined;
      setMinSafeCollateral(minSafe);

      setMinCollateral(min as BigNumber);
      setMinCollateral_(ethers.utils.formatUnits(min, 18).toString());
    } else {
      setMinCollateral(ZERO_BN);
      setMinCollateral_('0');
    }
  }, [
    collInput,
    debtInput,
    _selectedIlk,
    oraclePrice,
    vault,
    collateralizationRatio,
    _selectedBase,
    minCollatRatio,
    minSafeCollatRatio,
    _selectedSeries,
    getTimeTillMaturity,
  ]);

  /* Monitor for undercollaterization/ danger-collateralisation, and set flags if reqd. */
  useEffect(() => {
    parseFloat(collateralizationRatio!) >= minCollatRatio!
      ? setUndercollateralized(false)
      : setUndercollateralized(true);

    collateralizationRatio &&
    vault &&
    vault.accruedArt?.gt(ethers.constants.Zero) &&
    assetPairInfo?.minRatio! > 1.2 &&
    parseFloat(collateralizationRatio) > 0 &&
    parseFloat(collateralizationRatio) < assetPairInfo?.minRatio! + 0.2
      ? setUnhealthyCollatRatio(true)
      : setUnhealthyCollatRatio(false);
  }, [assetPairInfo?.minRatio, collateralizationRatio, minCollatRatio, vault]);

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

    totalDebt,
    totalDebt_,

    totalCollateral,
    totalCollateral_,

    liquidationPrice_,
  };
};
