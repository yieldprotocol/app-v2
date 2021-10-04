import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, SignType, ISeries, ActionCodes, IUserContext, LadleActions } from '../../types';
import { getTxCode, cleanValue } from '../../utils/appUtils';
import { DAI_BASED_ASSETS, ETH_BASED_ASSETS } from '../../utils/constants';
import { useChain } from '../useChain';

import { calculateCollateralizationRatio, calculateMinCollateral, decimalNToDecimal18 } from '../../utils/yieldMath';

/* Collateralization hook calculates collateralization metrics */
export const useCollateralHelpers = (
  debtInput: string | undefined,
  collInput: string | undefined,
  vault: IVault | undefined
) => {
  /* STATE FROM CONTEXT */
  const {
    userState: { activeAccount, selectedBaseId, selectedIlkId, assetMap, priceMap },
    userActions: { updatePrice },
  } = useContext(UserContext);

  const base = assetMap.get(selectedBaseId);
  const ilk = assetMap.get(selectedIlkId);

  /* LOCAL STATE */
  const [collateralizationRatio, setCollateralizationRatio] = useState<string | undefined>();
  const [collateralizationPercent, setCollateralizationPercent] = useState<string | undefined>();
  const [undercollateralized, setUndercollateralized] = useState<boolean>(true);
  const [oraclePrice, setOraclePrice] = useState<ethers.BigNumber>(ethers.constants.Zero);
  const [minCollateral, setMinCollateral] = useState<string | undefined>();
  const [minSafeCollateral, setMinSafeCollateral] = useState<string | undefined>();
  const [maxRemovableCollateral, setMaxRemovableCollateral] = useState<string | undefined>();
  const [maxCollateral, setMaxCollateral] = useState<string | undefined>();

  // todo:
  const [collateralizationWarning, setCollateralizationWarning] = useState<string | undefined>();
  const [borrowingPower, setBorrowingPower] = useState<string | undefined>();

  /* update the prices if anything changes */
  useEffect(() => {
    if (priceMap.get(selectedIlkId)?.has(selectedBaseId)) {
      const _price = priceMap.get(selectedIlkId).get(selectedBaseId); // get the price
      setOraclePrice(decimalNToDecimal18(_price, base?.decimals)); // make sure the price is 18decimals based
    } else {
      (async () => {
        selectedBaseId &&
          selectedIlkId &&
          setOraclePrice(await updatePrice(selectedIlkId, selectedBaseId, ilk.decimals));
      })();
    }
  }, [priceMap, selectedBaseId, selectedIlkId, updatePrice, ilk, base?.decimals]);

  /* CHECK collateral selection and sets the max available collateral a user can add */
  useEffect(() => {
    activeAccount &&
      (async () => {
        const _max = await ilk?.getBalance(activeAccount);
        _max && setMaxCollateral(ethers.utils.formatUnits(_max, ilk.decimals)?.toString());
      })();
  }, [activeAccount, ilk, setMaxCollateral]);

  /* handle changes to input values */
  useEffect(() => {
    /* NOTE: this whole function ONLY deals with decimal18, existing values are converted to decimal18 */
    const existingCollateral_ = vault?.ink ? vault.ink : ethers.constants.Zero;
    const existingCollateralAsWei = decimalNToDecimal18(existingCollateral_, ilk?.decimals);

    const existingDebt_ = vault?.art ? vault.art : ethers.constants.Zero;
    const existingDebtAsWei = decimalNToDecimal18(existingDebt_, base?.decimals);

    const dInput = debtInput ? ethers.utils.parseUnits(debtInput, 18) : ethers.constants.Zero;
    const cInput = collInput ? ethers.utils.parseUnits(collInput, 18) : ethers.constants.Zero;

    const totalCollateral = existingCollateralAsWei.add(cInput);
    const totalDebt = existingDebtAsWei.add(dInput);

    /* set the collateral ratio when collateral is entered */
    if (oraclePrice?.gt(ethers.constants.Zero) && totalCollateral.gt(ethers.constants.Zero)) {
      const ratio = calculateCollateralizationRatio(totalCollateral, oraclePrice, totalDebt, false);
      const percent = calculateCollateralizationRatio(totalCollateral, oraclePrice, totalDebt, true);
      setCollateralizationRatio(ratio);
      setCollateralizationPercent(cleanValue(percent, 2));
    } else {
      setCollateralizationRatio('0.0');
      setCollateralizationPercent(cleanValue('0.0', 2));
    }

    /* check minimum collateral required base on debt */
    if (oraclePrice?.gt(ethers.constants.Zero)) {
      const min = calculateMinCollateral(oraclePrice, totalDebt, '1.5', existingCollateralAsWei);
      const minSafeCalc = calculateMinCollateral(oraclePrice, totalDebt, '2.5', existingCollateralAsWei);

      // factor in the current collateral input if there is a valid chosen vault
      const minSafeWithCollat = BigNumber.from(minSafeCalc).sub(existingCollateral_);

      // check for valid min safe scenarios
      const minSafe = minSafeWithCollat.gt(ethers.constants.Zero)
        ? ethers.utils.formatUnits(minSafeWithCollat, 18).toString()
        : undefined;

      setMinCollateral(ethers.utils.formatUnits(min, 18).toString());
      setMinSafeCollateral(minSafe);
    } else {
      setMinCollateral('0');
    }

    /* Check max collateral that is removable (based on exisiting debt) */
    if (oraclePrice?.gt(ethers.constants.Zero)) {
      const _min = calculateMinCollateral(oraclePrice, totalDebt, '1.5', existingCollateralAsWei);
      const _max = existingCollateralAsWei.sub(_min);
      setMaxRemovableCollateral(ethers.utils.formatUnits(_max, 18).toString());
    } else {
      setMaxRemovableCollateral('0');
    }
  }, [collInput, debtInput, ilk, oraclePrice, vault, collateralizationRatio, base]);

  /* Monitor for undercollaterization */
  useEffect(() => {
    parseFloat(collateralizationRatio!) >= 1.5 ? setUndercollateralized(false) : setUndercollateralized(true);
  }, [collateralizationRatio]);

  // TODO Marco add in collateralization warning at about 150% - 200% " warning: vulnerable to liquidation"

  return {
    collateralizationRatio,
    collateralizationPercent,
    borrowingPower,
    collateralizationWarning,
    undercollateralized,
    minCollateral,
    minSafeCollateral,
    maxCollateral,
    maxRemovableCollateral,
  };
};
