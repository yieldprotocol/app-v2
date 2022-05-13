import expect from 'expect.js';
import { Decimal } from 'decimal.js';
import { BigNumber, utils } from 'ethers';
import {
  g1_default,
  g2_default,
  k,
  toBn,
  getBaseNeededForInterestRateChange,
  secondsInOneYear,
  ONE_DEC,
} from '../src/utils/yieldMath';

const { parseUnits } = utils;

const getTimeStretchYears = (ts: BigNumber) => {
  const _ts = new Decimal(BigNumber.from(ts).toString()).div(2 ** 64);
  const _secondsInOneYear = new Decimal(secondsInOneYear.toString());
  const invTs = ONE_DEC.div(_ts);
  return invTs.div(_secondsInOneYear);
};

const calculateRate = (fyTokenReserves: Decimal, baseReserves: Decimal, timeStretchYears: Decimal) =>
  fyTokenReserves.div(baseReserves).pow(ONE_DEC.div(timeStretchYears)).sub(ONE_DEC);

describe('Interest Rate Output for Base In YieldMath', () => {
  const g1 = toBn(g1_default);
  const g2 = toBn(g2_default);
  const ts = toBn(k);

  let baseReserves: BigNumber;
  let fyTokenReserves: BigNumber;
  const timeTillMaturity: string = '10000000';

  const decimals = 18;

  const DESIRED_INTEREST_RATE = 0.1;

  beforeEach(() => {
    baseReserves = parseUnits('100', decimals); // 100 base reserves to decimals
    fyTokenReserves = parseUnits('105', decimals); // 105 fyToken reserves to decimals
  });

  describe('when certain parameters ', () => {
    it('should equal a specific output with certain parameters', () => {
      const timeStretchYears = getTimeStretchYears(ts);
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

      const newRate = calculateRate(
        new Decimal(fyTokenReservesNew.toString()),
        new Decimal(baseReservesNew.toString()),
        timeStretchYears
      );

      console.log('🦄 ~ file: interestRateChange.test.ts ~ line 61 ~ it ~ result', result);
      console.log('🦄 ~ file: interestRateChange.test.ts ~ line 59 ~ it ~ currRate', currRate);
      console.log('🦄 ~ file: interestRateChange.test.ts ~ line 75 ~ it ~ newRate', newRate);

      expect(newRate).to.be(DESIRED_INTEREST_RATE);
    });
  });
});
