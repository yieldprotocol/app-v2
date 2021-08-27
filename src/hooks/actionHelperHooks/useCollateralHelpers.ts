import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, SignType, ISeries, ActionCodes, IUserContext, LadleActions } from '../../types';
import { getTxCode, cleanValue, bnToDecimal18 } from '../../utils/appUtils';
import { DAI_BASED_ASSETS, ETH_BASED_ASSETS } from '../../utils/constants';
import { useChain } from '../useChain';

import { calculateCollateralizationRatio, calculateMinCollateral } from '../../utils/yieldMath';

/* Collateralisation hook calculates collateralisation metrics */
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

  const selectedIlk = assetMap.get(selectedIlkId!);

  // const base = assetMap.get(selectedBaseId);
  const ilk = assetMap.get(selectedIlkId);


  /* LOCAL STATE */
  const [collateralizationRatio, setCollateralizationRatio] = useState<string | undefined>();
  const [collateralizationPercent, setCollateralizationPercent] = useState<string | undefined>();
  const [undercollateralized, setUndercollateralized] = useState<boolean>(true);
  const [oraclePrice, setOraclePrice] = useState<ethers.BigNumber>(ethers.constants.Zero);
  const [minCollateral, setMinCollateral] = useState<string | undefined>();
  const [maxRemove, setMaxRemove] = useState<ethers.BigNumber>(ethers.constants.Zero);

  const [minCollateral, setMinCollateral] = useState<string | undefined>();
  const [maxCollateral, setMaxCollateral] = useState<string | undefined>();
  const [maxRemove, setMaxRemove] = useState<ethers.BigNumber>(ethers.constants.Zero);

  // todo:
  const [collateralizationWarning, setCollateralizationWarning] = useState<string | undefined>();
  const [borrowingPower, setBorrowingPower] = useState<string | undefined>();

  /* update the prices if anything changes */
  useEffect(() => {
    if (priceMap.get(selectedIlkId)?.has(selectedBaseId)) {
      setOraclePrice(priceMap.get(selectedIlkId).get(selectedBaseId));
    } else {
      (async () => {
        selectedBaseId && selectedIlkId && setOraclePrice(await updatePrice(selectedIlkId, selectedBaseId));
      })();
    }
  }, [priceMap, selectedBaseId, selectedIlkId, updatePrice]);


/* CHECK collateral selection and sets the max available collateral */
  useEffect(() => {
    activeAccount &&
      (async () => {
        const _max = await selectedIlk?.getBalance(activeAccount);
        _max && setMaxCollateral(ethers.utils.formatUnits(_max, selectedIlk.decimals)?.toString());
      })();
  }, [activeAccount, selectedIlk, setMaxCollateral]);

 /* handle changes to input values */ 
  useEffect(() => {
    const existingCollateral_ = vault?.ink || ethers.constants.Zero;
    const existingCollateralAsWei = bnToDecimal18(existingCollateral_, ilk?.decimals)

    const existingDebt_ = vault?.art || ethers.constants.Zero;
    const existingDebtAsWei = bnToDecimal18(existingDebt_, ilk?.decimals)

    const dInput = debtInput ? ethers.utils.parseUnits(debtInput) : ethers.constants.Zero;
    const cInput = collInput ? ethers.utils.parseUnits(collInput) : ethers.constants.Zero;

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

    /* check for undercollateralisation */
    if (collateralizationPercent && parseFloat(collateralizationPercent) <= 150) {
      setUndercollateralized(true);
    } else {
      setUndercollateralized(false);
    }

    /* check minimum collateral required base on debt */
    if (oraclePrice?.gt(ethers.constants.Zero)) {
      const min = calculateMinCollateral(oraclePrice, totalDebt, '1.5', existingCollateralAsWei);
      setMinCollateral(min.toString());
    } else {
      setMinCollateral('0');
    }

    /* check minimum collateral required base on debt */
    if (oraclePrice?.gt(ethers.constants.Zero)) {
      const min_ = calculateMinCollateral(oraclePrice, totalDebt, '1.5', existingCollateralAsWei, true);
      setMaxRemove(existingCollateralAsWei.sub(min_));
    } else {
      setMaxRemove(ethers.constants.Zero);
    }
  }, [collInput, collateralizationPercent, debtInput, oraclePrice, vault]);

  // TODO marco add in collateralisation warning at about 150% - 200% " warning: vulnerable to liquidation"

  return {
    collateralizationRatio,
    collateralizationPercent,
    borrowingPower,
    collateralizationWarning,
    undercollateralized,
    minCollateral,
    maxCollateral,
    maxRemove,
  };
};
