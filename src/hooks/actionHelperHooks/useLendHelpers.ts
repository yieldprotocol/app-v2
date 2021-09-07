import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import {ISeries } from '../../types';
import { secondsToFrom, sellFYToken } from '../../utils/yieldMath';

export const useLendHelpers = (series: ISeries, input?:string|undefined) => {
  const { userState } = useContext(UserContext);
  const { assetMap, activeAccount, selectedBaseId } = userState;
  const selectedBase = assetMap.get(selectedBaseId!);

  const [maxLend, setMaxLend] = useState<string>();
  const [fyTokenMarketValue, setFyTokenMarketValue] = useState<string>();

  /* Sets maxLend as the account BALANCE of the base token */
  useEffect(() => {
    /* Check max available lend (only if activeAccount to save call) */
    if (activeAccount) {
      (async () => {
        const max = await selectedBase?.getBalance(activeAccount);
        if (max) setMaxLend(ethers.utils.formatUnits(max, selectedBase?.decimals).toString());
      })();
    }
  }, [activeAccount, assetMap, selectedBase, series]);

  /* Sets currentValue as the market Value of fyTokens held in base tokens */
  useEffect(() => {
    if (series) {
      const value = sellFYToken(
        series.baseReserves,
        series.fyTokenReserves,
        series.fyTokenBalance || ethers.constants.Zero,
        secondsToFrom(series.maturity.toString()),
        series.decimals
      );
      value.lte(ethers.constants.Zero) 
        ? setFyTokenMarketValue('0') 
        : setFyTokenMarketValue(ethers.utils.formatUnits(value, selectedBase?.decimals))
    }
  }, [selectedBase?.decimals, series]);

  return { maxLend, fyTokenMarketValue,  };
};
