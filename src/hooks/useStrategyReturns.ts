import Decimal from 'decimal.js';
import { BigNumber } from 'ethers';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ISeries, ISeriesDynamic, IStrategy } from '../types';
import { cleanValue } from '../utils/appUtils';
import {
  ONE_DEC as ONE,
  SECONDS_PER_YEAR,
  sellFYToken,
  ZERO_DEC as ZERO,
  invariant,
  calcInterestRate,
} from '@yield-protocol/ui-math';
import { parseUnits } from 'ethers/lib/utils';
import { UserContext } from '../contexts/UserContext';
import useTimeTillMaturity from './useTimeTillMaturity';
import useSeriesEntity from './useSeriesEntity';

interface IReturns {
  sharesBlendedAPY?: string;
  sharesAPY?: string;
  fyTokenAPY?: string;
  feesAPY?: string;
  blendedAPY?: string; // "blended" because sharesAPY is weighted against pool ratio of shares to fyToken
}

interface IStrategyReturns {
  calcStrategyReturns: (strategySeriesEntity: ISeriesDynamic | undefined, input: string) => IReturns;
  returns: IReturns;
}

// calculateAPR func from yieldMath, but without the maturity greater than now check
const calculateAPR = (
  tradeValue: BigNumber | string,
  amount: BigNumber | string,
  maturity: number,
  fromDate: number = Math.round(new Date().getTime() / 1000) // if not provided, defaults to current time.
): string | undefined => {
  const tradeValue_ = new Decimal(tradeValue.toString());
  const amount_ = new Decimal(amount.toString());

  const secsToMaturity = maturity - fromDate;
  const propOfYear = new Decimal(secsToMaturity / SECONDS_PER_YEAR);
  const priceRatio = amount_.div(tradeValue_);
  const powRatio = ONE.div(propOfYear);
  const apr = priceRatio.pow(powRatio).sub(ONE);

  if (apr.gt(ZERO) && apr.lt(100)) {
    return apr.mul(100).toFixed();
  }
  return undefined;
};

/**
 *
 * Returns are LP returns per share
 * Returns are estimated using "forward-looking" and "backward-looking" methodologies:
 *
 * Forward-looking:
 *
 * a = pool share's estimated current apy
 * b = number of shares in pool
 * c = current share price in base
 * d = lp token total supply
 * e = fyToken interest rate
 * f = estimated value of fyTokens in pool in base
 * g = total estimated base value of pool b * c + f
 *
 * estimated apy =  blended shares apy + fyToken apy + fees apy
 * estimated apy = a * ((b * c) / g)   +   f / g     + fees apy
 *
 *
 * Backward-looking:
 *
 * value = each strategy token's value in base
 * a = strategy LP token balance
 * b = strategy total supply
 * c = shares value in base of pool
 * d = estimated fyToken value of pool
 * e = total LP token (pool) supply
 *
 * value =  a / b * (c + d) / e
 * estimated apy = value plugged into apy calculation func
 *
 *
 * @param input amount of base to use when providing liquidity
 * @returns {IStrategyReturns} use "returns" property for visualization (the higher apy of the two "returnsForward" and "returnsBackward" properties)
 */
const useStrategyReturns = (
  input: string | undefined,
  strategy: IStrategy | undefined = undefined,
  digits = 1
): IStrategyReturns => {
  const {
    userState: { selectedStrategy: _selectedStrategy },
  } = useContext(UserContext);

  const selectedStrategy = strategy || _selectedStrategy;
  const { data: selectedStrategySeries } = useSeriesEntity(selectedStrategy?.currentSeriesId!);

  const inputToUse = cleanValue(!input || +input === 0 ? '1' : input, selectedStrategySeries?.decimals!);

  const { getTimeTillMaturity } = useTimeTillMaturity();

  const [initSeries, setInitSeries] = useState<{
    sharesReserves: BigNumber;
    fyTokenReserves: BigNumber;
    totalSupply: BigNumber;
    ts: BigNumber;
    g2: BigNumber;
    c: BigNumber;
  }>();

  const NOW = useMemo(() => Math.round(new Date().getTime() / 1000), []);

  /**
   *
   * @returns {number} fyToken price in base, where 1 is at par with base
   */
  const getFyTokenPrice = (series: ISeriesDynamic, input: string): number => {
    if (series) {
      const cleaned = cleanValue(input, series.decimals);
      const input_ = parseUnits(cleaned, series.decimals);

      const sharesOut = sellFYToken(
        series.sharesReserves.value,
        series.fyTokenReserves.value,
        input_,
        getTimeTillMaturity(series.maturity),
        series.ts,
        series.g2,
        series.decimals,
        series.c,
        series.mu
      );
      const baseValOfInput = series.getBase(sharesOut);
      return +baseValOfInput / +input_;
    }
    return 1;
  };

  /**
   * Calculate the total base value of the pool
   * total = shares value in base + fyToken value in base
   *
   * @returns {number} total base value of pool
   */
  const getPoolBaseValue = (series: ISeriesDynamic, input: string): number => {
    if (!series) return 0;

    const fyTokenPrice = getFyTokenPrice(series, input);
    const sharesBaseVal = +series.getBase(series.sharesReserves.value);
    const fyTokenBaseVal = +series.fyTokenRealReserves.value * fyTokenPrice;
    return sharesBaseVal + fyTokenBaseVal;
  };

  /**
   * Calculates estimated blended apy from shares portion of pool
   * @returns {number} shares apy of pool
   */
  const getSharesAPY = (series: ISeriesDynamic, input: string): number => {
    const poolBaseValue = getPoolBaseValue(series, input);

    if (series.poolAPY) {
      const sharesBaseVal = +series.getBase(series.sharesReserves.value);
      const sharesValRatio = sharesBaseVal / poolBaseValue;
      return +series.poolAPY * sharesValRatio;
    }
    return 0;
  };

  /**
   * Caculate (estimate) how much fees are accrued to LP's using invariant func
   * Use the current and init invariant results from global context and fallback to manual calculation if unavailable
   * @returns {number}
   */
  const getFeesAPY = (series: ISeriesDynamic, initSeries: ISeriesDynamic | undefined): number => {
    let currentInvariant = series.currentInvariant;
    let initInvariant = series.initInvariant;

    if ((!series.currentInvariant || !series.initInvariant) && series.startBlock) {
      if (!initSeries) return 0;

      currentInvariant = invariant(
        series.sharesReserves.value,
        series.fyTokenReserves.value,
        series.totalSupply.value,
        getTimeTillMaturity(series.maturity),
        series.ts,
        series.g2,
        series.decimals,
        series.c,
        series.mu
      );

      initInvariant = invariant(
        initSeries.sharesReserves.value,
        initSeries.fyTokenReserves.value,
        initSeries.totalSupply.value,
        (series.maturity - series.startBlock.timestamp).toString(),
        initSeries.ts,
        initSeries.g2,
        series.decimals,
        initSeries.c,
        series.mu
      );
    }

    // get apy estimate
    if (initInvariant && currentInvariant && series.startBlock) {
      const res = calculateAPR(initInvariant, currentInvariant, NOW, series.startBlock.timestamp);
      return !isNaN(+res!) ? +res! : 0;
    }

    return 0;
  };

  /**
   * Calculate (estimate) how much interest would be captured by LP position using market rates and fyToken proportion of the pool
   * @returns {number} estimated fyToken interest from LP position
   */
  const getFyTokenAPY = (series: ISeriesDynamic, input: string): number => {
    if (!series) return 0;

    const marketInterestRate = calcInterestRate(
      series.sharesReserves.value,
      series.fyTokenReserves.value,
      series.ts,
      series.mu
    ).mul(100); // interest rate is formatted in decimal (.1) so multiply by 100 to get percent
    const fyTokenPrice = getFyTokenPrice(series, input);
    const poolBaseValue = getPoolBaseValue(series, input);
    const fyTokenValRatio = (+series.fyTokenRealReserves * fyTokenPrice) / poolBaseValue;
    return +marketInterestRate * fyTokenValRatio;
  };

  // get the init series data to use the invariant function
  useEffect(() => {
    (async () => {
      if (!selectedStrategySeries) return;

      const { poolContract, currentInvariant, initInvariant } = selectedStrategySeries;

      if (!currentInvariant || !initInvariant) {
        const [sharesReserves, fyTokenReserves, totalSupply, ts, g2, c] = await Promise.all([
          poolContract.getSharesBalance(),
          poolContract.getFYTokenBalance(),
          poolContract.totalSupply(),
          poolContract.ts(),
          poolContract.g2(),
          poolContract.getC(),
        ]);

        setInitSeries({ sharesReserves, fyTokenReserves, totalSupply, ts, g2, c });
      }
    })();
  }, [selectedStrategySeries]);

  const calcStrategyReturns = (strategySeriesEntity: ISeriesDynamic | undefined, input: string) => {
    if (!strategySeriesEntity) return;

    const sharesAPY = getSharesAPY(strategySeriesEntity, input);
    const feesAPY = getFeesAPY(strategySeriesEntity, undefined);
    const fyTokenAPY = getFyTokenAPY(strategySeriesEntity, input);

    return {
      feesAPY: cleanValue(feesAPY.toString(), digits),
      sharesAPY: cleanValue(strategySeriesEntity.poolAPY, digits),
      sharesBlendedAPY: cleanValue(sharesAPY.toString(), digits),
      fyTokenAPY: cleanValue(fyTokenAPY.toString(), digits),
      blendedAPY: cleanValue((sharesAPY + feesAPY + fyTokenAPY).toString(), digits),
    };
  };

  const returns = calcStrategyReturns(selectedStrategySeries, inputToUse);

  return {
    returns,
    calcStrategyReturns,
  } as IStrategyReturns;
};

export default useStrategyReturns;
