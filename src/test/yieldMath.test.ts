import chai, { expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { BigNumber, utils } from 'ethers';
import { sellBase, sellBaseVY } from '../utils/yieldMath';

chai.use(solidity);
const { parseUnits } = utils;

describe('VY YieldMath', () => {
  let baseReserves: BigNumber | string; // z
  let fyTokenReserves: BigNumber | string; // y
  let base: BigNumber | string;
  let coefficient: BigNumber | string; // c: the price of vyDAI to DAI
  let timeTillMaturity: BigNumber | string;

  beforeEach(() => {
    baseReserves = parseUnits('1', 27); // z
    fyTokenReserves = parseUnits('2', 27); // y
    base = parseUnits('1.84', 24);
    coefficient = '1'; // c: the price of vyDAI to DAI
    timeTillMaturity = parseUnits('1', 7);
  });

  describe('sellBaseVY (fyDaiOutForVYDaiIn)', () => {
    // https://www.desmos.com/calculator/wh5quy9mft
    it('should equal non-variable yield func with non-variable base', () => {
      const resultVY = sellBaseVY(baseReserves, fyTokenReserves, base, coefficient, timeTillMaturity, 18);
      const result = sellBase(baseReserves, fyTokenReserves, base, timeTillMaturity, 18);
      expect(resultVY).to.equal(result);
    });

    it('should equal some number with certain inputs', () => {
      const result = sellBaseVY(baseReserves, fyTokenReserves, base, coefficient, timeTillMaturity, 18);
      expect(result).to.be.within(BigNumber.from(parseUnits('1.8', 24)), BigNumber.from(parseUnits('2', 24)));
    });
  });
});
