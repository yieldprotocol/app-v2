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
  maxFyTokenOut,
  maxBaseIn,
} from '../utils/yieldMath';

chai.use(solidity);
const { parseUnits, formatUnits } = utils;

const calcPrice = (base: BigNumber, fyToken: BigNumber, c: BigNumber | string) =>
  base.mul(BigNumber.from(c)).div(fyToken);

describe('Shares YieldMath', () => {
  const g1 = toBn(g1_default);
  const g2 = toBn(g2_default);
  const ts = toBn(k);

  let baseReserves: BigNumber;
  let fyTokenReserves: BigNumber;
  let c: BigNumber; // c: the price of vyToken to Token
  let mu: BigNumber; // mu: the price of vyToken to Token (c) at initialization
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

  describe('when c is 1 and mu is 1', () => {
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
  });

  describe('when c is 1.1 and mu is 1.05', () => {
    describe('sellBaseShares (fyTokenOutForSharesIn)', () => {
      it('should be more fyToken out for shares in', () => {
        const result = sellBaseShares(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g1, decimals);
        expect(result).to.be.gt(base);
      });

      it('should output a specific number with a specific input', () => {
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

      it('should mirror buyFYTokenShares (fyTokenInForSharesOut)', () => {
        const fyTokensOut = sellBaseShares(
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

        // plug the fyTokens out from above into mirror swap function
        const baseIn = buyFYTokenShares(
          baseReserves,
          fyTokenReserves,
          fyTokensOut,
          c,
          mu,
          timeTillMaturity,
          ts,
          g1,
          decimals
        );
        expect(baseIn).to.be.closeTo(base, comparePrecision);
      });

      it('should have max fyToken out of x', () => {
        const maxShares = maxBaseIn(baseReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals);
        console.log('🦄 ~ file: yieldMath.test.ts ~ line 182 ~ it ~ maxBase', formatUnits(maxShares));
        console.log('🦄 ~ file: yieldMath.test.ts ~ line 184 ~ it ~ timeTillMaturity', timeTillMaturity);
      });
    });

    describe('sellFYTokenShares (sharesOutForFYTokenIn)', () => {
      it('should be fewer shares out than fyToken in', () => {
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

      it('should output a specific number with a specific input', () => {
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
        const result = sellFYTokenShares(
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

      it('should mirror buyBaseShares (fyTokenInForSharesOut)', () => {
        const sharesOut = sellFYTokenShares(
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

        // plug the shares out from above into mirror swap function
        const fyTokenIn = buyBaseShares(
          baseReserves,
          fyTokenReserves,
          sharesOut,
          c,
          mu,
          timeTillMaturity,
          ts,
          g2,
          decimals
        );
        expect(fyTokenIn).to.be.closeTo(fyToken, comparePrecision);
      });
    });

    describe('buyBaseShares (fyTokenInForSharesOut)', () => {
      it('should be more fyToken in than shares out', () => {
        const result = buyBaseShares(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g2, decimals);
        expect(result).to.be.gt(base);
      });

      it('should output a specific number with a specific input', () => {
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

      it('should mirror sellFYTokenShares (sharesOutForFYTokenIn)', () => {
        const fyTokenIn = buyBaseShares(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g2, decimals);

        // plug the fyToken in from above into mirror swap function
        const sharesOut = sellFYTokenShares(
          baseReserves,
          fyTokenReserves,
          fyTokenIn,
          c,
          mu,
          timeTillMaturity,
          ts,
          g2,
          decimals
        );
        expect(sharesOut).to.be.closeTo(base, comparePrecision);
      });
    });

    describe('buyFYTokenShares (sharesInForFYTokenOut)', () => {
      it('should be fewer shares in than fyToken out', () => {
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

      it('should output a specific number with a specific input', () => {
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
        const result = buyFYTokenShares(
          baseReserves,
          fyTokenReserves,
          fyToken,
          c,
          mu,
          (0).toString(),
          ts,
          g1,
          decimals
        );
        expect(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken in
        expect(calcPrice(result, fyToken, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

        // when c grew
        c = parseUnits('1.2', decimals);
        const result2 = buyFYTokenShares(
          baseReserves,
          fyTokenReserves,
          fyToken,
          c,
          mu,
          (0).toString(),
          ts,
          g1,
          decimals
        );
        expect(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken in
        expect(calcPrice(result2, fyToken, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
      });

      it('should mirror sellBaseShares (fyTokenOutForSharesIn)', () => {
        // shares in
        const sharesIn = buyFYTokenShares(
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

        // plug the shares in from above into mirror swap function
        const fyTokensOut = sellBaseShares(
          baseReserves,
          fyTokenReserves,
          sharesIn,
          c,
          mu,
          timeTillMaturity,
          ts,
          g1,
          decimals
        );
        expect(fyTokensOut).to.be.closeTo(fyToken, comparePrecision);
      });
    });
  });

  describe('when c is 110 and mu is 105', () => {
    c = parseUnits('110', decimals);
    mu = parseUnits('105', decimals);
    describe('sellBaseShares (fyTokenOutForSharesIn)', () => {
      it('should be more fyToken out for shares in', () => {
        const result = sellBaseShares(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g1, decimals);
        expect(result).to.be.gt(base);
      });

      it('should output a specific number with a specific input', () => {
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

      it('should mirror buyFYTokenShares (fyTokenInForSharesOut)', () => {
        const fyTokensOut = sellBaseShares(
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

        // plug the fyTokens out from above into mirror swap function
        const baseIn = buyFYTokenShares(
          baseReserves,
          fyTokenReserves,
          fyTokensOut,
          c,
          mu,
          timeTillMaturity,
          ts,
          g1,
          decimals
        );
        expect(baseIn).to.be.closeTo(base, comparePrecision);
      });

      it('should have max fyToken out of x', () => {
        const maxShares = maxBaseIn(baseReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals);
        console.log('🦄 ~ file: yieldMath.test.ts ~ line 182 ~ it ~ maxBase', formatUnits(maxShares));
        console.log('🦄 ~ file: yieldMath.test.ts ~ line 184 ~ it ~ timeTillMaturity', timeTillMaturity);
      });
    });

    describe('sellFYTokenShares (sharesOutForFYTokenIn)', () => {
      it('should be fewer shares out than fyToken in', () => {
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

      it('should output a specific number with a specific input', () => {
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
        const result = sellFYTokenShares(
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

      it('should mirror buyBaseShares (fyTokenInForSharesOut)', () => {
        const sharesOut = sellFYTokenShares(
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

        // plug the shares out from above into mirror swap function
        const fyTokenIn = buyBaseShares(
          baseReserves,
          fyTokenReserves,
          sharesOut,
          c,
          mu,
          timeTillMaturity,
          ts,
          g2,
          decimals
        );
        expect(fyTokenIn).to.be.closeTo(fyToken, comparePrecision);
      });
    });

    describe('buyBaseShares (fyTokenInForSharesOut)', () => {
      it('should be more fyToken in than shares out', () => {
        const result = buyBaseShares(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g2, decimals);
        expect(result).to.be.gt(base);
      });

      it('should output a specific number with a specific input', () => {
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

      it('should mirror sellFYTokenShares (sharesOutForFYTokenIn)', () => {
        const fyTokenIn = buyBaseShares(baseReserves, fyTokenReserves, base, c, mu, timeTillMaturity, ts, g2, decimals);

        // plug the fyToken in from above into mirror swap function
        const sharesOut = sellFYTokenShares(
          baseReserves,
          fyTokenReserves,
          fyTokenIn,
          c,
          mu,
          timeTillMaturity,
          ts,
          g2,
          decimals
        );
        expect(sharesOut).to.be.closeTo(base, comparePrecision);
      });
    });

    describe('buyFYTokenShares (sharesInForFYTokenOut)', () => {
      it('should be fewer shares in than fyToken out', () => {
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

      it('should output a specific number with a specific input', () => {
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
        const result = buyFYTokenShares(
          baseReserves,
          fyTokenReserves,
          fyToken,
          c,
          mu,
          (0).toString(),
          ts,
          g1,
          decimals
        );
        expect(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken in
        expect(calcPrice(result, fyToken, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

        // when c grew
        c = parseUnits('1.2', decimals);
        const result2 = buyFYTokenShares(
          baseReserves,
          fyTokenReserves,
          fyToken,
          c,
          mu,
          (0).toString(),
          ts,
          g1,
          decimals
        );
        expect(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken in
        expect(calcPrice(result2, fyToken, c)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
      });

      it('should mirror sellBaseShares (fyTokenOutForSharesIn)', () => {
        // shares in
        const sharesIn = buyFYTokenShares(
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

        // plug the shares in from above into mirror swap function
        const fyTokensOut = sellBaseShares(
          baseReserves,
          fyTokenReserves,
          sharesIn,
          c,
          mu,
          timeTillMaturity,
          ts,
          g1,
          decimals
        );
        expect(fyTokensOut).to.be.closeTo(fyToken, comparePrecision);
      });
    });
  });
});
