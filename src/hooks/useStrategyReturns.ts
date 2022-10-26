import Decimal from 'decimal.js';
import { BigNumber } from 'ethers';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ActionType, ISeries, IStrategy, IUserContext } from '../types';
import { cleanValue } from '../utils/appUtils';
import { useApr } from './useApr';
import { ONE_DEC as ONE, SECONDS_PER_YEAR, sellFYToken, ZERO_DEC as ZERO, invariant } from '@yield-protocol/ui-math';
import { parseUnits } from 'ethers/lib/utils';
import { UserContext } from '../contexts/UserContext';
import useTimeTillMaturity from './useTimeTillMaturity';

interface IReturns {
  sharesBlendedAPY?: string;
  sharesAPY?: string;
  fyTokenAPY?: string;
  feesAPY?: string;
  blendedAPY?: string; // "blended" because sharesAPY is weighted against pool ratio of shares to fyToken
}

interface IStrategyReturns {
  calcStrategyReturns: (input: string, strategy: IStrategy) => IReturns;
  // returnsBackward: IReturns;
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
const useStrategyReturns = (input: string | undefined, strategy: IStrategy | undefined = undefined, digits = 1): IStrategyReturns => {
  const {
    userState: { selectedStrategy },
  } = useContext(UserContext) as IUserContext;

  const strategy_ = strategy || selectedStrategy;
  const series = strategy_?.currentSeries as ISeries | null;

  const inputToUse = cleanValue(!input || +input === 0 ? '1' : input, series?.decimals!);

  const { apr: borrowApy } = useApr(inputToUse, ActionType.BORROW, series);
  const { apr: lendApy } = useApr(inputToUse, ActionType.LEND, series);
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
  const fyTokenPrice = (series: ISeries, input: string ) => {
    if (series) {
      const input_ = parseUnits(input, series.decimals);

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
  }

  /**
   * Calculate the total base value of the pool
   * total = shares value in base + fyToken value in base
   *
   * @returns {number} total base value of pool
   */
  const poolBaseValue = ( series: ISeries, fyTokenPrice: number) => {
    if (!series) return;
    const sharesBaseVal = +series.getBase(series.sharesReserves);
    const fyTokenBaseVal = +series.fyTokenRealReserves * fyTokenPrice;
    return sharesBaseVal + fyTokenBaseVal;
  }

  /**
   * Calculates estimated blended apy from shares portion of pool
   * @returns {number} shares apy of pool
   */
  const sharesAPY = ( series:ISeries , poolBaseValue: number) => {
    if (!series) return 0;
    if (series.poolAPY && poolBaseValue) {
      const sharesBaseVal = +series.getBase(series.sharesReserves);
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
  const feesAPY = (series:ISeries, initSeries:ISeries|undefined) => {
    if (!series) return 0;

    let currentInvariant = series.currentInvariant || '0';
    let initInvariant = series.initInvariant || '0';

    if ((!series.currentInvariant || !series.initInvariant) ) {

      if (!initSeries) return 0; 

      currentInvariant = invariant(
        series.sharesReserves,
        series.fyTokenReserves,
        series.totalSupply,
        getTimeTillMaturity(series.maturity),
        series.ts,
        series.g2,
        series.decimals,
        series.c,
        series.mu
      );

      initInvariant = invariant(
        initSeries.sharesReserves,
        initSeries.fyTokenReserves,
        initSeries.totalSupply,
        (series.maturity - series.startBlock.timestamp).toString(),
        initSeries.ts,
        initSeries.g2,
        series.decimals,
        initSeries.c,
        series.mu
      );
    }
    // get apy estimate
    const res = calculateAPR(initInvariant, currentInvariant, NOW, series.startBlock.timestamp);

    if (isNaN(+res!)) {
      return 0;
    }

    return +res!;
  }

  /**
   * Calculate (estimate) how much interest would be captured by LP position using market rates and fyToken proportion of the pool
   * @returns {number} estimated fyToken interest from LP position
   */
  const fyTokenAPY = (series: ISeries, borrowApy:number, fyTokenPrice:number, lendApy:number , poolBaseValue:number) => {
    if (!series) return 0;

    if (!poolBaseValue) return 0;

    // the average of the borrow and lend apr's
    const marketInterestRate = (+borrowApy! + +lendApy!) / 2;
    // how much fyToken in base the pool is comprised of
    const fyTokenValRatio = (+series.fyTokenRealReserves * fyTokenPrice) / poolBaseValue;

    return marketInterestRate * fyTokenValRatio;
  };

  /* TODO  fix this*/
  const totalAPYBackward = ( strategy: IStrategy, digits:number = 2 ) => {
    const series = strategy.currentSeries;
    if (!series || !strategy_) return;

    const strategyLpBalance = +strategy_?.strategyPoolBalance!;
    const strategyTotalSupply = +strategy_?.strategyTotalSupply!;
    const poolTotalSupply = +series.totalSupply;

    const poolBaseValue_ = poolBaseValue(series, 1) 
    if (!poolBaseValue_) return;

    const strategyLpBalSupplyRatio = strategyLpBalance / strategyTotalSupply;

    const value = strategyLpBalSupplyRatio * (poolBaseValue_ / poolTotalSupply);
    const apy = calculateAPR('1', value.toString(), NOW, strategy_.startBlock?.timestamp);

    return cleanValue(apy, digits);
  };

  // get the init series data to use the invariant function
  useEffect(() => {
    (async () => {
      if (!series) return;
      const { poolContract, currentInvariant, initInvariant } = series;

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
  }, [series]);

  const calcStrategyReturns = (input: string, strategy: IStrategy) => {

    const series_ = strategy?.currentSeries!;

    const fyTokenPrice_ = fyTokenPrice(series_, '1') // || input
    const poolBaseValue_ = poolBaseValue(series_, fyTokenPrice_  )
    const borrowApy_ = parseFloat(series_?.apr! || '0');
    
    const sharesAPY_ = sharesAPY(series_, poolBaseValue_! );
    const feesAPY_ = feesAPY(series_, undefined );
    const fyTokenAPY_ = fyTokenAPY(series_, borrowApy_, fyTokenPrice_, borrowApy_, poolBaseValue_! );

    // return cleanValue((sharesAPY_ + feesAPY_ + fyTokenAPY_).toString(), digits);
    return {
      feesAPY: cleanValue(feesAPY_.toString(), digits),
      sharesAPY: cleanValue(sharesAPY_.toString(), digits),
      fyTokenAPY: cleanValue(fyTokenAPY_.toString(), digits),
      blendedAPY: cleanValue((sharesAPY_ + feesAPY_ + fyTokenAPY_).toString(), digits),
    }

  };

  const returns = calcStrategyReturns( inputToUse , selectedStrategy!); 

  return {
    returns,
    // returnsBackward: { blendedAPY: totalAPYBackward },
    calcStrategyReturns, 
  } as IStrategyReturns;
};

export default useStrategyReturns;


