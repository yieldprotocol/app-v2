import Decimal from 'decimal.js';
import { BigNumber } from 'ethers';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { ActionType, ISettingsContext, IUserContext } from '../types';
import { cleanValue } from '../utils/appUtils';
import { useApr } from './useApr';
import { ONE_DEC as ONE, SECONDS_PER_YEAR, sellFYToken, ZERO_DEC as ZERO } from '@yield-protocol/ui-math';
import { parseUnits } from 'ethers/lib/utils';
import { UserContext } from '../contexts/UserContext';
import { useDebounce } from './generalHooks';
import useTimeTillMaturity from './useTimeTillMaturity';

interface IReturns {
  sharesBlendedAPY?: string;
  sharesAPY?: string;
  fyTokenAPY?: string;
  feesAPY?: string;
  blendedAPY?: string; // "blended" because sharesAPY is weighted against pool ratio of shares to fyToken
}

interface IStrategyReturns {
  returnsForward: IReturns;
  returnsBackward: IReturns;
  returns: IReturns;
  loading: boolean;
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
const useStrategyReturns = (input: string | undefined, digits = 1): IStrategyReturns => {
  const {
    userState: { selectedStrategy },
  } = useContext(UserContext) as IUserContext;

  const strategy = selectedStrategy;
  const series = selectedStrategy?.currentSeries!;

  const inputToUse = useDebounce(cleanValue(input || '1', series?.decimals!), 1000);
  const [loading, setLoading] = useState(false);

  const [returnsForward, setReturnsForward] = useState<IReturns>();
  const [returnsBackward, setReturnsBackward] = useState<IReturns>();

  const { apr: borrowApy } = useApr(inputToUse, ActionType.BORROW, series);
  const { apr: lendApy } = useApr(inputToUse, ActionType.LEND, series);
  const { getTimeTillMaturity } = useTimeTillMaturity();

  const NOW = useMemo(() => Math.round(new Date().getTime() / 1000), []);

  /**
   *
   * @returns {number} fyToken price in base, where 1 is at par with base
   */
  const getFyTokenPrice = useCallback(
    (valuedAtOne = false) => {
      console.log('getting fytoken price');
      if (valuedAtOne) return 1;

      if (series) {
        const input = parseUnits(inputToUse, series.decimals);

        const sharesOut = sellFYToken(
          series.sharesReserves,
          series.fyTokenReserves,
          input,
          getTimeTillMaturity(series.maturity),
          series.ts,
          series.g2,
          series.decimals,
          series.c,
          series.mu
        );

        const baseValOfInput = series.getBase(sharesOut);

        return +baseValOfInput / +input;
      }

      return 1;
    },
    [getTimeTillMaturity, inputToUse, series]
  );

  /**
   * Calculate the total base value of the pool
   * total = shares value in base + fyToken value in base
   *
   * @returns {Promise<number>} total base value of pool
   */
  const getPoolBaseValue = useCallback(
    (fyTokenValAtOne = false) => {
      if (!series) return;

      const sharesBaseVal = +series.getBase(series.sharesReserves);
      const fyTokenPrice = getFyTokenPrice(fyTokenValAtOne);
      const fyTokenBaseVal = +series.fyTokenRealReserves * fyTokenPrice;

      return sharesBaseVal + fyTokenBaseVal;
    },
    [getFyTokenPrice, series]
  );

  /**
   * Calculates estimated blended apy from shares portion of pool
   * @returns {number} shares apy of pool
   */
  const getSharesAPY = useCallback(() => {
    if (!series) return 0;

    const poolBaseValue = getPoolBaseValue();

    if (series.poolAPY && poolBaseValue) {
      const sharesBaseVal = +series.getBase(series.sharesReserves);
      const sharesValRatio = sharesBaseVal / poolBaseValue;

      return +series.poolAPY * sharesValRatio;
    }

    return 0;
  }, [getPoolBaseValue, series]);

  /**
   * Caculate (estimate) how much fees are accrued to LP's using invariant func
   * @returns {number}
   */
  const getFeesAPY = useCallback(() => {
    if (!series) return 0;
    if (!series.initInvariant || !series.currentInvariant) return 0;

    // get apy estimate
    const res = calculateAPR(series.initInvariant, series.currentInvariant, NOW, series.startBlock.timestamp);

    if (isNaN(+res!)) {
      return 0;
    }

    return +res!;
  }, [NOW, series]);

  /**
   * Calculate (estimate) how much interest would be captured by LP position using market rates and fyToken proportion of the pool
   * @returns {number} estimated fyToken interest from LP position
   */
  const getFyTokenAPY = useCallback(() => {
    if (!series) return 0;

    const poolBaseValue = getPoolBaseValue();
    if (!poolBaseValue) return 0;

    const fyTokenRealReserves = +series.fyTokenRealReserves;

    // the average of the borrow and lend apr's
    const marketInterestRate = (+borrowApy! + +lendApy!) / 2;

    const fyTokenPrice = getFyTokenPrice();

    // how much fyToken in base the pool is comprised of
    const fyTokenValRatio = (fyTokenRealReserves * fyTokenPrice) / poolBaseValue;

    return marketInterestRate * fyTokenValRatio;
  }, [borrowApy, getFyTokenPrice, getPoolBaseValue, lendApy, series]);

  /* Set blended shares apy */
  useEffect(() => {
    (async () => {
      console.log('getting shares apy');
      const sharesBlendedAPY = getSharesAPY();

      setReturnsForward((returns) => ({
        ...returns,
        sharesAPY: cleanValue(series?.poolAPY?.toString(), digits),
        sharesBlendedAPY: cleanValue(sharesBlendedAPY.toString(), digits),
      }));
    })();
  }, [digits, getSharesAPY, series?.poolAPY]);

  /* Set fees apy */
  useEffect(() => {
    (() => {
      console.log('getting fees apy');
      const feesAPY = getFeesAPY();

      setReturnsForward((returns) => ({
        ...returns,
        feesAPY: cleanValue(feesAPY.toString(), digits),
      }));
    })();
  }, [digits, getFeesAPY]);

  /* Set fyToken apy */
  useEffect(() => {
    (() => {
      console.log('getting fyToken apy');
      const fyTokenAPY = getFyTokenAPY();

      setReturnsForward((returns) => ({
        ...returns,
        fyTokenAPY: cleanValue(fyTokenAPY.toString(), digits),
      }));
    })();
  }, [digits, getFyTokenAPY]);

  /* Set Returns Forward blended apy state */
  useEffect(() => {
    (async () => {
      setLoading(true);

      setReturnsForward((returns) => ({
        ...returns,
        blendedAPY: cleanValue(
          (+returnsForward?.sharesBlendedAPY! + +returnsForward?.feesAPY! + +returnsForward?.fyTokenAPY!).toString(),
          digits
        ),
      }));

      setLoading(false);
    })();
  }, [digits, returnsForward?.feesAPY, returnsForward?.fyTokenAPY, returnsForward?.sharesBlendedAPY]);

  /* Set Returns Backward state */
  useEffect(() => {
    const _calcTotalAPYBackward = async () => {
      if (!series || !strategy) return;

      const strategyLpBalance = +strategy?.strategyPoolBalance!;
      const strategyTotalSupply = +strategy?.strategyTotalSupply!;
      const poolTotalSupply = +series.totalSupply;
      const poolBaseValue = getPoolBaseValue(true);
      if (!poolBaseValue) return;

      const strategyLpBalSupplyRatio = strategyLpBalance / strategyTotalSupply;

      const value = strategyLpBalSupplyRatio * (poolBaseValue / poolTotalSupply);
      const apy = calculateAPR('1', value.toString(), NOW, strategy.startBlock?.timestamp);

      setReturnsBackward({
        blendedAPY: cleanValue(apy, digits),
      });
    };

    _calcTotalAPYBackward();
  }, [NOW, getPoolBaseValue, series, strategy, digits]);

  useEffect(() => {
    console.log('🦄 ~ file: useStrategyReturns.ts ~ line 336 ~ useStrategyReturns ~ returnsForward', returnsForward);
  }, [returnsForward]);

  return {
    returnsForward,
    returnsBackward,
    returns: +returnsForward?.blendedAPY! >= +returnsBackward?.blendedAPY! ? returnsForward : returnsBackward,
    loading,
  } as IStrategyReturns;
};
export default useStrategyReturns;
