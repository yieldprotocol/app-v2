import {
  toBn,
  _getC,
  sellBase,
  buyBase,
  buyFYToken,
  sellFYToken,
  SECONDS_PER_YEAR,
  maxFyTokenOut,
  maxFyTokenIn,
  maxBaseIn,
  maxBaseOut,
  g1_DEFAULT,
  g2_DEFAULT,
  k
} from '@yield-protocol/ui-math';

import chai, { expect } from 'chai';
import { Decimal } from 'decimal.js';
import { solidity } from 'ethereum-waffle';
import { BigNumber, utils } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

chai.use(solidity);
const { parseUnits } = utils;

const calcPrice = (shares: BigNumber, fyToken: BigNumber, c: BigNumber | string, decimals: number) =>
  toBn(
    new Decimal(shares.toString())
      .mul(_getC(c))
      .div(new Decimal(fyToken.toString()))
      .mul(10 ** decimals)
  );

describe('Shares YieldMath', () => {
  let g1 = toBn(g1_DEFAULT);
  let g2 = toBn(g2_DEFAULT);
  let ts = toBn(k);

  let sharesReserves: BigNumber;
  let fyTokenReserves: BigNumber;
  let c: BigNumber; // c: the price of vyToken to Token
  let cGreater: BigNumber; // greater c than c above
  let mu: BigNumber; // mu: the price of vyToken to Token (c) at initialization
  let timeTillMaturity: BigNumber | string;
  let decimals = 18;

  const base = parseUnits('100000', decimals); // 100,000
  const fyToken = parseUnits('100000', decimals); // 100,000

  let comparePrecision = parseUnits('.001', decimals); // how close the equality check should be within

  beforeEach(() => {
    sharesReserves = parseUnits('1000000', decimals); // 1,000,000 base reserves to decimals
    fyTokenReserves = parseUnits('1000000', decimals); // 1,000,000 fyToken reserves to decimals
    c = BigNumber.from('0x1199999999999999a'); // 1.1 in 64 bit
    cGreater = BigNumber.from('0x13333333333333333'); // 1.2 in 64 bit
    mu = BigNumber.from('0x10ccccccccccccccd'); // 1.05 in 64 bit
    timeTillMaturity = (10000000).toString(); // 10000000 seconds
    ts = toBn(k);
  });

  describe('when c is 1 and mu is 1', () => {
    it('should equal the non-variable yield function with non-variable base', () => {
      c = BigNumber.from('0x10000000000000000'); // 1.0 in 64 bit: non-variable initially
      mu = BigNumber.from('0x10000000000000000'); // 1.0 in 64 bit: non-variable initially

      const sellBaseResult = sellBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
      // expect(sellBaseResult).to.equal(sellBaseResult);

      // buyBase
      const buyBaseResult = buyBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
      // expect(buyBaseResult).to.equal(buyBaseResult);

      // buyFYToken
      const buyFYTokenResult = buyFYToken(
        sharesReserves,
        fyTokenReserves,
        base,
        timeTillMaturity,
        ts,
        g1,
        decimals,
        c,
        mu
      );
      // expect(buyFYTokenResult).to.equal(buyFYTokenResult);

      const sellFYTokenResult = sellFYToken(
        sharesReserves,
        fyTokenReserves,
        fyToken,
        timeTillMaturity,
        ts,
        g2,
        decimals,
        c,
        mu
      );
    });
  });

  describe('when c is 1.1 and mu is 1.05', () => {
    describe('sellBaseShares (fyTokenOutForSharesIn)', () => {
      it('should be more fyToken out for shares in', () => {
        const result = sellBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
        expect(result).to.be.gt(base);
      });

      it('should output a specific number with a specific input', () => {
        const result = sellBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('109490.652', decimals), comparePrecision); // 109,490.652
      });

      it('should have a price of one at maturity', () => {
        // when c stays the same
        const result = sellBase(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g1, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('110000', decimals), comparePrecision); // 110,000 fyToken out
        expect(calcPrice(base, result, c, decimals)).to.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1 formatted to decimals with precision of 3 decimal places

        // when c grew
        const result2 = sellBase(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g1, decimals, cGreater, mu);
        expect(result2).to.be.closeTo(parseUnits('120000', decimals), comparePrecision); // 120,000 fyToken out
        expect(calcPrice(base, result2, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
      });

      it('should mirror buyFYTokenShares (fyTokenInForSharesOut)', () => {
        const fyTokensOut = sellBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);

        // plug the fyTokens out from above into mirror swap function
        const baseIn = buyFYToken(
          sharesReserves,
          fyTokenReserves,
          fyTokensOut,
          timeTillMaturity,
          ts,
          g1,
          decimals,
          c,
          mu
        );
        expect(baseIn).to.be.closeTo(base, comparePrecision);
      });
    });

    describe('sellFYTokenShares (sharesOutForFYTokenIn)', () => {
      it('should be fewer shares out than fyToken in', () => {
        const result = sellFYToken(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals, c, mu);
        expect(result).to.be.lt(fyToken);
      });

      it('should output a specific number with a specific input', () => {
        const result = sellFYToken(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('90768.266', decimals), comparePrecision); // 90,768.266
      });

      it('should have a price of one at maturity', () => {
        const result = sellFYToken(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g2, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken out
        expect(calcPrice(result, fyToken, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

        // when c grew
        const result2 = sellFYToken(
          sharesReserves,
          fyTokenReserves,
          fyToken,
          (0).toString(),
          ts,
          g2,
          decimals,
          cGreater,
          mu
        );
        expect(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken out
        expect(calcPrice(result2, fyToken, cGreater, decimals)).to.be.closeTo(
          parseUnits('1', decimals),
          comparePrecision
        ); // price of 1
      });

      it('should mirror buyBaseShares (fyTokenInForSharesOut)', () => {
        const sharesOut = sellFYToken(
          sharesReserves,
          fyTokenReserves,
          fyToken,
          timeTillMaturity,
          ts,
          g2,
          decimals,
          c,
          mu
        );

        // plug the shares out from above into mirror swap function
        const fyTokenIn = buyBase(
          sharesReserves,
          fyTokenReserves,
          sharesOut,
          timeTillMaturity,
          ts,
          g2,
          decimals,
          c,
          mu
        );
        expect(fyTokenIn).to.be.closeTo(fyToken, comparePrecision);
      });
    });

    describe('buyBaseShares (fyTokenInForSharesOut)', () => {
      it('should be more fyToken in than shares out', () => {
        const result = buyBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
        expect(result).to.be.gt(base);
      });

      it('should output a specific number with a specific input', () => {
        const result = buyBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('110206.353', decimals), comparePrecision); // 110,206.353
      });

      it('should have a price of one at maturity', () => {
        const result = buyBase(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g2, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('110000', decimals), comparePrecision); // 110,000 fyToken in
        expect(calcPrice(base, result, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

        // when c grew
        const result2 = buyBase(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g2, decimals, cGreater, mu);
        expect(result2).to.be.closeTo(parseUnits('120000', decimals), comparePrecision); // 120,000 fyToken in
        expect(calcPrice(base, result2, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
      });

      it('should mirror sellFYTokenShares (sharesOutForFYTokenIn)', () => {
        const fyTokenIn = buyBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);

        // plug the fyToken in from above into mirror swap function
        const sharesOut = sellFYToken(
          sharesReserves,
          fyTokenReserves,
          fyTokenIn,
          timeTillMaturity,
          ts,
          g2,
          decimals,
          c,
          mu
        );
        expect(sharesOut).to.be.closeTo(base, comparePrecision);
      });
    });

    describe('buyFYTokenShares (sharesInForFYTokenOut)', () => {
      it('should be fewer shares in than fyToken out', () => {
        const result = buyFYToken(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g1, decimals, c, mu);
        expect(result).to.be.lt(fyToken);
      });

      it('should output a specific number with a specific input', () => {
        const result = buyFYToken(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g1, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('91306.706', decimals), comparePrecision); // 91,306.706
      });

      it('should have a price of one at maturity', () => {
        const result = buyFYToken(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g1, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken in
        expect(calcPrice(result, fyToken, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

        // when c grew
        const result2 = buyFYToken(
          sharesReserves,
          fyTokenReserves,
          fyToken,
          (0).toString(),
          ts,
          g1,
          decimals,
          cGreater,
          mu
        );
        expect(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken in
        expect(calcPrice(result2, fyToken, cGreater, decimals)).to.be.closeTo(
          parseUnits('1', decimals),
          comparePrecision
        ); // price of 1
      });

      it('should mirror sellBaseShares (fyTokenOutForSharesIn)', () => {
        // shares in
        const sharesIn = buyFYToken(
          sharesReserves,
          fyTokenReserves,
          fyToken,
          timeTillMaturity,
          ts,
          g1,
          decimals,
          c,
          mu
        );

        // plug the shares in from above into mirror swap function
        const fyTokensOut = sellBase(
          sharesReserves,
          fyTokenReserves,
          sharesIn,
          timeTillMaturity,
          ts,
          g1,
          decimals,
          c,
          mu
        );
        expect(fyTokensOut).to.be.closeTo(fyToken, comparePrecision);
      });
    });

    describe('maxFyTokenOut', () => {
      // https://www.desmos.com/calculator/sjdvxpa3vy
      it('should output a specific number with a specific input', () => {
        c = BigNumber.from('0x1199999999999999a');
        mu = BigNumber.from('0x10000000000000000');
        ts = toBn(
          new Decimal(
            1 /
              BigNumber.from(SECONDS_PER_YEAR)
                .mul(10 * 25)
                .toNumber()
          ).mul(2 ** 64)
        ); // inv of seconds in 10 years
        sharesReserves = parseUnits('1100000', decimals);
        fyTokenReserves = parseUnits('1500000', decimals);
        timeTillMaturity = (77760000).toString();

        const result = maxFyTokenOut(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('209668.563', decimals), comparePrecision); // 209,668.563642
      });
    });

    describe('maxFyTokenIn', () => {
      // https://www.desmos.com/calculator/jcdfr1qv3z
      it('should output a specific number with a specific input', () => {
        c = BigNumber.from('0x1199999999999999a');
        mu = BigNumber.from('0x10ccccccccccccccd');
        ts = toBn(
          new Decimal(
            1 /
              BigNumber.from(SECONDS_PER_YEAR)
                .mul(10 * 25)
                .toNumber()
          ).mul(2 ** 64)
        ); // inv of seconds in 10 years
        sharesReserves = parseUnits('1100000', decimals);
        fyTokenReserves = parseUnits('1500000', decimals);
        timeTillMaturity = (77760000).toString();
        const result = maxFyTokenIn(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('1230211.594', decimals), comparePrecision); // 1,230,211.59495
      });
    });
  });

  describe('when c is 110 and mu is 105', () => {
    c = BigNumber.from('0x6e0000000000000000'); // 110 in 64 bit
    mu = BigNumber.from('0x690000000000000000'); // 105 in 64 bit

    describe('sellBaseShares (fyTokenOutForSharesIn)', () => {
      it('should be more fyToken out for shares in', () => {
        const result = sellBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
        expect(result).to.be.gt(base);
      });

      it('should output a specific number with a specific input', () => {
        const result = sellBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('109490.652', decimals), comparePrecision); // 109,490.652
      });

      it('should have a price of one at maturity', () => {
        // when c stays the same
        const result = sellBase(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g1, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('110000', decimals), comparePrecision); // 110,000 fyToken out
        expect(calcPrice(base, result, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

        // when c grew
        const result2 = sellBase(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g1, decimals, cGreater, mu);
        expect(result2).to.be.closeTo(parseUnits('120000', decimals), comparePrecision); // 120,000 fyToken out
        expect(calcPrice(base, result2, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
      });

      it('should mirror buyFYTokenShares (fyTokenInForSharesOut)', () => {
        const fyTokensOut = sellBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g1, decimals, c, mu);

        // plug the fyTokens out from above into mirror swap function
        const baseIn = buyFYToken(
          sharesReserves,
          fyTokenReserves,
          fyTokensOut,
          timeTillMaturity,
          ts,
          g1,
          decimals,
          c,
          mu
        );
        expect(baseIn).to.be.closeTo(base, comparePrecision);
      });
    });

    describe('sellFYTokenShares (sharesOutForFYTokenIn)', () => {
      it('should be fewer shares out than fyToken in', () => {
        const result = sellFYToken(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals, c, mu);
        expect(result).to.be.lt(fyToken);
      });

      it('should output a specific number with a specific input', () => {
        const result = sellFYToken(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g2, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('90768.266', decimals), comparePrecision); // 90,768.266
      });

      it('should have a price of one at maturity', () => {
        const result = sellFYToken(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g2, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken out
        expect(calcPrice(result, fyToken, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

        // when c grew
        const result2 = sellFYToken(
          sharesReserves,
          fyTokenReserves,
          fyToken,
          (0).toString(),
          ts,
          g2,
          decimals,
          cGreater,
          mu
        );
        expect(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken out
        expect(calcPrice(result2, fyToken, cGreater, decimals)).to.be.closeTo(
          parseUnits('1', decimals),
          comparePrecision
        ); // price of 1
      });

      it('should mirror buyBaseShares (fyTokenInForSharesOut)', () => {
        const sharesOut = sellFYToken(
          sharesReserves,
          fyTokenReserves,
          fyToken,
          timeTillMaturity,
          ts,
          g2,
          decimals,
          c,
          mu
        );

        // plug the shares out from above into mirror swap function
        const fyTokenIn = buyBase(
          sharesReserves,
          fyTokenReserves,
          sharesOut,
          timeTillMaturity,
          ts,
          g2,
          decimals,
          c,
          mu
        );
        expect(fyTokenIn).to.be.closeTo(fyToken, comparePrecision);
      });
    });

    describe('buyBaseShares (fyTokenInForSharesOut)', () => {
      it('should be more fyToken in than shares out', () => {
        const result = buyBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
        expect(result).to.be.gt(base);
      });

      it('should output a specific number with a specific input', () => {
        const result = buyBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('110206.353', decimals), comparePrecision); // 110,206.353
      });

      it('should have a price of one at maturity', () => {
        const result = buyBase(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g2, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('110000', decimals), comparePrecision); // 110,000 fyToken in
        expect(calcPrice(base, result, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

        // when c grew
        const result2 = buyBase(sharesReserves, fyTokenReserves, base, (0).toString(), ts, g2, decimals, cGreater, mu);
        expect(result2).to.be.closeTo(parseUnits('120000', decimals), comparePrecision); // 120,000 fyToken in
        expect(calcPrice(base, result2, cGreater, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1
      });

      it('should mirror sellFYTokenShares (sharesOutForFYTokenIn)', () => {
        const fyTokenIn = buyBase(sharesReserves, fyTokenReserves, base, timeTillMaturity, ts, g2, decimals, c, mu);

        // plug the fyToken in from above into mirror swap function
        const sharesOut = sellFYToken(
          sharesReserves,
          fyTokenReserves,
          fyTokenIn,
          timeTillMaturity,
          ts,
          g2,
          decimals,
          c,
          mu
        );
        expect(sharesOut).to.be.closeTo(base, comparePrecision);
      });
    });

    describe('buyFYTokenShares (sharesInForFYTokenOut)', () => {
      it('should be fewer shares in than fyToken out', () => {
        const result = buyFYToken(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g1, decimals, c, mu);
        expect(result).to.be.lt(fyToken);
      });

      it('should output a specific number with a specific input', () => {
        const result = buyFYToken(sharesReserves, fyTokenReserves, fyToken, timeTillMaturity, ts, g1, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('91306.706', decimals), comparePrecision); // 91,306.706
      });

      it('should have a price of one at maturity', () => {
        const result = buyFYToken(sharesReserves, fyTokenReserves, fyToken, (0).toString(), ts, g1, decimals, c, mu);
        expect(result).to.be.closeTo(parseUnits('90909.091', decimals), comparePrecision); // 90,909.091 vyToken in
        expect(calcPrice(result, fyToken, c, decimals)).to.be.closeTo(parseUnits('1', decimals), comparePrecision); // price of 1

        // when c grew
        const result2 = buyFYToken(
          sharesReserves,
          fyTokenReserves,
          fyToken,
          (0).toString(),
          ts,
          g1,
          decimals,
          cGreater,
          mu
        );
        expect(result2).to.be.closeTo(parseUnits('83333.333', decimals), comparePrecision); // 83,333.333 vyToken in
        expect(calcPrice(result2, fyToken, cGreater, decimals)).to.be.closeTo(
          parseUnits('1', decimals),
          comparePrecision
        ); // price of 1
      });

      it('should mirror sellBaseShares (fyTokenOutForSharesIn)', () => {
        // shares in
        const sharesIn = buyFYToken(
          sharesReserves,
          fyTokenReserves,
          fyToken,
          timeTillMaturity,
          ts,
          g1,
          decimals,
          c,
          mu
        );

        // plug the shares in from above into mirror swap function
        const fyTokensOut = sellBase(
          sharesReserves,
          fyTokenReserves,
          sharesIn,
          timeTillMaturity,
          ts,
          g1,
          decimals,
          c,
          mu
        );
        expect(fyTokensOut).to.be.closeTo(fyToken, comparePrecision);
      });
    });
  });

  describe('example pool from fork: USDC2209 rolled', () => {
    beforeEach(() => {
      decimals = 6;
      comparePrecision = parseUnits('.001', decimals); // how close the equality check should be within
      c = BigNumber.from('0x010400a7c5ac471b47');
      mu = BigNumber.from('0x010400a7c5ac471b47');

      // example usdc 2209 maturity
      sharesReserves = BigNumber.from('0x031c0f243bb4');
      fyTokenReserves = BigNumber.from('0x031c0f243bb4');
      timeTillMaturity = '9772165';
      g1 = BigNumber.from('0xc000000000000000');
      g2 = BigNumber.from('0x015555555555555555');
      ts = BigNumber.from('0x0571a826b3');
    });

    it('should match sellFyToken desmos', () => {
      const fyTokenIn = parseUnits('100000', decimals);
      const maturity = 1672412400;

      const sellFYTokenResult = sellFYToken(
        sharesReserves,
        fyTokenReserves,
        fyTokenIn,
        timeTillMaturity,
        ts,
        g2,
        decimals,
        c,
        mu
      );

      const sellFYTokenResultDefault = sellFYToken(
        sharesReserves,
        fyTokenReserves,
        fyTokenIn,
        timeTillMaturity,
        ts,
        g2,
        decimals
      );

      // desmos output
      expect(sellFYTokenResult).to.be.closeTo(parseUnits('98438.611', decimals), comparePrecision); // 98,438.611
      expect(sellFYTokenResultDefault).to.be.closeTo(parseUnits('99951.713', decimals), comparePrecision); // 99,951.713

      // calc apr and compare to current non-tv ui borrow rate
      // const apr = calculateAPR(floorDecimal(sellFYTokenResult), fyTokenIn, maturity);
      // expect(Number(apr)).to.be.closeTo(Number('3.45'), 0.1);
    });

    it('should match buyBase desmos', () => {
      const sharesOut = parseUnits('100000', decimals);

      const buyBaseResult = buyBase(
        sharesReserves,
        fyTokenReserves,
        sharesOut,
        timeTillMaturity,
        ts,
        g2,
        decimals,
        c,
        mu
      );

      // desmos output
      expect(buyBaseResult).to.be.closeTo(parseUnits('101586.928', decimals), comparePrecision); // 101,586.928
    });

    it('should match sellBase desmos', () => {
      const sharesIn = parseUnits('100000', decimals);

      const sellBaseResult = sellBase(
        sharesReserves,
        fyTokenReserves,
        sharesIn,
        timeTillMaturity,
        ts,
        g1,
        decimals,
        c,
        mu
      );

      // desmos output
      expect(sellBaseResult).to.be.closeTo(parseUnits('101521.058', decimals), comparePrecision); // 101,521.058
    });

    it('should match buyFyToken desmos', () => {
      const fyTokenOut = parseUnits('100000', decimals);

      const buyFyTokenResult = buyFYToken(
        sharesReserves,
        fyTokenReserves,
        fyTokenOut,
        timeTillMaturity,
        ts,
        g1,
        decimals,
        c,
        mu
      );

      // desmos output
      expect(buyFyTokenResult).to.be.closeTo(parseUnits('98501.328', decimals), comparePrecision); // 98,501.328
    });

    it('should match maxBaseIn desmos', () => {
      const maxSharesIn = maxBaseIn(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals, c, mu);
      console.log('🦄 ~ file: yieldMath.test.ts ~ line 688 ~ it ~ maxSharesIn', formatUnits(maxSharesIn, decimals));

      // desmos output
      expect(maxSharesIn).to.be.closeTo(parseUnits('-52633.304', decimals), comparePrecision); // −52,633.304
    });

    it('should match maxFyTokenIn desmos', () => {
      const _maxFyTokenIn = maxFyTokenIn(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals, c, mu);

      // desmos output
      expect(_maxFyTokenIn).to.be.closeTo(parseUnits('3553185.917', decimals), comparePrecision); // 3,553,185.917
    });

    it('should match maxFyTokenOut desmos', () => {
      const _maxFyTokenOut = maxFyTokenOut(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g1, decimals, c, mu);

      // desmos output
      expect(_maxFyTokenOut).to.be.closeTo(parseUnits('-54127.343', decimals), comparePrecision); // -54,127.343
    });

    it('should match maxBaseOut desmos', () => {
      const _maxBaseOut = maxBaseOut(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals, c, mu);

      // plugging in maxBaseOut result
      const _maxFyTokenIn = maxFyTokenIn(sharesReserves, fyTokenReserves, timeTillMaturity, ts, g2, decimals, c, mu);
      const sellFYTokenResult = sellFYToken(
        sharesReserves,
        fyTokenReserves,
        _maxFyTokenIn,
        timeTillMaturity,
        ts,
        g2,
        decimals,
        c,
        mu
      );

      // desmos output
      // expect(_maxBaseOut).to.be.closeTo(sellFYTokenResult, decimals), comparePrecision);
      expect(sellFYTokenResult).to.be.closeTo(parseUnits('3419048', decimals), comparePrecision); // 3,419,048
    });
  });
});
