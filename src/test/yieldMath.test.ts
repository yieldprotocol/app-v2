import chai, { expect } from 'chai';
import { Decimal } from 'decimal.js';
import { solidity } from 'ethereum-waffle';
import { BigNumber, utils } from 'ethers';
import {
  buyBase,
  buyBaseVY,
  buyFYToken,
  buyFYTokenVY,
  sellBase,
  sellBaseVY,
  sellFYToken,
  sellFYTokenVY,
  g1_default,
  g2_default,
  k,
  toBn,
} from '../utils/yieldMath';

chai.use(solidity);
const { parseUnits, formatUnits } = utils;

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

  let base: BigNumber | string;
  let fyToken: BigNumber | string;

  const comparePrecision = parseUnits('.001', decimals); // how close the equality check should be within

  beforeEach(() => {
    baseReserves = parseUnits('1000000', decimals); // 1,000,000 base reserves to decimals
    fyTokenReserves = parseUnits('1000000', decimals); // 1,000,000 fyToken reserves to decimals
    c = parseUnits('1', decimals); // non-variable initially
    mu = parseUnits('1', decimals);
    timeTillMaturity = (10000000).toString(); // 10000000 seconds
  });

  describe('sellBaseVY (fyTokenOutForVYTokenIn)', () => {
    beforeEach(() => {
      base = parseUnits('100000', decimals); // 100,000
    });

    it('should equal the non-variable yield function with non-variable base', () => {
      const resultVY = sellBaseVY(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g1, decimals);
      const result = sellBase(baseReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals);
      expect(resultVY).to.equal(result);
    });

    it('should be more fyToken out for vyToken in when c greater than 1 and mu at 1', () => {
      c = parseUnits('1.1', decimals);
      const result = sellBaseVY(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g1, decimals);
      expect(result).to.be.gt(base);
    });

    it('should equal some number with certain inputs and c at 1.1 (formatted)', () => {
      c = parseUnits('1.1', decimals);
      const result = sellBaseVY(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g1, decimals);
      console.log('🦄 ~ file: yieldMath.test.ts ~ line 66 ~ it ~ result', formatUnits(result));
      expect(result).to.be.closeTo(parseUnits('109651.409', decimals), comparePrecision); // 109,651.409
    });
  });

  describe('sellFYTokenVY (vyTokenOutForFYTokenIn)', () => {
    beforeEach(() => {
      fyToken = parseUnits('100000', decimals); // 100,000
    });

    it('should equal non-variable yield func with non-variable base', () => {
      const resultVY = sellFYTokenVY(baseReserves, fyTokenReserves, fyToken, c, mu, timeTillMaturity, ts, g2, decimals);
      const result = sellFYToken(baseReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals);
      expect(resultVY).to.equal(result);
    });

    it('should be less vyToken out than fyToken in when c greater than 1 and mu at 1', () => {
      c = parseUnits('1.1', decimals);
      const result = sellFYTokenVY(baseReserves, fyTokenReserves, fyToken, c, mu, timeTillMaturity, ts, g2, decimals);
      expect(result).to.be.lt(fyToken);
    });

    it('should equal some number with certain inputs and coefficient at 1.1 (formatted)', () => {
      c = parseUnits('1.1', decimals);
      const result = sellFYTokenVY(baseReserves, fyTokenReserves, fyToken, c, mu, timeTillMaturity, ts, g2, decimals);
      console.log('🦄 ~ file: yieldMath.test.ts ~ line 90 ~ it ~ result', formatUnits(result));
      expect(result).to.be.closeTo(parseUnits('90620.803', decimals), comparePrecision); // 90,620.803
    });
  });

  describe('buyBaseVY (fyTokenInForVYTokenOut)', () => {
    beforeEach(() => {
      base = parseUnits('100000', decimals); // 100,000
    });

    it('should equal non-variable yield func with non-variable base', () => {
      const resultVY = buyBaseVY(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g2, decimals);
      const result = buyBase(baseReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals);
      expect(resultVY).to.equal(result);
    });

    it('should be more fyToken in than vyToken out when coefficient greater than 1', () => {
      c = parseUnits('1.1', decimals);
      const result = buyBaseVY(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g2, decimals);
      expect(result).to.be.gt(base);
    });

    it('should equal some number with certain inputs and coefficient at 1.1 (formatted)', () => {
      c = parseUnits('1.1', decimals);
      const result = buyBaseVY(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g2, decimals);
      console.log('🦄 ~ file: yieldMath.test.ts ~ line 118 ~ it ~ result', formatUnits(result));
      expect(result).to.be.closeTo(parseUnits('110386.285', decimals), comparePrecision); // 110,386.285
    });
  });

  describe('buyFYTokenVY (vyTokenInForFYTokenOut)', () => {
    beforeEach(() => {
      fyToken = parseUnits('100000', decimals); // 100,000
    });

    it('should equal non-variable yield func with non-variable base', () => {
      const resultVY = buyFYTokenVY(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g2, decimals);
      const result = buyFYToken(baseReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals);
      expect(resultVY).to.equal(result);
    });

    it('should be less vyToken in than fyToken out when coefficient greater than 1', () => {
      c = parseUnits('1.1', decimals);
      const result = buyFYTokenVY(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g1, decimals);
      expect(result).to.be.lt(fyToken);
    });

    it('should equal some number with certain inputs and coefficient at 1.1 (formatted)', () => {
      c = parseUnits('1.1', decimals);
      const result = buyFYTokenVY(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g1, decimals);
      console.log('🦄 ~ file: yieldMath.test.ts ~ line 143 ~ it ~ result', formatUnits(result));
      expect(result).to.be.closeTo(parseUnits('91172.431', decimals), comparePrecision); // 91,172.431
    });
  });
});
