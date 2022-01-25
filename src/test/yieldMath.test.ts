import chai, { expect } from 'chai';
import { Decimal } from 'decimal.js';
import { solidity } from 'ethereum-waffle';
import { BigNumber, utils } from 'ethers';
import {
  buyBase,
  buyBaseShares,
  buyFYToken,
  buyFYTokenShares,
  sellBase,
  sellBaseShares,
  sellFYToken,
  sellFYTokenShares,
  g1_default,
  g2_default,
  k,
  toBn,
} from '../utils/yieldMath';

chai.use(solidity);
const { parseUnits, formatUnits } = utils;

const calcPrice = (base: BigNumber, fyToken: BigNumber, c: BigNumber | string) =>
  base.mul(BigNumber.from(c)).div(fyToken);

describe('VY YieldMath', () => {
  const g1 = toBn(g1_default);
  const g2 = toBn(g2_default);
  const ts = toBn(k);

  let baseReserves: BigNumber | string;
  let fyTokenReserves: BigNumber | string;
  let c: BigNumber | string; // c: the price of vyToken to Token
  let mu: BigNumber | string; // mu: the price of vyToken to Token (c) at initialization
  let timeTillMaturity: BigNumber | string;
  const decimals = 18;

  const base = parseUnits('100000', decimals); // 100,000
  const fyToken = parseUnits('100000', decimals); // 100,000

  const comparePrecision = parseUnits('.001', decimals); // how close the equality check should be within

  beforeEach(() => {
    baseReserves = parseUnits('1000000', decimals); // 1,000,000 base reserves to decimals
    fyTokenReserves = parseUnits('1000000', decimals); // 1,000,000 fyToken reserves to decimals
    c = parseUnits('1.1', decimals);
    mu = parseUnits('1.05', decimals);
    timeTillMaturity = (10000000).toString(); // 10000000 seconds
  });

  it('should equal the non-variable yield function with non-variable base', () => {
    c = parseUnits('1', decimals); // non-variable initially
    mu = parseUnits('1', decimals); // non-variable initially
    // sellBase
    const sellBaseVYResult = sellBaseShares(
      baseReserves,
      fyTokenReserves,
      base,
      c,
      mu,
      timeTillMaturity,
      ts,
      g1,
      decimals
    );
    const sellBaseResult = sellBase(baseReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals);
    expect(sellBaseVYResult).to.equal(sellBaseResult);

    // sellFYToken
    const sellFYTokenVYResult = sellFYTokenShares(
      baseReserves,
      fyTokenReserves,
      fyToken,
      c,
      mu,
      timeTillMaturity,
      ts,
      g2,
      decimals
    );
    const sellFYTokenResult = sellFYToken(baseReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals);
    expect(sellFYTokenVYResult).to.equal(sellFYTokenResult);

    // buyBase
    const buyBaseVYResult = buyBaseShares(
      baseReserves,
      fyTokenReserves,
      base,
      c,
      mu,
      timeTillMaturity,
      ts,
      g2,
      decimals
    );
    const buyBaseResult = buyBase(baseReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals);
    expect(buyBaseVYResult).to.equal(buyBaseResult);

    // buyFYToken
    const buyFYTokenVYResult = buyFYTokenShares(
      baseReserves,
      fyTokenReserves,
      base,
      c,
      mu,
      timeTillMaturity,
      ts,
      g1,
      decimals
    );
    const buyFYTokenResult = buyFYToken(baseReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals);
    expect(buyFYTokenVYResult).to.equal(buyFYTokenResult);
  });

  describe('sellBaseVY (fyTokenOutForVYTokenIn)', () => {
    it('should be more fyToken out for vyToken in when c greater than 1 and mu at 1', () => {
      const result = sellBaseShares(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g1, decimals);
      expect(result).to.be.gt(base);
    });

    it('should equal some number with certain inputs and c at 1.1 (formatted) and mu at 1.05', () => {
      const result = sellBaseShares(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g1, decimals);
      expect(result).to.be.closeTo(parseUnits('109490.652', decimals), comparePrecision); // 109,490.652
    });

    it('should have a price of one at maturity', () => {
      // when c stays the same
      const result = sellBaseShares(baseReserves, fyTokenReserves, base, c, mu, (0).toString(), ts, g1, decimals);
      expect(result).to.be.closeTo(parseUnits('110000', decimals), comparePrecision); // 110,000 fyToken out
      expect(calcPrice(base, result, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

      // when c grew
      c = parseUnits('1.2', decimals);
      const result2 = sellBaseShares(baseReserves, fyTokenReserves, base, c, mu, (0).toString(), ts, g1, decimals);
      expect(result2).to.be.closeTo(parseUnits('120000', decimals), comparePrecision); // 120,000 fyToken out
      expect(calcPrice(base, result2, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
    });
  });

  describe('sellFYTokenVY (vyTokenOutForFYTokenIn)', () => {
    it('should be less vyToken out than fyToken in when c greater than 1', () => {
      const result = sellFYTokenShares(
        baseReserves,
        fyTokenReserves,
        fyToken,
        c,
        mu,
        timeTillMaturity,
        ts,
        g2,
        decimals
      );
      expect(result).to.be.lt(fyToken);
    });

    it('should equal some number with certain inputs and coefficient at 1.1 (formatted) and mu at 1.05', () => {
      const result = sellFYTokenShares(
        baseReserves,
        fyTokenReserves,
        fyToken,
        c,
        mu,
        timeTillMaturity,
        ts,
        g2,
        decimals
      );
      expect(result).to.be.closeTo(parseUnits('90768.266', decimals), comparePrecision); // 90,768.266
    });

    it('should have a price of one at maturity', () => {
      const result = sellFYTokenShares(baseReserves, fyTokenReserves, fyToken, c, mu, (0).toString(), ts, g2, decimals);
      expect(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken out
      expect(calcPrice(result, fyToken, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

      // when c grew
      c = parseUnits('1.2', decimals);
      const result2 = sellFYTokenShares(
        baseReserves,
        fyTokenReserves,
        fyToken,
        c,
        mu,
        (0).toString(),
        ts,
        g2,
        decimals
      );
      expect(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken out
      expect(calcPrice(result2, fyToken, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
    });
  });

  describe('buyBaseVY (fyTokenInForVYTokenOut)', () => {
    it('should be more fyToken in than vyToken out when coefficient greater than 1', () => {
      const result = buyBaseShares(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g2, decimals);
      expect(result).to.be.gt(base);
    });

    it('should equal some number with certain inputs and coefficient at 1.1 (formatted) and mu at 1.05', () => {
      const result = buyBaseShares(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g2, decimals);
      expect(result).to.be.closeTo(parseUnits('110206.353', decimals), comparePrecision); // 110,206.353
    });

    it('should have a price of one at maturity', () => {
      const result = buyBaseShares(baseReserves, fyTokenReserves, base, c, mu, (0).toString(), ts, g2, decimals);
      expect(result).to.be.closeTo(parseUnits('110000', decimals), comparePrecision); // 110,000 fyToken in
      expect(calcPrice(base, result, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

      // when c grew
      c = parseUnits('1.2', decimals);
      const result2 = buyBaseShares(baseReserves, fyTokenReserves, base, c, mu, (0).toString(), ts, g2, decimals);
      expect(result2).to.be.closeTo(parseUnits('120000', decimals), comparePrecision); // 120,000 fyToken in
      expect(calcPrice(base, result2, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
    });
  });

  describe('buyFYTokenVY (vyTokenInForFYTokenOut)', () => {
    it('should be less vyToken in than fyToken out when coefficient greater than 1', () => {
      const result = buyFYTokenShares(
        baseReserves,
        fyTokenReserves,
        fyToken,
        c,
        mu,
        timeTillMaturity,
        ts,
        g1,
        decimals
      );
      expect(result).to.be.lt(fyToken);
    });

    it('should equal some number with certain inputs and coefficient at 1.1 (formatted) and mu at 1.05', () => {
      const result = buyFYTokenShares(
        baseReserves,
        fyTokenReserves,
        fyToken,
        c,
        mu,
        timeTillMaturity,
        ts,
        g1,
        decimals
      );
      expect(result).to.be.closeTo(parseUnits('91306.706', decimals), comparePrecision); // 91,306.706
    });

    it('should have a price of one at maturity', () => {
      const result = buyFYTokenShares(baseReserves, fyTokenReserves, fyToken, c, mu, (0).toString(), ts, g1, decimals);
      expect(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken in
      expect(calcPrice(result, fyToken, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

      // when c grew
      c = parseUnits('1.2', decimals);
      const result2 = buyFYTokenShares(baseReserves, fyTokenReserves, fyToken, c, mu, (0).toString(), ts, g1, decimals);
      expect(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken in
      expect(calcPrice(result2, fyToken, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
    });
  });
});
