import { BigNumber, BigNumberish, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { ISeries } from '../../types';
import { secondsToFrom, sellFYToken } from '../../utils/yieldMath';

export const useLendHelpers = (series: ISeries, input?: string | undefined) => {
  const { userState } = useContext(UserContext);
  const { assetMap, activeAccount, selectedBaseId } = userState;
  const selectedBase = assetMap.get(selectedBaseId!);

  const [maxLend, setMaxLend] = useState<string>();
  const [maxClose, setMaxClose] = useState<string>();

  const [userBaseAvailable, setUserBaseAvailable] = useState<BigNumber>(ethers.constants.Zero);
  const [protocolBaseAvailable, setProtocolBaseAvailable] = useState<BigNumber>(ethers.constants.Zero);

  const [fyTokenMarketValue, setFyTokenMarketValue] = useState<string>();

  /* check the protocol max limits */
  useEffect(() => {
    if (series) {
      console.log(series.fyTokenReserves.toString(), series.baseReserves.toString());    
      const _maxProtocol = series.fyTokenReserves.sub(series.baseReserves).div(2);
      _maxProtocol && setProtocolBaseAvailable(_maxProtocol);
    }
  }, [series]);

  /* Check max available lend (only if activeAccount).   */
  useEffect(() => {
    if (activeAccount) {
      (async () => {
        const userMax = await selectedBase?.getBalance(activeAccount);
        userMax && setUserBaseAvailable(userMax);
      })();
    }
  }, [activeAccount, selectedBase, series]);

  useEffect(() => {
    if (!series && selectedBase) {
      setMaxLend(ethers.utils.formatUnits(userBaseAvailable, selectedBase.decimals).toString());
    }
    if (series) {
      /* if user balance > protocol max */
      
      setMaxClose( ethers.utils.formatUnits(series.baseReserves, series.decimals).toString())

      /* user balance or max Lend */
      userBaseAvailable.lt(series.baseReserves)
        ? setMaxLend(ethers.utils.formatUnits(userBaseAvailable, series.decimals).toString())
        : setMaxLend(ethers.utils.formatUnits(series.baseReserves, series.decimals).toString());
    }
  }, [userBaseAvailable, protocolBaseAvailable, series, selectedBase]);

  useEffect(() => {

    if (series) {
     
      setMaxClose( ethers.utils.formatUnits(series.baseReserves, series.decimals).toString())
    }
  }, [fyTokenMarketValue]);


  /* Sets currentValue as the market Value of fyTokens held in base tokens */
  useEffect(() => {
    if (series && !series.seriesIsMature) {
      const value = sellFYToken(
        series.baseReserves,
        series.fyTokenReserves,
        series.fyTokenBalance || ethers.constants.Zero,
        series.getTimeTillMaturity(),
        series.decimals
      );

      value.lte(ethers.constants.Zero)
        ? setFyTokenMarketValue('0')
        : setFyTokenMarketValue(ethers.utils.formatUnits(value, series.decimals));
      
      /* set max Closing */ 
      value.lte(ethers.constants.Zero) 
        ? setMaxClose( ethers.utils.formatUnits(series.baseReserves, series.decimals).toString() )
        : setMaxClose( ethers.utils.formatUnits(value, series.decimals).toString() )
    }
    if (series && series.seriesIsMature)
      setFyTokenMarketValue(ethers.utils.formatUnits(series.fyTokenBalance!, series.decimals));

  }, [maxLend, series]);

  return { maxLend, fyTokenMarketValue, protocolBaseAvailable, userBaseAvailable, maxClose };
};
