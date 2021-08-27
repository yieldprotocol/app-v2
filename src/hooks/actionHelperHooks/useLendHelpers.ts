import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import {ISeries } from '../../types';
import { secondsToFrom, sellFYToken } from '../../utils/yieldMath';

export const useLendHelpers = (series: ISeries, input?:string|undefined) => {
  const { userState } = useContext(UserContext);
  const { assetMap, activeAccount, selectedBaseId } = userState;
  const selectedBase = assetMap.get(selectedBaseId!);

  const [maxLend, setMaxLend] = useState<string>();
  const [currentValue, setCurrentValue] = useState<string>();

  /* set maxLend as the balance of the base token */
  useEffect(() => {
    /* Check max available lend (only if activeAccount to save call) */
    if (activeAccount) {
      (async () => {
        const max = await selectedBase?.getBalance(activeAccount);
        if (max) setMaxLend(ethers.utils.formatEther(max).toString());
      })();
    }

  }, [activeAccount, assetMap, selectedBase, series]);

  /* set currentValue as the market Value of fyTokens held in base tokens */
  useEffect(() => {

    if (series) {
      const value = sellFYToken(
        series.baseReserves,
        series.fyTokenReserves,
        series.fyTokenBalance || ethers.constants.Zero,
        secondsToFrom(series.maturity.toString())
      );
      setCurrentValue(ethers.utils.formatEther(value))
    }
  }, [series]);

  return { maxLend, currentValue };
};
