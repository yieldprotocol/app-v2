import { Decimal } from 'decimal.js';
import { BigNumber, ethers, utils } from 'ethers';
import {
  g1_default,
  g2_default,
  k,
  toBn,
  getBaseNeededForInterestRateChange,
  calculateRate,
  getTimeStretchYears,
  sellBase,
  buyBase,
} from '../src/utils/yieldMath';

const { parseUnits } = utils;

describe('Interest Rate Output for Base In YieldMath', () => {
  const g1 = toBn(g1_default);
  const g2 = toBn(g2_default);
  const ts = toBn(k);

  let baseReserves: BigNumber;
  let fyTokenReserves: BigNumber;
  const timeTillMaturity: string = '15000000';

  const decimals = 18;

  const DESIRED_INTEREST_RATE = 0.1;
  const comparePrecision = 3; // 3 digits

  beforeEach(() => {
    baseReserves = parseUnits('1000000', decimals); // 100 base reserves to decimals
    fyTokenReserves = parseUnits('1100000', decimals); // 105 fyToken reserves to decimals
  });

  describe('with specific parameters that match desmos', () => {
    it('should equal the new rate', () => {
      const timeStretchYears = getTimeStretchYears(ts);

      const [, , baseReservesNew, fyTokenReservesNew] = getBaseNeededForInterestRateChange(
        baseReserves,
        fyTokenReserves,
        timeTillMaturity,
        ts,
        g1,
        g2,
        DESIRED_INTEREST_RATE
      );

      const newRate = calculateRate(
        new Decimal(fyTokenReservesNew.toString()),
        new Decimal(baseReservesNew.toString()),
        timeStretchYears
      );

      expect(Number(newRate)).toBeCloseTo(Number(DESIRED_INTEREST_RATE), comparePrecision);
    });

    it('should result in desired interest rate AFTER sellBase {decrease rates}, or buyBase {increase rates} using output from yieldMath func', () => {
      const timeStretchYears = getTimeStretchYears(ts);

      // to compare new and current rate to assess which swap direction
      const currRate = calculateRate(
        new Decimal(fyTokenReserves.toString()),
        new Decimal(baseReserves.toString()),
        timeStretchYears
      );

      const [, , baseReservesNew, fyTokenReservesNew, result] = getBaseNeededForInterestRateChange(
        baseReserves,
        fyTokenReserves,
        timeTillMaturity,
        ts,
        g1,
        g2,
        DESIRED_INTEREST_RATE
      );

      // estimate new rate
      const newRate = calculateRate(
        new Decimal(fyTokenReservesNew.toString()),
        new Decimal(baseReservesNew.toString()),
        timeStretchYears
      );

      let fyTokenDiff: BigNumber;

      // assess which swap func to use
      // use sellBase if decreasing rates
      // use buyBase if increasing rates
      if (newRate.lt(currRate)) {
        fyTokenDiff = sellBase(baseReserves, fyTokenReserves, result, timeTillMaturity, ts, g1, decimals);

        // update reserves based on swap result
        fyTokenReserves = fyTokenReserves.sub(fyTokenDiff);
        baseReserves = baseReserves.add(result);
      } else {
        fyTokenDiff = buyBase(baseReserves, fyTokenReserves, result, timeTillMaturity, ts, g2, decimals);

        // update reserves based on swap result
        fyTokenReserves = fyTokenReserves.add(fyTokenDiff);
        baseReserves = baseReserves.sub(result);
      }

      const afterSwapNewRate = calculateRate(
        new Decimal(fyTokenReserves.toString()),
        new Decimal(baseReserves.toString()),
        timeStretchYears
      );

      expect(Number(afterSwapNewRate)).toBeCloseTo(Number(DESIRED_INTEREST_RATE), comparePrecision);
    });
  });
});
