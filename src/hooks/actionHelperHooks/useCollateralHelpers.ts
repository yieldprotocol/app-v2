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

  // const base = assetMap.get(selectedBaseId);
  const ilk = assetMap.get(selectedIlkId);

  /* LOCAL STATE */
  const [collateralizationRatio, setCollateralizationRatio] = useState<string | undefined>();
  const [collateralizationPercent, setCollateralizationPercent] = useState<string | undefined>();
  const [undercollateralized, setUndercollateralized] = useState<boolean>(true);
  const [oraclePrice, setOraclePrice] = useState<ethers.BigNumber>(ethers.constants.Zero);
  const [minCollateral, setMinCollateral] = useState<string | undefined>();
  const [minSafeCollateral, setMinSafeCollateral] = useState<string | undefined>();
  const [maxRemovableCollateral, setMaxRemovableCollateral] = useState<string| undefined>();
  const [maxCollateral, setMaxCollateral] = useState<string | undefined>();

  // todo:
  const [collateralizationWarning, setCollateralizationWarning] = useState<string | undefined>();
  const [borrowingPower, setBorrowingPower] = useState<string | undefined>();

  /* update the prices if anything changes */
  useEffect(() => {
    if (priceMap.get(selectedIlkId)?.has(selectedBaseId)) {
      setOraclePrice(priceMap.get(selectedIlkId).get(selectedBaseId));
    } else {
      (async () => {
        selectedBaseId && selectedIlkId && setOraclePrice(await updatePrice(selectedBaseId, selectedIlkId));
      })();
    }
  }, [priceMap, selectedBaseId, selectedIlkId, updatePrice]);


/* CHECK collateral selection and sets the max available collateral a user can add */
  useEffect(() => {
    activeAccount &&
      (async () => {
        const _max = await ilk?.getBalance(activeAccount);
        _max && setMaxCollateral(ethers.utils.formatUnits(_max, ilk.decimals)?.toString());
      })();
  }, [activeAccount, ilk, setMaxCollateral]);


/* */




 /* handle changes to input values */ 
  useEffect(() => {
    const existingCollateral_ = vault?.ink || ethers.constants.Zero;
    const existingCollateralAsWei = bnToDecimal18(existingCollateral_, ilk?.decimals)

    const existingDebt_ = vault?.art || ethers.constants.Zero;
    const existingDebtAsWei = bnToDecimal18(existingDebt_, ilk?.decimals)

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
      const minSafe = calculateMinCollateral(oraclePrice, totalDebt, '2.5', existingCollateralAsWei);

      setMinCollateral(ethers.utils.formatUnits(min, ilk.decimals)?.toString());
      setMinSafeCollateral(ethers.utils.formatUnits(minSafe, ilk.decimals)?.toString())
    } else {
      setMinCollateral('0');
    }

    /* Check max collateral that is removable (based on exisiting debt) */
    if (oraclePrice?.gt(ethers.constants.Zero)) {

      console.log(oraclePrice.toString(), totalDebt.toString(), '1.5', existingCollateralAsWei.toString() )
      const _min = calculateMinCollateral(oraclePrice, totalDebt, '1.5', existingCollateralAsWei);
      const _max = existingCollateralAsWei.sub(_min);

      console.log('MIN', _min.toString())
      
      console.log('MAX', ethers.utils.formatUnits(_max, ilk.decimals)?.toString())

      setMaxRemovableCollateral( ethers.utils.formatUnits(_max, ilk.decimals)?.toString() );

    } else {

      setMaxRemovableCollateral('0');
    }
  }, [collInput, debtInput, ilk?.decimals, oraclePrice, vault, collateralizationRatio]);


  /* Monitor for undercollaterization */
  useEffect(()=>{
    parseFloat(collateralizationRatio!) >= 1.5 ?  setUndercollateralized(false):  setUndercollateralized(true)
  }, [collateralizationRatio])



  // TODO marco add in collateralisation warning at about 150% - 200% " warning: vulnerable to liquidation"

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
