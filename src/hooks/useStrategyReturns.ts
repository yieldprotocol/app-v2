import Decimal from 'decimal.js';
import { BigNumber } from 'ethers';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ISeries, IStrategy } from '../types';
import { cleanValue } from '../utils/appUtils';
import {
  ONE_DEC as ONE,
  SECONDS_PER_YEAR,
  sellFYToken,
  ZERO_DEC as ZERO,
  invariant,
  calcInterestRate,
  // secondsInOneYear,
  ZERO_BN,
} from '@yield-protocol/ui-math';
import { formatEther, parseUnits } from 'ethers/lib/utils';
import { UserContext } from '../contexts/UserContext';
import useTimeTillMaturity from './useTimeTillMaturity';

export interface IReturns {
  sharesBlendedAPY?: string;
  sharesAPY?: string;
  fyTokenAPY?: string;
  feesAPY?: string;
  rewardsAPY?: string;
  blendedAPY?: string; // "blended" because sharesAPY is weighted against pool ratio of shares to fyToken
}

export interface IStrategyReturns {
  calcStrategyReturns: (strategy: IStrategy, input: string) => IReturns;
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
    userState: { selectedStrategy },
  } = useContext(UserContext);

  const strategy_ = strategy || selectedStrategy;
  const series = strategy_?.currentSeries;

  const inputToUse = cleanValue(!input || +input === 0 ? '1' : input, series?.decimals!);

  const { getTimeTillMaturity } = useTimeTillMaturity();

  const [initSeries, setInitSeries] = useState<{
    sharesReserves: BigNumber;
    fyTokenReserves: BigNumber;
    totalSupply: BigNumber;
    ts: BigNumber;
    g2: BigNumber;
    c: BigNumber;
  }>();

  const [returns, setLpReturns] = useState<IReturns>();
  const NOW = useMemo(() => Math.round(new Date().getTime() / 1000), []);

  /**
   *
   * @returns {number} fyToken price in base, where 1 is at par with base
   */
  const getFyTokenPrice = useCallback(
    (series: ISeries, input: string): number => {
      if (series) {
        const input_ = parseUnits(cleanValue(input, series.decimals), series.decimals);
        const sharesOut = sellFYToken(
          series.sharesReserves,
          series.fyTokenReserves,
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
    },
    [getTimeTillMaturity]
  );

  /**
   * Calculate the total base value of the pool
   * total = shares value in base + fyToken value in base
   *
   * @returns {number} total base value of pool
   */
  const getPoolBaseValue = useCallback(
    (series: ISeries, input: string): number => {
      if (!series) return 0;

      const fyTokenPrice = getFyTokenPrice(series, input);
      const sharesBaseVal = +series.getBase(series.sharesReserves);
      const fyTokenBaseVal = +series.fyTokenRealReserves * fyTokenPrice;
      return sharesBaseVal + fyTokenBaseVal;
    },
    [getFyTokenPrice]
  );

  /**
   * Calculates estimated blended apy from shares portion of pool
   * @returns {number} shares apy of pool
   */
  const getSharesAPY = useCallback(
    (series: ISeries, input: string): number => {
      const poolBaseValue = getPoolBaseValue(series, input);

      if (series.poolSharesAPY) {
        const sharesBaseVal = +series.getBase(series.sharesReserves);
        const sharesValRatio = sharesBaseVal / poolBaseValue;
        return +series.poolSharesAPY * sharesValRatio;
      }
      return 0;
    },
    [getPoolBaseValue]
  );

  /**
   * Calculate (estimate) how much interest would be captured by LP position using market rates and fyToken proportion of the pool
   * @returns {number} estimated fyToken interest from LP position
   */
  const getFyTokenAPY = useCallback(
    (series: ISeries, input: string): number => {
      if (!series) return 0;
      const marketInterestRate = calcInterestRate(
        series.sharesReserves,
        series.fyTokenReserves,
        BigNumber.from(series.ts),
        series.mu
      ).mul(100); // interest rate is formatted in decimal (.1) so multiply by 100 to get percent
      const fyTokenPrice = getFyTokenPrice(series, input);
      const poolBaseValue = getPoolBaseValue(series, input);
      const fyTokenValRatio = (+series.fyTokenRealReserves * fyTokenPrice) / poolBaseValue;
      return +marketInterestRate * fyTokenValRatio;
    },
    [getFyTokenPrice, getPoolBaseValue]
  );

  /**
   * Calculate (estimate) how much rewards token is accrued by strategy position
   * @returns {number} estimated rewards apy from strategy
   */
  const getRewardsAPY = useCallback(
    (strategy: IStrategy, input: string): number => {
      /// console.log( strategy.rewardsRate.toString() ) ;

      if (!strategy.rewardsPeriod || strategy.rewardsRate?.lte(ZERO_BN)) return 0;

      const { start, end } = strategy.rewardsPeriod;

      // assess if outside of rewards period
      if (NOW < start || NOW > end) return 0;

      const timeRemaining = end - NOW;
      // console.log(timeRemaining.toString(), 'seconds remaining');

      const weiRemaining = BigNumber.from(timeRemaining).mul(strategy.rewardsRate!);
      const ethRemaining = formatEther(weiRemaining);
      // console.log(ethRemaining, 'eth remaining to be distributed');

      const currentTotalSupply = strategy.strategyTotalSupply;
      const currentTotalEthSupply = formatEther(currentTotalSupply!);
      // console.log(currentTotalEthSupply, 'current total ETH strategy supply');

      const inputAsPropOfPool = +input / (+currentTotalEthSupply + +input);
      // console.log('input ETH:', input);
      // console.log('input as proportion of pool:', inputAsPropOfPool);

      const rewardsEarned = Math.min(+ethRemaining * inputAsPropOfPool, +ethRemaining);
      // console.log('if adding input: ', +input, 'your returns will be  ', rewardsEarned);

      const newEst = +calculateAPR(input.toString(), (+input + rewardsEarned).toString(), end, start)!;
      // console.log('New APY estimate: ', newEst);

      return isNaN(newEst) ? 0 : newEst;
    },
    [NOW]
  );

  const calcStrategyReturns = useCallback(
    (strategy: IStrategy | null, input: string) => {
      if (!strategy) return;
      const series = strategy.currentSeries;
      if (!series) return;
      const sharesAPY = getSharesAPY(series, input);
      const fyTokenAPY = getFyTokenAPY(series, input);
      const rewardsAPY = getRewardsAPY(strategy, input);

      return {
        feesAPY: cleanValue(series.feeAPY.toString(), digits),
        sharesAPY: cleanValue(series.poolSharesAPY, digits),
        sharesBlendedAPY: cleanValue(sharesAPY.toString(), digits),
        fyTokenAPY: cleanValue(fyTokenAPY.toString(), digits),
        rewardsAPY: cleanValue(rewardsAPY.toString(), digits),
        blendedAPY: cleanValue((sharesAPY + series.feeAPY + fyTokenAPY + rewardsAPY).toString(), digits),
      };
    },
    [digits, getFyTokenAPY, getRewardsAPY, getSharesAPY]
  );

  useEffect(() => {
    setLpReturns(calcStrategyReturns(selectedStrategy!, inputToUse));
  }, [calcStrategyReturns, inputToUse, selectedStrategy]);

  return {
    returns,
    calcStrategyReturns,
  } as IStrategyReturns;
};

export default useStrategyReturns;
