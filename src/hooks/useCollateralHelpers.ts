import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, IVault, SignType, ISeries, ActionCodes, IUserContext, LadleActions } from '../types';
import { getTxCode, cleanValue } from '../utils/appUtils';
import { DAI_BASED_ASSETS, ETH_BASED_ASSETS } from '../utils/constants';
import { useChain } from './chainHooks';

import { calculateCollateralizationRatio, calculateMinCollateral } from '../utils/yieldMath';

/* Collateralisation hook calculates collateralisation metrics */
export const useCollateralHelpers = (
  debtInput: string | undefined,
  collInput: string | undefined,
  vault: IVault | undefined
) => {
  /* STATE FROM CONTEXT */
  const {
    userState: { selectedBaseId, selectedIlkId, priceMap },
    userActions: { updatePrice },
  } = useContext(UserContext);

  /* LOCAL STATE */
  const [collateralizationRatio, setCollateralizationRatio] = useState<string | undefined>();
  const [collateralizationPercent, setCollateralizationPercent] = useState<string | undefined>();

  const [undercollateralized, setUndercollateralized] = useState<boolean>(true);
  const [oraclePrice, setOraclePrice] = useState<ethers.BigNumber>(ethers.constants.Zero);

  // todo:
  const [collateralizationWarning, setCollateralizationWarning] = useState<string | undefined>();
  const [borrowingPower, setBorrowingPower] = useState<string | undefined>();
  const [minCollateral, setMinCollateral] = useState<string | undefined>();
  const [maxRemove, setMaxRemove] = useState<ethers.BigNumber>(ethers.constants.Zero);

  /* update the prices if anything changes */
  useEffect(() => {
    if (priceMap.get(selectedBaseId)?.has(selectedIlkId) ) {
      setOraclePrice(priceMap.get(selectedBaseId).get(selectedIlkId))
    } else {
      (async () => {
        selectedBaseId && selectedIlkId && setOraclePrice( await updatePrice(selectedBaseId, selectedIlkId) )
      })();
    }
  }, [priceMap, selectedBaseId, selectedIlkId, updatePrice]);

  useEffect(() => {
    const existingCollateral = vault?.ink || ethers.constants.Zero;
    const existingDebt = vault?.art || ethers.constants.Zero;

    const dInput = debtInput ? ethers.utils.parseEther(debtInput) : ethers.constants.Zero;
    const cInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;

    const totalCollateral = existingCollateral.add(cInput);
    const totalDebt = existingDebt.add(dInput);

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
      const min = calculateMinCollateral(oraclePrice, totalDebt, '1.5', existingCollateral)
      setMinCollateral(min.toString());
    } else {
      setMinCollateral('0');
    }

    /* check minimum collateral required base on debt */
    if (oraclePrice?.gt(ethers.constants.Zero)) {
      const min_ = calculateMinCollateral(oraclePrice, totalDebt, '1.5', existingCollateral, true)
      // const max_ = ethers.utils.parseEther(max!)
      setMaxRemove( existingCollateral.sub(min_) );
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
    maxRemove,
  };
};
