import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { ISeries, IUserContextState } from '../../types';
import { maxBaseIn, maxBaseOut, sellFYToken } from '../../utils/yieldMath';

export const useLendHelpers = (
  series: ISeries | null,
  input: string | undefined,
  rollToSeries: ISeries | undefined = undefined
) => {

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const { userState } : { userState: IUserContextState } = useContext(UserContext);
  const { assetMap, activeAccount, selectedBase } = userState;

  /* clean to prevent underflow */
  const [maxLend, setMaxLend] = useState<BigNumber>(ethers.constants.Zero);
  const [maxLend_, setMaxLend_] = useState<string>();

  const [maxClose, setMaxClose] = useState<BigNumber>(ethers.constants.Zero);
  const [maxClose_, setMaxClose_] = useState<string>();

  const [userBaseAvailable, setUserBaseAvailable] = useState<BigNumber>(ethers.constants.Zero);

  const [protocolBaseOut, setProtocolBaseOut] = useState<BigNumber>(ethers.constants.Zero);
  const [protocolBaseIn, setProtocolBaseIn] = useState<BigNumber>(ethers.constants.Zero);

  const [fyTokenMarketValue, setFyTokenMarketValue] = useState<string>();

  /* check and set the protocol Base max limits */
  useEffect(() => {
    if (series) {
      const timeTillMaturity = series.getTimeTillMaturity();

      const _maxBaseOut = maxBaseOut(series.baseReserves, series.fyTokenReserves, timeTillMaturity, series.decimals);
      _maxBaseOut && setProtocolBaseOut(_maxBaseOut);

      const _maxBaseIn = maxBaseIn(series.baseReserves, series.fyTokenReserves, timeTillMaturity, series.decimals);

      diagnostics && console.log('BASE IN : ', _maxBaseIn.toString());
      _maxBaseIn && setProtocolBaseIn(_maxBaseIn);
    }
  }, [series, diagnostics]);

  /* Check and set Max available lend by user (only if activeAccount).   */
  useEffect(() => {
    if (activeAccount) {
      (async () => {
        // user base available when rolling is the user's from series lend position balance
        const userMax = await selectedBase?.getBalance(activeAccount);
        userMax && setUserBaseAvailable(userMax);
      })();
    }
  }, [activeAccount, selectedBase, series]);

  /* set maxLend based on either max user or max protocol */
  useEffect(() => {
    if (!series && selectedBase) {
      setMaxLend(userBaseAvailable);
      setMaxLend_(ethers.utils.formatUnits(userBaseAvailable, selectedBase.decimals).toString());
    }
    if (series) {
      /* user balance or max Lend (max base to spend) */
      userBaseAvailable.lt(protocolBaseIn) ? setMaxLend(userBaseAvailable) : setMaxLend(protocolBaseIn);
      userBaseAvailable.lt(protocolBaseIn)
        ? setMaxLend_(ethers.utils.formatUnits(userBaseAvailable, series.decimals).toString())
        : setMaxLend_(ethers.utils.formatUnits(protocolBaseIn, series.decimals).toString());
    }
  }, [userBaseAvailable, protocolBaseOut, series, selectedBase, protocolBaseIn]);

  /* Sets max close and current market Value of fyTokens held in base tokens */
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
        ? setFyTokenMarketValue('Low liquidity')
        : setFyTokenMarketValue(ethers.utils.formatUnits(value, series.decimals));

      /* set max Closing */
      const baseReservesWithMargin = series.baseReserves.mul(9999).div(10000); // TODO figure out why we can't use the base reserves exactly (margin added to facilitate transaction)
      value.lte(ethers.constants.Zero) && series.fyTokenBalance?.gt(series.baseReserves)
        ? setMaxClose(baseReservesWithMargin)
        : setMaxClose(value);

      /* set max Closing human readable */
      value.lte(ethers.constants.Zero) && series.fyTokenBalance?.gt(series.baseReserves)
        ? setMaxClose_(ethers.utils.formatUnits(baseReservesWithMargin, series.decimals).toString())
        : setMaxClose_(ethers.utils.formatUnits(value, series.decimals).toString());

      /* explicitly set max close to 0 when applicable */
      // maxClose.lte(ethers.constants.Zero) && setMaxClose(ethers.constants.Zero);
      // maxClose.lte(ethers.constants.Zero) && setMaxClose_('0');
    }

    if (series && series.seriesIsMature) {
      const val = ethers.utils.formatUnits(series.fyTokenBalance!, series.decimals);
      setFyTokenMarketValue(val);
      setMaxClose_(val);
      setMaxClose(series.fyTokenBalance!);
    }
  }, [series]);

  return {
    maxLend,
    maxLend_,

    maxClose,
    maxClose_,

    fyTokenMarketValue,

    protocolBaseOut,
    protocolBaseIn,
    userBaseAvailable,
  };
};
