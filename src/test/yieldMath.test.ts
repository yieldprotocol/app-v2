import chai, { expect } from 'chai';
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
} from '../utils/yieldMath';

chai.use(solidity);
const { parseUnits, formatUnits } = utils;

describe('VY YieldMath', () => {
  let baseReserves: BigNumber | string; // z
  let fyTokenReserves: BigNumber | string; // y
  let coefficient: BigNumber | string; // c: the price of vyDAI to DAI
  let timeTillMaturity: BigNumber | string;
  let decimals: number;

  let base: BigNumber | string;
  let fyToken: BigNumber | string;

  beforeEach(() => {
    baseReserves = parseUnits('1', 27); // z
    fyTokenReserves = parseUnits('2', 27); // y
    coefficient = parseUnits('1', 18); // c: the price of vyDAI to DAI
    timeTillMaturity = parseUnits('1', 7);
    decimals = 18;
  });

  describe('sellBaseVY (fyDaiOutForVYDaiIn)', () => {
    // https://www.desmos.com/calculator/wh5quy9mft
    base = parseUnits('1.84', 24);

    it('should equal non-variable yield func with non-variable base', () => {
      const resultVY = sellBaseVY(baseReserves, fyTokenReserves, base, coefficient, timeTillMaturity, decimals);
      const result = sellBase(baseReserves, fyTokenReserves, base, timeTillMaturity, decimals);
      expect(resultVY).to.equal(result);
    });

    it('should be more fyToken out for vyToken in when coefficient greater than 1', () => {
      const result = sellBaseVY(baseReserves, fyTokenReserves, base, coefficient, timeTillMaturity, decimals);
      expect(result).to.be.gt(base);
    });

    it('should equal some number with certain inputs and coefficient at 1.1 (formatted)', () => {
      coefficient = parseUnits('1.1', decimals);
      const result = sellBaseVY(baseReserves, fyTokenReserves, base, coefficient, timeTillMaturity, decimals);
      expect(result).to.be.within(BigNumber.from(parseUnits('2.0', 24)), BigNumber.from(parseUnits('2.3', 24))); // should be 2.2 * 10 ** 24
    });
  });

  describe('sellFYTokenVY (vyDaiOutForFYDaiIn)', () => {
    // https://www.desmos.com/calculator/nwsjfyi4qu

    beforeEach(() => {
      fyToken = parseUnits('2', 24);
    });

    it('should equal non-variable yield func with non-variable base', () => {
      const resultVY = sellFYTokenVY(baseReserves, fyTokenReserves, fyToken, coefficient, timeTillMaturity, decimals);
      const result = sellFYToken(baseReserves, fyTokenReserves, fyToken, timeTillMaturity, decimals);
      expect(resultVY).to.equal(result);
    });

    it('should be less vyToken out than fyToken in when coefficient greater than 1', () => {
      coefficient = parseUnits('1.1', decimals);
      const result = sellFYTokenVY(baseReserves, fyTokenReserves, fyToken, coefficient, timeTillMaturity, decimals);
      expect(result).to.be.lt(fyToken);
    });

    it('should equal some number with certain inputs and coefficient at 1.1 (formatted)', () => {
      coefficient = parseUnits('1.1', decimals);
      const result = sellFYTokenVY(baseReserves, fyTokenReserves, fyToken, coefficient, timeTillMaturity, decimals);
      expect(result).to.be.within(BigNumber.from(parseUnits('1.5', 24)), BigNumber.from(parseUnits('1.8', 24))); // should be 1.6572 * 10 ** 24
    });
  });

  describe('buyBaseVY (fyDaiInForVYDaiOut)', () => {
    // https://www.desmos.com/calculator/jmvpaci27o

    beforeEach(() => {
      base = parseUnits('2', 24);
    });

    it('should equal non-variable yield func with non-variable base', () => {
      const resultVY = buyBaseVY(baseReserves, fyTokenReserves, base, coefficient, timeTillMaturity, decimals);
      const result = buyBase(baseReserves, fyTokenReserves, base, timeTillMaturity, decimals);
      expect(resultVY).to.equal(result);
    });

    it('should be more fyToken in than vyToken out when coefficient greater than 1', () => {
      coefficient = parseUnits('1.1', decimals);
      const result = buyBaseVY(baseReserves, fyTokenReserves, base, coefficient, timeTillMaturity, decimals);
      expect(result).to.be.gt(base);
    });

    it('should equal some number with certain inputs and coefficient at 1.1 (formatted)', () => {
      coefficient = parseUnits('1.1', decimals);
      const result = buyBaseVY(baseReserves, fyTokenReserves, base, coefficient, timeTillMaturity, decimals);
      expect(result).to.be.within(BigNumber.from(parseUnits('2.0', 24)), BigNumber.from(parseUnits('2.3', 24))); // should be 2.4138 * 10 ** 24
    });
  });

  describe('buyFYTokenVY (vyDaiInForFYDaiOut)', () => {
    // https://www.desmos.com/calculator/jmvpaci27o

    beforeEach(() => {
      fyToken = parseUnits('2', 24);
    });

    it('should equal non-variable yield func with non-variable base', () => {
      const resultVY = buyFYTokenVY(baseReserves, fyTokenReserves, base, coefficient, timeTillMaturity, decimals);
      const result = buyFYToken(baseReserves, fyTokenReserves, base, timeTillMaturity, decimals);
      expect(resultVY).to.equal(result);
    });

    it('should be less vyToken in than fyToken out when coefficient greater than 1', () => {
      coefficient = parseUnits('1.1', decimals);
      const result = buyFYTokenVY(baseReserves, fyTokenReserves, fyToken, coefficient, timeTillMaturity, decimals);
      console.log('vyToken in', formatUnits(result));
      console.log('fyToken out', formatUnits(fyToken));
      expect(result).to.be.lt(fyToken);
    });

    it('should equal some number with certain inputs and coefficient at 1.1 (formatted)', () => {
      coefficient = parseUnits('1.1', decimals);
      const result = buyFYTokenVY(baseReserves, fyTokenReserves, fyToken, coefficient, timeTillMaturity, decimals);
      expect(result).to.be.within(BigNumber.from(parseUnits('1.6', 24)), BigNumber.from(parseUnits('1.8', 24))); // should be 1.6728 * 10 ** 24
    });
  });
});
