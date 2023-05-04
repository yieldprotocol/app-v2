import { BigNumber, ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { maxBaseIn, maxBaseOut, maxFyTokenIn, sellBase, sellFYToken } from '@yield-protocol/ui-math';

import { SettingsContext } from '../../../contexts/SettingsContext';
import { UserContext } from '../../../contexts/UserContext';
import { ActionType, ISeries } from '../../../types';
import { ZERO_BN } from '../../../utils/constants';
import { useApr } from '../../useApr';
import useTimeTillMaturity from '../../useTimeTillMaturity';
import { Address, useBalance } from 'wagmi';
import { cleanValue } from '../../../utils/appUtils';
import { WETH } from '../../../config/assets';
import useAccountPlus from '../../useAccountPlus';

export const useLendHelpersFR = (
  series: ISeries | null,
  input: string | undefined,
  rollToSeries: ISeries | undefined = undefined
) => {
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const { getTimeTillMaturity } = useTimeTillMaturity();
  const { address: activeAccount } = useAccountPlus();

  const { userState } = useContext(UserContext);
  const { selectedBase } = userState;

  /* clean to prevent underflow */
  const [maxLend, setMaxLend] = useState<BigNumber>(ethers.constants.Zero);
  const [maxLend_, setMaxLend_] = useState<string>();

  /* Position state */
  const [maxClose, setMaxClose] = useState<BigNumber>(ethers.constants.Zero);
  const [maxClose_, setMaxClose_] = useState<string>();

  const [valueAtMaturity, setValueAtMaturity] = useState<BigNumber>(ethers.constants.Zero);
  const [valueAtMaturity_, setValueAtMaturity_] = useState<string>();

  const [protocolLimited, setProtocolLimited] = useState<boolean>(false);

  const [fyTokenMarketValue, setFyTokenMarketValue] = useState<string>();

  /* Roll state */
  const [maxRoll, setMaxRoll] = useState<BigNumber>(ethers.constants.Zero);
  const [maxRoll_, setMaxRoll_] = useState<string>();

  // estimated fyTokens received after rolling to a new series
  const [rollEstimate_, setRollEstimate_] = useState<string>();

  const { apr: apy } = useApr(input, ActionType.LEND, series?.id);
  const { address: account } = useAccountPlus();
  const { data } = useBalance({
    address: account,
    token: selectedBase?.proxyId === WETH ? undefined : (selectedBase?.address as Address),
    enabled: !!activeAccount && !!selectedBase,
  });
  const userBaseBalance = data?.value || ethers.constants.Zero;
  const userBaseBalance_ = data?.formatted;

  /* set maxLend based on either max user or max protocol */
  useEffect(() => {
    if (!series && selectedBase) {
      setMaxLend(userBaseBalance);
      setMaxLend_(userBaseBalance_);
    }

    if (series) {
      /* checks the protocol limits (max shares {converted to base} allowed in) */
      const _maxSharesIn = maxBaseIn(
        series.sharesReserves,
        series.fyTokenReserves,
        getTimeTillMaturity(series.maturity),
        series.ts,
        series.g1,
        series.decimals,
        series.c,
        series.mu
      );
      diagnostics && console.log('MAX SHARES IN : ', _maxSharesIn.toString());

      // make sure max shares in is greater than 0 and convert to base
      const _maxBaseIn = _maxSharesIn.lte(ethers.constants.Zero) ? ethers.constants.Zero : series.getBase(_maxSharesIn);
      diagnostics && console.log('MAX BASE IN : ', _maxBaseIn.toString());

      if (userBaseBalance.lt(_maxBaseIn)) {
        setMaxLend(userBaseBalance);
        setMaxLend_(ethers.utils.formatUnits(userBaseBalance, series.decimals).toString());
        setProtocolLimited(false);
      } else {
        setMaxLend(_maxBaseIn);
        setMaxLend_(ethers.utils.formatUnits(_maxBaseIn, series.decimals).toString());
        parseInt(input!) > 0 && setProtocolLimited(true);
      }
    }
  }, [userBaseBalance, series, selectedBase, diagnostics, getTimeTillMaturity, userBaseBalance_, input]);

  /* Sets max close and current market value of fyTokens held in base tokens */
  useEffect(() => {
    if (series && !series.seriesIsMature) {
      const sharesValue = sellFYToken(
        series.sharesReserves,
        series.fyTokenReserves,
        series.balance || ethers.constants.Zero,
        getTimeTillMaturity(series.maturity),
        series.ts,
        series.g2,
        series.decimals,
        series.c,
        series.mu
      );

      // calculate base value of current fyToken balance
      const baseValue = series.getBase(sharesValue);

      const _maxFyTokenIn = maxFyTokenIn(
        series.sharesReserves,
        series.fyTokenReserves,
        getTimeTillMaturity(series.maturity),
        series.ts,
        series.g2,
        series.decimals,
        series.c,
        series.mu
      );

      const _maxBaseOut = series.getBase(maxBaseOut(series.sharesReserves));

      sharesValue.lte(ethers.constants.Zero)
        ? setFyTokenMarketValue('Low liquidity')
        : setFyTokenMarketValue(ethers.utils.formatUnits(baseValue, series.decimals));

      /* set max Closing */
      if (baseValue.lte(ethers.constants.Zero) && series.balance?.gt(_maxFyTokenIn)) {
        setMaxClose(_maxBaseOut);
        setMaxClose_(ethers.utils.formatUnits(_maxBaseOut, series.decimals));
      } else if (baseValue.lte(ethers.constants.Zero)) {
        setMaxClose(ethers.constants.Zero);
        setMaxClose_('0');
      } else {
        setMaxClose(baseValue);
        setMaxClose_(ethers.utils.formatUnits(baseValue, series.decimals));
      }
    }

    if (series && series.seriesIsMature) {
      const val = ethers.utils.formatUnits(series.balance!, series.decimals);
      setFyTokenMarketValue(val);
      setMaxClose_(val);
      setMaxClose(series.balance!);
    }
  }, [getTimeTillMaturity, series]);

  /* Sets values at maturity on input change */
  useEffect(() => {
    if (series && !series.seriesIsMature && input) {
      const cleanInput = cleanValue(input, series.decimals);
      const baseAmount = ethers.utils.parseUnits(cleanInput, series.decimals);
      const { sharesReserves, fyTokenReserves } = series;
      const val = sellBase(
        sharesReserves,
        fyTokenReserves,
        series.getShares(baseAmount), // convert base amount input to shares amount
        getTimeTillMaturity(series.maturity),
        series.ts,
        series.g1,
        series.decimals,
        series.c,
        series.mu
      );
      setValueAtMaturity(val);
      setValueAtMaturity_(ethers.utils.formatUnits(val, series.decimals).toString());
    }
  }, [getTimeTillMaturity, input, series]);

  /* Maximum Roll possible from series to rollToSeries */
  useEffect(() => {
    if (series && rollToSeries) {
      const _maxSharesIn = maxBaseIn(
        rollToSeries.sharesReserves,
        rollToSeries.fyTokenReserves,
        getTimeTillMaturity(rollToSeries.maturity),
        rollToSeries.ts,
        rollToSeries.g1,
        rollToSeries.decimals,
        rollToSeries.c,
        rollToSeries.mu
      );

      // convert to base
      const _maxBaseIn = rollToSeries.getBase(_maxSharesIn);

      const _sharesValue = series.seriesIsMature
        ? series.balance || ZERO_BN
        : sellFYToken(
            series.sharesReserves,
            series.fyTokenReserves,
            series.balance || ethers.constants.Zero,
            getTimeTillMaturity(series.maturity),
            series.ts,
            series.g2,
            series.decimals,
            series.c,
            series.mu
          );

      // calculate base value of current fyToken balance
      const baseValue = series.getBase(_sharesValue);

      if (_maxSharesIn.lte(ethers.constants.Zero)) {
        setMaxRoll(ethers.constants.Zero);
        setMaxRoll_('0.00');
      } else if (_maxSharesIn.lte(_sharesValue)) {
        setMaxRoll(_maxBaseIn);
        setMaxRoll_(ethers.utils.formatUnits(_maxBaseIn, series.decimals).toString());
      } else {
        setMaxRoll(baseValue);
        setMaxRoll_(ethers.utils.formatUnits(baseValue, series.decimals).toString());
      }

      diagnostics && console.log('MAXSHARES_IN', _maxSharesIn.toString());
      diagnostics && console.log('FYTOKEN_TO_BASE_VALUE', baseValue.toString());
      diagnostics && console.log('MAXSHARES_IN <= SHARES_VALUE', _maxSharesIn.lte(_sharesValue));

      // estimate roll output
      if (input) {
        const baseAmount = ethers.utils.parseUnits(input, series.decimals);

        // estimate how much fyToken you can get given input (base), using the to series
        const _fyTokenValueOfInputOut = sellBase(
          rollToSeries.sharesReserves,
          rollToSeries.fyTokenReserves,
          rollToSeries.getShares(baseAmount),
          getTimeTillMaturity(rollToSeries.maturity),
          rollToSeries.ts,
          rollToSeries.g1,
          rollToSeries.decimals,
          rollToSeries.c,
          rollToSeries.mu
        );

        setRollEstimate_(ethers.utils.formatUnits(_fyTokenValueOfInputOut, rollToSeries.decimals).toString());
      }
    }
  }, [diagnostics, rollToSeries, series, getTimeTillMaturity, input]);

  return {
    maxLend,
    maxLend_,

    maxClose,
    maxClose_,

    maxRoll,
    maxRoll_,
    rollEstimate_,

    apy,
    valueAtMaturity,
    valueAtMaturity_,

    fyTokenMarketValue,
    userBaseBalance,

    protocolLimited, // userBaseBalance.gt(protocolBaseIn)
  };
};
