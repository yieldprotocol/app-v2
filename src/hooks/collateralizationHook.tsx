import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries, IUserContext, IVault } from '../types';
import { cleanValue } from '../utils/displayUtils';
import { calculateCollateralizationRatio, calculateBorrowingPower } from '../utils/yieldMath';

/* APR hook calculates APR, min and max aprs for selected series and BORROW or LEND type */
export const useCollateralization = (debtInput:string|undefined, collInput:string|undefined, vault: IVault|undefined) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { seriesMap, selectedSeriesId, selectedBaseId } = userState;

  /* LOCAL STATE */
  const [collateralizationRatio, setCollateralizationRatio] = useState<string|undefined>();
  const [collateralizationPercent, setCollateralizationPercent] = useState<string|undefined>();
  const [collateralizationWarning, setCollateralizationWarning] = useState<string|undefined>();
  const [undercollateralized, setUndercollateralized] = useState<boolean>(true);

  const [borrowingPower, setBorrowingPower] = useState<string|undefined>();

  useEffect(() => {
    const dInput = debtInput ? ethers.utils.parseEther(debtInput) : ethers.constants.Zero;
    const cInput = collInput ? ethers.utils.parseEther(collInput) : ethers.constants.Zero;
    const preCollateral = vault?.art || ethers.constants.Zero;
    const preDebt = vault?.art || ethers.constants.Zero;
    const totalCollateral = preCollateral.add(cInput);
    const totalDebt = preDebt.add(dInput);
    const price = ethers.constants.One;
    const ratio = calculateCollateralizationRatio(totalCollateral, price, totalDebt, false);
    const percent = calculateCollateralizationRatio(totalCollateral, price, totalDebt, true);
    // console.log(collateralIn?.toString(), debt?.toString(), price?.toString(), totalCollateral?.toString());
    setCollateralizationRatio(ratio);
    setCollateralizationPercent(cleanValue(percent, 2));

    if (collateralizationPercent && parseFloat(collateralizationPercent) <= 150) {
      setUndercollateralized(true);
    } else { setUndercollateralized(false); }
  }, [collInput, collateralizationPercent, debtInput, vault]);

  return {
    collateralizationRatio,
    collateralizationPercent,
    borrowingPower,
    collateralizationWarning,
    undercollateralized,
  };
};
