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

  // /* check and set the protocol Base max limits */
  // useEffect(() => {
  //   if (series) {
  //     const _maxBaseIn = maxBaseIn(
  //       series.baseReserves,
  //       series.fyTokenReserves,
  //       series.getTimeTillMaturity(),
  //       series.ts,
  //       series.g1,
  //       series.decimals
  //     );
  //     diagnostics && console.log('MAX BASE IN : ', _maxBaseIn.toString());
  //     _maxBaseIn && setProtocolBaseIn(_maxBaseIn);
  //   }
  // }, [series, diagnostics]);

  /* Check and set Max available lend by user (only if activeAccount).   */
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
      const _maxBaseIn = maxBaseIn(
        series.baseReserves,
        series.fyTokenReserves,
        series.getTimeTillMaturity(),
        series.ts,
        series.g1,
        series.decimals
      );
      diagnostics && console.log('MAX BASE IN : ', _maxBaseIn.toString());

      if (userBaseBalance.lt(_maxBaseIn)) {
        setMaxLend(userBaseBalance);
        setMaxLend_(ethers.utils.formatUnits(userBaseBalance, series.decimals).toString());
        setProtocolLimited(false);
      } else {
        setMaxLend(_maxBaseIn);
        setMaxLend_(ethers.utils.formatUnits(_maxBaseIn, series.decimals).toString());
        setProtocolLimited(true);
      }
    }
  }, [userBaseBalance, series, selectedBase, diagnostics]);

  /* Sets max close and current market Value of fyTokens held in base tokens */
  useEffect(() => {
    if (series && !series.seriesIsMature) {
      const value = sellFYToken(
        series.baseReserves,
        series.fyTokenReserves,
        series.fyTokenBalance || ethers.constants.Zero,
        series.getTimeTillMaturity(),
        series.ts,
        series.g2,
        series.decimals
      );

      value.lte(ethers.constants.Zero)
        ? setFyTokenMarketValue('Low liquidity')
        : setFyTokenMarketValue(ethers.utils.formatUnits(value, series.decimals));

      /* set max Closing */
      const baseReservesWithMargin = series.baseReserves.mul(9999).div(10000); // TODO figure out why we can't use the base reserves exactly (margin added to facilitate transaction)
      if (value.lte(ethers.constants.Zero) && series.fyTokenBalance?.gt(series.baseReserves)) {
        setMaxClose(baseReservesWithMargin);
        setMaxClose_(ethers.utils.formatUnits(baseReservesWithMargin, series.decimals).toString());
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
      const { baseReserves, fyTokenReserves } = series;
      const val = sellBase(
        baseReserves,
        fyTokenReserves,
        baseAmount,
        series.getTimeTillMaturity(),
        series.ts,
        series.g1,
        series.decimals
      );
      setValueAtMaturity(val);
      setValueAtMaturity_(ethers.utils.formatUnits(val, series.decimals).toString());
    }
  }, [input, series]);

  /* Maximum Roll possible from series to rollToSeries */
  useEffect(() => {
    if (series && rollToSeries) {
      const _maxBaseIn = maxBaseIn(
        rollToSeries.baseReserves,
        rollToSeries.fyTokenReserves,
        rollToSeries.getTimeTillMaturity(),
        rollToSeries.ts,
        rollToSeries.g1,
        rollToSeries.decimals
      );

      const _fyTokenValue = series.seriesIsMature
        ? series.fyTokenBalance || ZERO_BN
        : sellFYToken(
            series.baseReserves,
            series.fyTokenReserves,
            series.fyTokenBalance || ethers.constants.Zero,
            series.getTimeTillMaturity(),
            series.ts,
            series.g2,
            series.decimals
          );

      if (_maxBaseIn.lte(_fyTokenValue)) {
        setMaxRoll(_maxBaseIn);
        setMaxRoll_(ethers.utils.formatUnits(_maxBaseIn, series.decimals).toString());
      } else {
        setMaxRoll(_fyTokenValue);
        setMaxRoll_(ethers.utils.formatUnits(_fyTokenValue, series.decimals).toString());
      }

      diagnostics && console.log('MAXBASE_IN', _maxBaseIn.toString());
      diagnostics && console.log('FYTOKEN_VALUE', _fyTokenValue.toString());
      diagnostics && console.log('MAXBASE_IN  <= FYTOKEN_VALUE', _maxBaseIn.lte(_fyTokenValue));
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
