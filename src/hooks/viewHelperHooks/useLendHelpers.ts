import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { ActionType, ISeries, IUserContextState } from '../../types';
import { ZERO_BN } from '../../utils/constants';
import { maxBaseIn, sellBase, sellFYToken } from '../../utils/yieldMath';
import { useApr } from '../useApr';

export const useLendHelpers = (
  series: ISeries | null,
  input: string | undefined,
  rollToSeries: ISeries | undefined = undefined
) => {
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const { userState }: { userState: IUserContextState } = useContext(UserContext);
  const { activeAccount, selectedBase } = userState;

  /* clean to prevent underflow */
  const [maxLend, setMaxLend] = useState<BigNumber>(ethers.constants.Zero);
  const [maxLend_, setMaxLend_] = useState<string>();

  const [maxClose, setMaxClose] = useState<BigNumber>(ethers.constants.Zero);
  const [maxClose_, setMaxClose_] = useState<string>();

  const [maxRoll, setMaxRoll] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRoll_, setMaxRoll_] = useState<string>();

  const [valueAtMaturity, setValueAtMaturity] = useState<BigNumber>(ethers.constants.Zero);
  const [valueAtMaturity_, setValueAtMaturity_] = useState<string>();

  const [userBaseBalance, setUserBaseBalance] = useState<BigNumber>(ethers.constants.Zero);

  const [protocolLimited, setProtocolLimited] = useState<boolean>(false);

  const [fyTokenMarketValue, setFyTokenMarketValue] = useState<string>();

  const { apr: apy } = useApr(input, ActionType.LEND, series);

  useEffect(() => {
    if (activeAccount) {
      (async () => {
        // user base available when rolling is the user's from series lend position balance
        const usersMaxBase = await selectedBase?.getBalance(activeAccount);
        usersMaxBase && setUserBaseBalance(usersMaxBase);
      })();
    }
  }, [activeAccount, selectedBase, series]);

  /* set maxLend based on either max user or max protocol */
  useEffect(() => {
    if (!series && selectedBase) {
      setMaxLend(userBaseBalance);
      setMaxLend_(ethers.utils.formatUnits(userBaseBalance, selectedBase.decimals).toString());
    }

    if (series) {
      /* checks the protocol limits  (max Base allowed in ) */
      const _maxSharesIn = maxBaseIn(
        series.sharesReserves,
        series.fyTokenReserves,
        series.getTimeTillMaturity(),
        series.ts,
        series.g1,
        series.decimals,
        series.c,
        series.mu
      );
      diagnostics && console.log('MAX BASE IN : ', _maxSharesIn.toString());

      if (userBaseBalance.lt(_maxSharesIn)) {
        setMaxLend(userBaseBalance);
        setMaxLend_(ethers.utils.formatUnits(userBaseBalance, series.decimals).toString());
        setProtocolLimited(false);
      } else {
        setMaxLend(_maxSharesIn);
        setMaxLend_(ethers.utils.formatUnits(_maxSharesIn, series.decimals).toString());
        setProtocolLimited(true);
      }
    }
  }, [userBaseBalance, series, selectedBase, diagnostics]);

  /* Sets max close and current market Value of fyTokens held in base tokens */
  useEffect(() => {
    if (series && !series.seriesIsMature) {
      const value = sellFYToken(
        series.sharesReserves,
        series.fyTokenReserves,
        series.fyTokenBalance || ethers.constants.Zero,
        series.getTimeTillMaturity(),
        series.ts,
        series.g2,
        series.decimals,
        series.c,
        series.mu
      );

      value.lte(ethers.constants.Zero)
        ? setFyTokenMarketValue('Low liquidity')
        : setFyTokenMarketValue(ethers.utils.formatUnits(value, series.decimals));

      /* set max Closing */
      const sharesReservesWithMargin = series.sharesReserves.mul(9999).div(10000); // TODO figure out why we can't use the base reserves exactly (margin added to facilitate transaction)
      if (value.lte(ethers.constants.Zero) && series.fyTokenBalance?.gt(series.sharesReserves)) {
        setMaxClose(sharesReservesWithMargin);
        setMaxClose_(ethers.utils.formatUnits(sharesReservesWithMargin, series.decimals).toString());
      } else if (value.lte(ethers.constants.Zero)) {
        setMaxClose(ethers.constants.Zero);
        setMaxClose_('0');
      } else {
        setMaxClose(value);
        setMaxClose_(ethers.utils.formatUnits(value, series.decimals).toString());
      }
    }

    if (series && series.seriesIsMature) {
      const val = ethers.utils.formatUnits(series.fyTokenBalance!, series.decimals);
      setFyTokenMarketValue(val);
      setMaxClose_(val);
      setMaxClose(series.fyTokenBalance!);
    }
  }, [series]);

  /* Sets values at maturity on input change */
  useEffect(() => {
    if (series && !series.seriesIsMature && input) {
      const baseAmount = ethers.utils.parseUnits(input, series.decimals);
      const { sharesReserves, fyTokenReserves } = series;
      const val = sellBase(
        sharesReserves,
        fyTokenReserves,
        baseAmount,
        series.getTimeTillMaturity(),
        series.ts,
        series.g1,
        series.decimals,
        series.c,
        series.mu
      );
      setValueAtMaturity(val);
      setValueAtMaturity_(ethers.utils.formatUnits(val, series.decimals).toString());
    }
  }, [input, series]);

  /* Maximum Roll possible from series to rollToSeries */
  useEffect(() => {
    if (series && rollToSeries) {
      const _maxSharesIn = maxBaseIn(
        rollToSeries.sharesReserves,
        rollToSeries.fyTokenReserves,
        rollToSeries.getTimeTillMaturity(),
        rollToSeries.ts,
        rollToSeries.g1,
        rollToSeries.decimals,
        rollToSeries.c,
        rollToSeries.mu
      );

      const _fyTokenValue = series.seriesIsMature
        ? series.fyTokenBalance || ZERO_BN
        : sellFYToken(
            series.sharesReserves,
            series.fyTokenReserves,
            series.fyTokenBalance || ethers.constants.Zero,
            series.getTimeTillMaturity(),
            series.ts,
            series.g2,
            series.decimals,
            series.c,
            series.mu
          );

      if (_maxSharesIn.lte(_fyTokenValue)) {
        setMaxRoll(_maxSharesIn);
        setMaxRoll_(ethers.utils.formatUnits(_maxSharesIn, series.decimals).toString());
      } else {
        setMaxRoll(_fyTokenValue);
        setMaxRoll_(ethers.utils.formatUnits(_fyTokenValue, series.decimals).toString());
      }

      diagnostics && console.log('MAXSHARES_IN', _maxSharesIn.toString());
      diagnostics && console.log('FYTOKEN_VALUE', _fyTokenValue.toString());
      diagnostics && console.log('MAXSHARES_IN <= FYTOKEN_VALUE', _maxSharesIn.lte(_fyTokenValue));
    }
  }, [diagnostics, rollToSeries, series]);

  return {
    maxLend,
    maxLend_,

    maxClose,
    maxClose_,

    maxRoll,
    maxRoll_,

    apy,
    valueAtMaturity,
    valueAtMaturity_,

    fyTokenMarketValue,
    userBaseBalance,

    protocolLimited, // userBaseBalance.gt(protocolBaseIn)
  };
};
