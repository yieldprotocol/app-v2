/* eslint-disable @typescript-eslint/naming-convention */
import { ethers, BigNumber, BigNumberish } from 'ethers';
import { Decimal } from 'decimal.js';

Decimal.set({ precision: 64 });

/* constants exposed for export */
export const MAX_256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
export const MAX_128 = '0xffffffffffffffffffffffffffffffff';

export const ZERO_DEC: Decimal = new Decimal(0);
export const ONE_DEC: Decimal = new Decimal(1);
export const TWO_DEC: Decimal = new Decimal(2);
export const MAX_DEC: Decimal = new Decimal(MAX_256);

export const RAY_DEC: Decimal = new Decimal('1000000000000000000000000000');

export const ZERO_BN = ethers.constants.Zero;
export const ONE_BN = ethers.constants.One;
export const MINUS_ONE_BN = ethers.constants.One.mul(-1);

export const WAD_RAY_BN = BigNumber.from('1000000000000000000000000000');
export const WAD_BN = BigNumber.from('1000000000000000000');

export const SECONDS_PER_YEAR: number = 365 * 24 * 60 * 60;

export const secondsInOneYear = BigNumber.from(31557600);
export const secondsInTenYears = secondsInOneYear.mul(10); // Seconds in 10 years

/* Convenience naming local constants */
const ZERO = ZERO_DEC;
const ONE = ONE_DEC;
const TWO = TWO_DEC;
const MAX = MAX_DEC;

/* Protocol Specific Constants */
export const k = new Decimal(1 / BigNumber.from(SECONDS_PER_YEAR).mul(10).toNumber()).mul(2 ** 64); // inv of seconds in 10 years
export const g1_DEFAULT = new Decimal(950 / 1000).mul(2 ** 64);
export const g2_DEFAULT = new Decimal(1000 / 950).mul(2 ** 64);

export const c_DEFAULT = '0x10000000000000000'; // 1 in 64 bit
export const mu_DEFAULT = '0x10000000000000000'; // 1 in 64 bit

const precisionFee = new Decimal(1000000000000);

/** *************************
 Support functions
 *************************** */

/**
 * Convert a bignumber with any decimal to a bn with decimal of 18
 * @param x bn to convert.
 * @param decimals of the current bignumber
 * @returns BigNumber
 */
export const decimalNToDecimal18 = (x: BigNumber, decimals: number): BigNumber =>
  // BigNumber.from(x.toString() + '0'.repeat(18 - decimals));
  BigNumber.from(x).mul(BigNumber.from('10').pow(18 - decimals));

/**
 * Convert a decimal18 to a bn of any decimal
 * @param x 18 decimal to reduce
 * @param decimals required
 * @returns BigNumber
 */
export const decimal18ToDecimalN = (x: BigNumber, decimals: number): BigNumber => {
  const str = x.toString();
  const first = str.slice(0, str.length - (18 - decimals));
  return BigNumber.from(first || 0); // zero if slice removes more than the number of decimals
};

/**
 * TODO: maybe move this out to gerneral yieldUtils
 * Convert bytesX to bytes32 (BigEndian?)
 * @param x string to convert.
 * @param n current bytes value eg. bytes6 or bytes12
 * @returns string bytes32
 */
export function bytesToBytes32(x: string, n: number): string {
  return x + '00'.repeat(32 - n);
}
/**
 * TODO: Possibily move this out to general yieldUtils?
 * @param { BigNumber | string } to unix time
 * @param { BigNumber | string } from  unix time *optional* default: now
 * @returns { string } as number seconds 'from' -> 'to'
 */
export const secondsToFrom = (
  to: BigNumber | string,
  from: BigNumber | string = BigNumber.from(Math.round(new Date().getTime() / 1000)) // OPTIONAL: FROM defaults to current time if omitted
): string => {
  const to_ = ethers.BigNumber.isBigNumber(to) ? to : BigNumber.from(to);
  const from_ = ethers.BigNumber.isBigNumber(from) ? from : BigNumber.from(from);
  return to_.sub(from_).toString();
};
/**
 * @param { BigNumber | string } value
 * @returns { string }
 */
export const floorDecimal = (value: BigNumber | string): string => Decimal.floor(value.toString()).toFixed();

/**
 * @param { Decimal } value
 * @returns { BigNumber }
 */
export const toBn = (value: Decimal): BigNumber => BigNumber.from(floorDecimal(value.toFixed()));

/**
 * Calculate the baseId from the series name
 * @param seriesId seriesID.
 * @returns string bytes32
 */
export function baseIdFromSeriesId(seriesId: string): string {
  return seriesId.slice(0, 6).concat('00000000');
}

/**
 * @param { BigNumber | string } multiplicant
 * @param { BigNumber | string } multiplier
 * @param { string } precisionDifference  // Difference between multiplicant and mulitplier precision (eg. wei vs ray '1e-27' )
 * @returns { string } in decimal precision of the multiplicant
 */
export const mulDecimal = (
  multiplicant: BigNumber | string,
  multiplier: BigNumber | string,
  precisionDifference: string = '1' // DEFAULT = 1 (same precision)
): string => {
  const multiplicant_ = new Decimal(multiplicant.toString());
  const multiplier_ = new Decimal(multiplier.toString());
  const _preDif = new Decimal(precisionDifference.toString());
  const _normalisedMul = multiplier_.mul(_preDif);
  return multiplicant_.mul(_normalisedMul).toFixed();
};

/**
 * @param  { BigNumber | string } numerator
 * @param { BigNumber | string } divisor
 * @param { BigNumber | string } precisionDifference // Difference between multiplicant and mulitplier precision (eg. wei vs ray '1e-27' )
 * @returns { string } in decimal precision of the numerator
 */
export const divDecimal = (
  numerator: BigNumber | string,
  divisor: BigNumber | string,
  precisionDifference: string = '1' // DEFAULT = 1 (same precision)
): string => {
  const numerator_ = new Decimal(numerator.toString());
  const divisor_ = new Decimal(divisor.toString());
  const _preDif = new Decimal(precisionDifference.toString());
  const _normalisedDiv = divisor_.mul(_preDif);
  return numerator_.div(_normalisedDiv).toFixed();
};

/**
 * specific Yieldspace helper functions
 * */
const _computeA = (
  timeToMaturity: BigNumber | string,
  ts: BigNumber | string,
  g: BigNumber | string
): [Decimal, Decimal] => {
  const timeTillMaturity_ = new Decimal(timeToMaturity.toString());
  // console.log( new Decimal(BigNumber.from(g).toString()).div(2 ** 64).toString() )

  const _g = new Decimal(BigNumber.from(g).toString()).div(2 ** 64);
  const _ts = new Decimal(BigNumber.from(ts).toString()).div(2 ** 64);

  // t = ts * timeTillMaturity
  const t = _ts.mul(timeTillMaturity_);
  // a = (1 - gt)
  const a = ONE.sub(_g.mul(t));
  const invA = ONE.div(a);
  return [a, invA]; /* returns a and inverse of a */
};

/** remove _computeB */
const _computeB = (
  timeToMaturity: BigNumber | string,
  ts: BigNumber | string,
  g: BigNumber | string
): [Decimal, Decimal] => {
  const timeTillMaturity_ = new Decimal(timeToMaturity.toString());

  const _g = new Decimal(BigNumber.from(g).toString()).div(2 ** 64);
  const _ts = new Decimal(BigNumber.from(ts).toString()).div(2 ** 64);

  // t = ts * timeTillMaturity
  const t = _ts.mul(timeTillMaturity_);
  // b = (1 - t/g)
  const b = ONE.sub(t.div(_g));
  const invB = ONE.div(b);
  return [b, invB]; /* returns b and inverse of b */
};

/**
 * Converts c from 64 bit to a decimal like 1.1
 * @param c
 * @returns
 */
export const _getC = (c: BigNumber | string) => new Decimal(c.toString()).div(2 ** 64);

/**
 * Converts mu from 64 bit to a decimal like 1.0
 * @param mu
 * @returns
 */
const _getMu = (mu: BigNumber | string) => new Decimal(mu.toString()).div(2 ** 64);

/** ************************
 YieldSpace functions
 *************************** */

/**
 * @param { BigNumber | string } sharesReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } shares
 * @returns {[BigNumber, BigNumber]}
 *
 * https://www.desmos.com/calculator/mllhtohxfx
 */
export function mint(
  sharesReserves: BigNumber | string,
  fyTokenReserves: BigNumber | string,
  totalSupply: BigNumber | string,
  shares: BigNumber | string,
  fromBase: boolean = false
): [BigNumber, BigNumber] {
  const sharesReserves_ = new Decimal(sharesReserves.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves.toString());
  const supply_ = new Decimal(totalSupply.toString());
  const shares_ = new Decimal(shares.toString());

  const m = fromBase ? supply_.mul(shares_).div(sharesReserves_) : supply_.mul(shares_).div(fyTokenReserves_);
  const y = fromBase ? fyTokenReserves_.mul(m).div(supply_) : sharesReserves_.mul(m).div(supply_);

  return [toBn(m), toBn(y)];
}

/**
 * @param { BigNumber | string } sharesReserves
 * @param { BigNumber | string } fyTokenRealReserves
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } lpTokens
 * @returns {[BigNumber, BigNumber]}
 *
 * https://www.desmos.com/calculator/ubsalzunpo
 */
export function burn(
  sharesReserves: BigNumber | string,
  fyTokenRealReserves: BigNumber | string,
  totalSupply: BigNumber | string,
  lpTokens: BigNumber | string
): [BigNumber, BigNumber] {
  const Z = new Decimal(sharesReserves.toString());
  const Y = new Decimal(fyTokenRealReserves.toString());
  const S = new Decimal(totalSupply.toString());
  const x = new Decimal(lpTokens.toString());
  const z = x.mul(Z).div(S);
  const y = x.mul(Y).div(S);
  return [toBn(z), toBn(y)];
}

/**
 *
 * @param { BigNumber | string } poolTotalSupply
 * @param { BigNumber | string } strategyTotalsupply
 * @param { BigNumber | string } strategyTokensToBurn
 *
 * @returns {BigNumber}
 *
 */
export function burnFromStrategy(
  poolTotalSupply: BigNumber | string,
  strategyTotalsupply: BigNumber | string,
  strategyTokensToBurn: BigNumber | string
): BigNumber {
  const pS = new Decimal(poolTotalSupply.toString());
  const sS = new Decimal(strategyTotalsupply.toString());
  const tS = new Decimal(strategyTokensToBurn.toString());
  const x = pS.mul(tS.div(sS));
  return toBn(x);
}

/**
 * @param { BigNumber } sharesReserves
 * @param { BigNumber } fyTokenReservesVirtual
 * @param { BigNumber } fyTokenReservesReal
 * @param { BigNumber | string } fyToken
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g1
 * @param { number } decimals
 * @param { BigNumber | string } c
 * @param { BigNumber | string } mu
 *
 * @returns {[BigNumber, BigNumber]}
 */
export function mintWithBase(
  sharesReserves: BigNumber,
  fyTokenReservesVirtual: BigNumber,
  fyTokenReservesReal: BigNumber,
  fyToken: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  ts: BigNumber | string,
  g1: BigNumber | string,
  decimals: number,
  c: BigNumber | string = c_DEFAULT,
  mu: BigNumber | string = mu_DEFAULT
): [BigNumber, BigNumber] {
  const Z = new Decimal(sharesReserves.toString());
  const YR = new Decimal(fyTokenReservesReal.toString());
  const supply = fyTokenReservesVirtual.sub(fyTokenReservesReal);
  const y = new Decimal(fyToken.toString());
  // buyFyToken:
  const z1 = new Decimal(
    buyFYToken(sharesReserves, fyTokenReservesVirtual, fyToken, timeTillMaturity, ts, g1, decimals, c, mu).toString()
  );
  const Z2 = Z.add(z1); // Base reserves after the trade
  const YR2 = YR.sub(y); // FYToken reserves after the trade

  // Mint specifying how much fyToken to take in. Reverse of `mint`.
  const [minted, z2] = mint(toBn(Z2), toBn(YR2), supply, fyToken, false);

  return [minted, toBn(z1).add(z2)];
}

/**
 * @param { BigNumber | string } sharesReserves
 * @param { BigNumber | string } fyTokenReservesVirtual
 * @param { BigNumber | string } fyTokenReservesReal
 * @param { BigNumber | string } lpTokens
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g2
 * @param { number } decimals
 * @param { BigNumber | string } c
 * @param { BigNumber | string } mu
 *
 * @returns { BigNumber }
 */
export function burnForBase(
  sharesReserves: BigNumber,
  fyTokenReservesVirtual: BigNumber,
  fyTokenReservesReal: BigNumber,
  lpTokens: BigNumber,
  timeTillMaturity: BigNumber | string,
  ts: BigNumber | string,
  g2: BigNumber | string,
  decimals: number,
  c: BigNumber | string = c_DEFAULT,
  mu: BigNumber | string = mu_DEFAULT
): BigNumber {
  const supply = fyTokenReservesVirtual.sub(fyTokenReservesReal);
  // Burn FyToken
  const [z1, y] = burn(sharesReserves, fyTokenReservesReal, supply, lpTokens);
  // Sell FyToken for base
  const z2 = sellFYToken(sharesReserves, fyTokenReservesVirtual, y, timeTillMaturity, ts, g2, decimals, c, mu);
  const z1D = new Decimal(z1.toString());
  const z2D = new Decimal(z2.toString());
  return toBn(z1D.add(z2D));
}

/**
 * Calculates the amount of fyToken a user would get for given amount of shares.
 * fyTokenOutForSharesIn
 * https://www.desmos.com/calculator/bdplcpol2y
 * @param { BigNumber | string } sharesReserves yield bearing vault shares reserve amount
 * @param { BigNumber | string } fyTokenReserves fyToken reserves amount
 * @param { BigNumber | string } sharesIn shares amount to be traded
 * @param { BigNumber | string } timeTillMaturity time till maturity in seconds
 * @param { BigNumber | string } ts time stretch
 * @param { BigNumber | string } g1 fee coefficient
 * @param { number } decimals pool decimals
 * @param { BigNumber | string } c price of shares in terms of their base in 64 bit
 * @param { BigNumber | string } mu (μ) Normalization factor -- starts as c at initialization in 64 bit
 *
 * @returns { BigNumber } fyTokenOut: the amount of fyToken a user would get for given amount of shares
 *
 * y = fyToken reserves
 * z = base reserves
 * x = Δz (sharesIn)
 *
 *      y - (                         sum                          )^(   invA   )
 *      y - ( (    Za        ) + (  Ya  ) - (       Zxa          ) )^(   invA   )
 * Δy = y - ( c/μ * (μz)^(1-t) +  y^(1-t) -  c/μ * (μz + μx)^(1-t) )^(1 / (1 - t)
 */
export function sellBase(
  sharesReserves: BigNumber | string,
  fyTokenReserves: BigNumber | string,
  sharesIn: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  ts: BigNumber | string,
  g1: BigNumber | string,
  decimals: number,
  c: BigNumber | string = c_DEFAULT,
  mu: BigNumber | string = mu_DEFAULT
): BigNumber {
  /* convert to 18 decimals, if required */
  const sharesReserves18 = decimalNToDecimal18(BigNumber.from(sharesReserves), decimals);
  const fyTokenReserves18 = decimalNToDecimal18(BigNumber.from(fyTokenReserves), decimals);
  const shares18 = decimalNToDecimal18(BigNumber.from(sharesIn), decimals);

  const sharesReserves_ = new Decimal(sharesReserves18.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves18.toString());
  const shares_ = new Decimal(shares18.toString());
  const c_ = _getC(c);
  const mu_ = _getMu(mu);

  const [a, invA] = _computeA(timeTillMaturity, ts, g1);

  const Za = c_.div(mu_).mul(mu_.mul(sharesReserves_).pow(a));
  const Ya = fyTokenReserves_.pow(a);
  const Zxa = c_.div(mu_).mul(mu_.mul(sharesReserves_).add(mu_.mul(shares_)).pow(a));
  const sum = Za.add(Ya).sub(Zxa);
  const y = fyTokenReserves_.sub(sum.pow(invA));

  const yFee = y.sub(precisionFee);
  return yFee.isNaN() ? ethers.constants.Zero : decimal18ToDecimalN(toBn(yFee), decimals);
}

/**
 * Calculates the amount of shares a user would get for certain amount of fyToken.
 * sharesOutForFYTokenIn
 * https://www.desmos.com/calculator/mjzqajjsq6
 * @param { BigNumber | string } sharesReserves sharesReserves shares reserves amount
 * @param { BigNumber | string } fyTokenReserves fyTokenReserves fyToken reserves amount
 * @param { BigNumber | string } fyTokenIn fyToken amount to be traded
 * @param { BigNumber | string } timeTillMaturity time till maturity in seconds
 * @param { BigNumber | string } ts time stretch
 * @param { BigNumber | string } g2 fee coefficient
 * @param { number } decimals pool decimals
 * @param { BigNumber | string } c price of shares in terms of their base in 64 bit
 * @param { BigNumber | string } mu (μ) Normalization factor -- starts as c at initialization in 64 bit
 *
 * @returns { BigNumber } sharesOut: amount of shares a user would get for given amount of fyToken
 *
 * y = fyToken
 * z = vyToken
 * x = Δy
 *
 *      z - 1/μ * (                      sum                                      )^(   invA    )
 *      z - 1/μ * ( (       Za           ) + ( Ya  ) - (    Yxa    )  ) / (c / μ) )^(   invA    )
 * Δz = z - 1/μ * ( ( (c / μ) * (μz)^(1-t) + y^(1-t) - (y + x)^(1-t)  ) / (c / μ) )^(1 / (1 - t))
 */
export function sellFYToken(
  sharesReserves: BigNumber | string,
  fyTokenReserves: BigNumber | string,
  fyTokenIn: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  ts: BigNumber | string,
  g2: BigNumber | string,
  decimals: number,
  c: BigNumber | string = c_DEFAULT,
  mu: BigNumber | string = mu_DEFAULT
): BigNumber {
  /* convert to 18 decimals, if required */
  const sharesReserves18 = decimalNToDecimal18(BigNumber.from(sharesReserves), decimals);
  const fyTokenReserves18 = decimalNToDecimal18(BigNumber.from(fyTokenReserves), decimals);
  const fyToken18 = decimalNToDecimal18(BigNumber.from(fyTokenIn), decimals);

  const sharesReserves_ = new Decimal(sharesReserves18.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves18.toString());
  const fyToken_ = new Decimal(fyToken18.toString());
  const c_ = _getC(c);
  const mu_ = _getMu(mu);

  const [a, invA] = _computeA(timeTillMaturity, ts, g2);

  const Za = c_.div(mu_).mul(mu_.mul(sharesReserves_).pow(a));
  const Ya = fyTokenReserves_.pow(a);
  const Yxa = fyTokenReserves_.add(fyToken_).pow(a);
  const sum = Za.add(Ya).sub(Yxa).div(c_.div(mu_));
  const y = sharesReserves_.sub(ONE.div(mu_).mul(sum.pow(invA)));

  const yFee = y.sub(precisionFee);
  return yFee.isNaN() ? ethers.constants.Zero : decimal18ToDecimalN(toBn(yFee), decimals);
}

/**
 * Calculates the amount of fyToken a user could sell for given amount of shares.
 * fyTokenInForSharesOut
 * https://www.desmos.com/calculator/8dgux6slgq
 * @param { BigNumber | string } sharesReserves shares reserves amount
 * @param { BigNumber | string } fyTokenReserves fyToken reserves amount
 * @param { BigNumber | string } sharesOut shares amount to be traded
 * @param { BigNumber | string } timeTillMaturity time till maturity in seconds
 * @param { BigNumber | string } ts time stretch
 * @param { BigNumber | string } g2 fee coefficient
 * @param { number } decimals pool decimals
 * @param { BigNumber | string } c price of shares in terms of their base in 64 bit
 * @param { BigNumber | string } mu (μ) Normalization factor -- starts as c at initialization in 64 bit
 *
 * @returns { BigNumber } fyTokenIn: the amount of fyToken a user could sell for given amount of shares
 *
 * y = fyToken reserves
 * z = shares reserves
 * x = Δz (sharesOut)
 *
 *      (                  sum                               )^(   invA   )  - y
 *      ( (    Za        ) + ( Ya  ) - (      Zxa            )^(   invA   )  - y
 * Δy = ( c/μ * (μz)^(1-t) + y^(1-t) - c/μ * (μz - μx)^(1-t) )^(1 / (1 - t)) - y
 */
export function buyBase(
  sharesReserves: BigNumber | string,
  fyTokenReserves: BigNumber | string,
  sharesOut: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  ts: BigNumber | string,
  g2: BigNumber | string,
  decimals: number,
  c: BigNumber | string = c_DEFAULT,
  mu: BigNumber | string = mu_DEFAULT
): BigNumber {
  /* convert to 18 decimals, if required */
  const sharesReserves18 = decimalNToDecimal18(BigNumber.from(sharesReserves), decimals);
  const fyTokenReserves18 = decimalNToDecimal18(BigNumber.from(fyTokenReserves), decimals);
  const shares18 = decimalNToDecimal18(BigNumber.from(sharesOut), decimals);

  const sharesReserves_ = new Decimal(sharesReserves18.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves18.toString());
  const shares_ = new Decimal(shares18.toString());
  const c_ = _getC(c);
  const mu_ = _getMu(mu);

  const [a, invA] = _computeA(timeTillMaturity, ts, g2);

  const Za = c_.div(mu_).mul(mu_.mul(sharesReserves_).pow(a));
  const Ya = fyTokenReserves_.pow(a);
  const Zxa = c_.div(mu_).mul(mu_.mul(sharesReserves_).sub(mu_.mul(shares_)).pow(a));
  const sum = Za.add(Ya).sub(Zxa);
  const y = sum.pow(invA).sub(fyTokenReserves_);

  const yFee = y.add(precisionFee);
  return yFee.isNaN() ? ethers.constants.Zero : decimal18ToDecimalN(toBn(yFee), decimals);
}

/**
 * Calculates the amount of fyToken a user could buy for given amount of shares.
 * sharesInForFYTokenOut
 * https://www.desmos.com/calculator/oyj2qzevzs
 * @param { BigNumber | string } sharesReserves yield bearing vault shares reserve amount
 * @param { BigNumber | string } fyTokenReserves fyToken reserves amount
 * @param { BigNumber | string } fyTokenOut fyToken amount to be traded
 * @param { BigNumber | string } timeTillMaturity time till maturity in seconds
 * @param { BigNumber | string } ts time stretch
 * @param { BigNumber | string } g1 fee coefficient
 * @param { number } decimals pool decimals
 * @param { BigNumber | string } c price of shares in terms of their base in 64 bit
 * @param { BigNumber | string } mu (μ) Normalization factor -- starts as c at initialization in 64 bit
 *
 * @returns { BigNumber } sharesIn: result the amount of shares a user would have to pay for given amount of fyToken
 *
 * y = fyToken
 * z = vyToken
 * x = Δy
 *
 *      ( 1/μ * (                         sum                           ) )^(   invA    ) - z
 *      ( 1/μ * ( (     Za       ) + ( Ya   ) - (    Yxa    ) ) / (c/μ) ) )^(   invA    ) - z
 * Δz = ( 1/μ * ( ( c/μ * μz^(1-t) + y^(1-t)  - (y - x)^(1-t) ) / (c/μ) ) )^(1 / (1 - t)) - z
 */
export function buyFYToken(
  sharesReserves: BigNumber | string, // z
  fyTokenReserves: BigNumber | string, // y
  fyTokenOut: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  ts: BigNumber | string,
  g1: BigNumber | string,
  decimals: number,
  c: BigNumber | string = c_DEFAULT,
  mu: BigNumber | string = mu_DEFAULT
): BigNumber {
  /* convert to 18 decimals, if required */
  const sharesReserves18 = decimalNToDecimal18(BigNumber.from(sharesReserves), decimals);
  const fyTokenReserves18 = decimalNToDecimal18(BigNumber.from(fyTokenReserves), decimals);
  const fyToken18 = decimalNToDecimal18(BigNumber.from(fyTokenOut), decimals);

  const sharesReserves_ = new Decimal(sharesReserves18.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves18.toString());
  const fyToken_ = new Decimal(fyToken18.toString());
  const c_ = _getC(c);
  const mu_ = _getMu(mu);

  const [a, invA] = _computeA(timeTillMaturity, ts, g1);

  const Za = c_.div(mu_).mul(mu_.mul(sharesReserves_).pow(a));
  const Ya = fyTokenReserves_.pow(a);
  const Yxa = fyTokenReserves_.sub(fyToken_).pow(a);
  const sum = Za.add(Ya.sub(Yxa)).div(c_.div(mu_));
  const y = ONE.div(mu_).mul(sum.pow(invA)).sub(sharesReserves_);

  const yFee = y.add(precisionFee);
  return yFee.isNaN() ? ethers.constants.Zero : decimal18ToDecimalN(toBn(yFee), decimals);
}

/**
 * Calculate the max amount of shares that can be sold to into the pool without making the interest rate negative.
 *
 * @param { BigNumber | string } sharesReserves yield bearing vault shares reserve amount
 * @param { BigNumber | string } fyTokenReserves fyToken reserves amount
 * @param { BigNumber | string } timeTillMaturity time till maturity in seconds
 * @param { BigNumber | string } ts time stretch
 * @param { BigNumber | string } g1 fee coefficient
 * @param { number } decimals pool decimals
 * @param { BigNumber | string } c price of shares in terms of their base in 64 bit
 * @param { BigNumber | string } mu (μ) Normalization factor -- starts as c at initialization in 64 bit
 *
 * @returns { BigNumber } max amount of shares that can be bought from the pool
 *
 * y = fyToken
 * z = vyToken
 * x = Δy
 *
 *      1/μ * ( (               sum                 )^(   invA    ) - z
 *      1/μ * ( ( (  cua   ) * Za  + Ya ) / (c/μ + 1) )^(   invA    ) - z
 * Δz = 1/μ * ( ( ( cμ^a * z^a + μy^a) / (c + μ) )^(1 / (1 - t)) - z
 *
 */
export function maxBaseIn(
  sharesReserves: BigNumber,
  fyTokenReserves: BigNumber,
  timeTillMaturity: BigNumber | string,
  ts: BigNumber | string,
  g1: BigNumber | string,
  decimals: number,
  c: BigNumber | string = c_DEFAULT,
  mu: BigNumber | string = mu_DEFAULT
): BigNumber {
  /* convert to 18 decimals, if required */
  const sharesReserves18 = decimalNToDecimal18(sharesReserves, decimals);
  const fyTokenReserves18 = decimalNToDecimal18(fyTokenReserves, decimals);

  const sharesReserves_ = new Decimal(sharesReserves18.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves18.toString());

  const [a, invA] = _computeA(timeTillMaturity, ts, g1);
  const c_ = _getC(c);
  const mu_ = _getMu(mu);

  const cua = c_.mul(mu_.pow(a));
  const Za = sharesReserves_.pow(a);
  const Ya = mu_.mul(fyTokenReserves_.pow(a));
  const top = cua.mul(Za).add(Ya);
  const bottom = c_.add(mu_);
  const sum = top.div(bottom);

  const res = ONE.div(mu_).mul(sum.pow(invA)).sub(sharesReserves_);

  /* Handle precision variations */
  const safeRes = res.gt(MAX.sub(precisionFee)) ? MAX : res.add(precisionFee);

  /* Convert to back to token native decimals, if required */
  return decimal18ToDecimalN(toBn(safeRes), decimals);
}

/**
 * Calculate the max amount of shares that can be bought from the pool.
 * Since the amount of shares that can be purchased is not bounded, maxSharesOut is equivalent to the toal amount of shares in the pool.
 *
 * @param { BigNumber | string } sharesReserves
 *
 * @returns { BigNumber } max amount of shares that can be bought from the pool
 *
 */
export function maxBaseOut(sharesReserves: BigNumber): BigNumber {
  return sharesReserves;
}

/**
 * Calculate the max amount of fyTokens that can be sold to into the pool.
 *
 * y = maxFyTokenIn
 * Y = fyTokenReserves (virtual)
 * Z = sharesReserves
 *
 *     (       sum           )^(invA) - y
 *     ( (    Za      ) + Ya )^(invA) - y
 * y = ( (c/μ) * (μZ)^a + Y^a)^(1/a)  - y
 *
 * @param { BigNumber | string } sharesReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g2
 * @param { number } decimals
 * @param { BigNumber | string } c
 * @param { BigNumber | string } mu
 *
 * @returns { BigNumber }
 */
export function maxFyTokenIn(
  sharesReserves: BigNumber,
  fyTokenReserves: BigNumber,
  timeTillMaturity: BigNumber | string,
  ts: BigNumber | string,
  g2: BigNumber | string,
  decimals: number,
  c: BigNumber | string = c_DEFAULT,
  mu: BigNumber | string = mu_DEFAULT
): BigNumber {
  /* convert to 18 decimals, if required */
  const sharesReserves18 = decimalNToDecimal18(sharesReserves, decimals);
  const fyTokenReserves18 = decimalNToDecimal18(fyTokenReserves, decimals);

  const sharesReserves_ = new Decimal(sharesReserves18.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves18.toString());
  const c_ = _getC(c);
  const mu_ = _getMu(mu);

  const [a, invA] = _computeA(timeTillMaturity, ts, g2);

  const Za = c_.div(mu_).mul(mu_.mul(sharesReserves_).pow(a));
  const Ya = fyTokenReserves_.pow(a);
  const sum = Za.add(Ya);

  const res = sum.pow(invA).sub(fyTokenReserves_);

  /* Handle precision variations */
  const safeRes = res.gt(precisionFee) ? res.sub(precisionFee) : ZERO;

  /* convert to back to token native decimals, if required */
  return decimal18ToDecimalN(toBn(safeRes), decimals);
}

/**
 * Calculate the max amount of fyTokens that can be bought from the pool without making the interest rate negative.
 *
 * y = maxFyTokenOut
 * Y = fyTokenReserves (virtual)
 * Z = sharesReserves
 * cmu = cμ^a
 *
 *         ( (       sum                 ) / (  denominator  ) )^invA
 *         ( ( (    Za      ) + (  Ya  ) ) / (  denominator  ) )^invA
 * y = Y - ( ( ( cμ^a * Z^a ) + ( μY^a ) ) / (    c + μ    ) )^(1/a)
 *
 * @param { BigNumber | string } sharesReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } timeTillMaturity
 * @param { BigNumber | string } ts
 * @param { BigNumber | string } g1
 * @param { number } decimals
 * @param { BigNumber | string } c
 * @param { BigNumber | string } mu
 *
 * @returns { BigNumber }
 */
export function maxFyTokenOut(
  sharesReserves: BigNumber,
  fyTokenReserves: BigNumber,
  timeTillMaturity: BigNumber | string,
  ts: BigNumber | string,
  g1: BigNumber | string,
  decimals: number,
  c: BigNumber | string = c_DEFAULT,
  mu: BigNumber | string = mu_DEFAULT
): BigNumber {
  /* convert to 18 decimals, if required */
  const sharesReserves18 = decimalNToDecimal18(sharesReserves, decimals);
  const fyTokenReserves18 = decimalNToDecimal18(fyTokenReserves, decimals);

  /* convert to decimal for the math */
  const sharesReserves_ = new Decimal(sharesReserves18.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves18.toString());
  const c_ = _getC(c);
  const mu_ = _getMu(mu);

  const [a, invA] = _computeA(timeTillMaturity, ts, g1);

  const cmu = c_.mul(mu_.pow(a));

  const Za = cmu.mul(sharesReserves_.pow(a));
  const Ya = mu_.mul(fyTokenReserves_.pow(a));
  const sum = Za.add(Ya);
  const denominator = c_.add(mu_);

  const res = fyTokenReserves_.sub(sum.div(denominator).pow(invA));

  /* Handle precision variations */
  const safeRes = res.gt(MAX.sub(precisionFee)) ? MAX : res.add(precisionFee);

  /* convert to back to token native decimals, if required */
  return decimal18ToDecimalN(toBn(safeRes), decimals);
}

/**
 * Calculate the amount of fyToken that should be bought when providing liquidity with only underlying.
 * The amount bought leaves a bit of unused underlying, to allow for the pool reserves to change between
 * the calculation and the mint. The pool returns any unused underlying.
 *
 * @param sharesReserves
 * @param fyTokenRealReserves
 * @param fyTokenVirtualReserves
 * @param shares
 * @param timeTillMaturity
 * @param ts
 * @param g1
 * @param decimals
 * @param slippage How far from the optimum we want to be
 * @param precision How wide the range in which we will accept a value
 * @param c
 * @param mu
 *
 * @returns fyTokenToBuy, surplus
 */

export function fyTokenForMint(
  sharesReserves: BigNumber,
  fyTokenRealReserves: BigNumber,
  fyTokenVirtualReserves: BigNumber,
  shares: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  ts: BigNumber | string,
  g1: BigNumber | string,
  decimals: number,
  slippage: number = 0.01, // 1% default
  c: BigNumber | string = c_DEFAULT,
  mu: BigNumber | string = mu_DEFAULT,
  precision: number = 0.0001 // 0.01% default
): [BigNumber, BigNumber] {
  const shares_ = new Decimal(shares.toString());
  const minSurplus = shares_.mul(slippage);
  const maxSurplus = minSurplus.add(shares_.mul(precision));

  let maxFYToken = new Decimal(
    maxFyTokenOut(sharesReserves, fyTokenVirtualReserves, timeTillMaturity, ts, g1, decimals, c, mu).toString()
  );
  let minFYToken = ZERO_DEC;

  if (maxFYToken.lt(2)) return [ZERO_BN, ZERO_BN]; // won't be able to parse using toBn

  let i = 0;
  while (true) {
    /* NB return ZERO when not converging > not mintable */
    // eslint-disable-next-line no-plusplus
    if (i++ > 100) {
      console.log('No solution');
      return [ZERO_BN, ZERO_BN];
    }

    const fyTokenToBuy = minFYToken.add(maxFYToken).div(2);
    // console.log('fyToken tobuy',  fyTokenToBuy.toFixed() )

    const sharesIn = mintWithBase(
      sharesReserves,
      fyTokenVirtualReserves,
      fyTokenRealReserves,
      toBn(fyTokenToBuy),
      timeTillMaturity,
      ts,
      g1,
      decimals,
      c,
      mu
    )[1];

    const surplus = shares_.sub(new Decimal(sharesIn.toString()));
    // console.log( 'min:',  minSurplus.toFixed() ,  'max:',   maxSurplus.toFixed() , 'surplus: ', surplus.toFixed() )

    // Just right
    if (minSurplus.lt(surplus) && surplus.lt(maxSurplus)) {
      // console.log('fyToken to buy: ', fyTokenToBuy.toFixed(), 'surplus: ', surplus.toFixed());
      return [toBn(fyTokenToBuy), toBn(surplus)];
    }

    // Bought too much, lower the max and the buy
    if (sharesIn.gt(shares) || surplus.lt(minSurplus)) {
      // console.log('Bought too much');
      maxFYToken = fyTokenToBuy;
    }

    // Bought too little, raise the min and the buy
    if (surplus.gt(maxSurplus)) {
      // console.log('Bought too little');
      minFYToken = fyTokenToBuy;
    }
  }
}

/**
 * Split a certain amount of X liquidity into its two components (eg. shares and fyToken)
 * @param { BigNumber } xReserves // eg. shares reserves
 * @param { BigNumber } yReserves // eg. fyToken reservers
 * @param {BigNumber} xAmount // amount to split in wei
 * @param {BigNumber} asBn
 * @returns  [ BigNumber, BigNumber ] returns an array of [shares, fyToken]
 */
export const splitLiquidity = (
  xReserves: BigNumber | string,
  yReserves: BigNumber | string,
  xAmount: BigNumber | string,
  asBn: boolean = true
): [BigNumberish, BigNumberish] => {
  const xReserves_ = new Decimal(xReserves.toString());
  const yReserves_ = new Decimal(yReserves.toString());
  const xAmount_ = new Decimal(xAmount.toString());
  const xPortion = xAmount_.mul(xReserves_).div(yReserves_.add(xReserves_));
  const yPortion = xAmount_.sub(xPortion);
  if (asBn) return [toBn(xPortion), toBn(yPortion)];
  return [xPortion.toFixed(), yPortion.toFixed()];
};

/**
 * Calculate Slippage
 * @param { BigNumber } value
 * @param { BigNumber } slippage optional: defaults to 0.005 (0.5%)
 * @param { boolean } minimise optional: whether the result should be a minimum or maximum (default max)
 * @returns { string } human readable string
 */
export const calculateSlippage = (
  value: BigNumber | string,
  slippage: BigNumber | string = '0.005',
  minimise: boolean = false
): string => {
  const value_ = new Decimal(value.toString());
  const _slippageAmount = floorDecimal(mulDecimal(value, slippage));
  if (minimise) {
    return value_.sub(_slippageAmount).toFixed();
  }
  return value_.add(_slippageAmount).toFixed();
};

/**
 * Calculate Annualised Yield Rate
 * @param { BigNumber | string } tradeValue // current [base]
 * @param { BigNumber | string } amount // y[base] amount at maturity
 * @param { number } maturity  // date of maturity
 * @param { number } fromDate // ***optional*** start date - defaults to now()
 * @returns { string | undefined } human readable string
 */
export const calculateAPR = (
  tradeValue: BigNumber | string,
  amount: BigNumber | string,
  maturity: number,
  fromDate: number = Math.round(new Date().getTime() / 1000) // if not provided, defaults to current time.
): string | undefined => {
  const tradeValue_ = new Decimal(tradeValue.toString());
  const amount_ = new Decimal(amount.toString());

  if (maturity > Math.round(new Date().getTime() / 1000)) {
    const secsToMaturity = maturity - fromDate;
    const propOfYear = new Decimal(secsToMaturity / SECONDS_PER_YEAR);
    const priceRatio = amount_.div(tradeValue_);
    const powRatio = ONE.div(propOfYear);
    const apr = priceRatio.pow(powRatio).sub(ONE);

    if (apr.gt(ZERO) && apr.lt(100)) {
      return apr.mul(100).toFixed();
    }
    return undefined;
  }
  return undefined;
};

/**
 * Calculates the collateralization ratio
 * based on the collat amount and value and debt value.
 * @param { BigNumber | string } collateralAmount  amount of collateral (in wei)
 * @param { BigNumber | string } basePrice bases per unit of collateral (in wei)
 * @param { BigNumber | string } baseAmount amount base debt (in wei)
 * @param {boolean} asPercent OPTIONAL: flag to return ratio as a percentage
 * @returns { number | undefined } // can be undefined because of 0 baseAmount as a denominator.
 */
export const calculateCollateralizationRatio = (
  collateralAmount: BigNumber | string,
  basePrice: BigNumber | string,
  baseAmount: BigNumber | string,
  asPercent: boolean = false // OPTIONAL:  flag to return as percentage
): number | undefined => {
  if (ethers.BigNumber.isBigNumber(baseAmount) ? baseAmount.isZero() : baseAmount === '0') {
    return undefined;
  }
  const _baseUnitPrice = divDecimal(basePrice, WAD_BN);
  const _baseVal = divDecimal(baseAmount, _baseUnitPrice); // base/debt value in terms of collateral
  const _ratio = divDecimal(collateralAmount, _baseVal); // collateralValue divide by debtValue

  if (asPercent) {
    return parseFloat(mulDecimal('100', _ratio));
  }
  return parseFloat(_ratio);
};

/**
 * Calculates the min collateralization ratio
 * based on the collat amount and value and debt value.
 * @param { BigNumber | string } basePrice bases per unit collateral (in wei)
 * @param { BigNumber | string } baseAmount amount of bases / debt (in wei)
 * @param {BigNumber | string} liquidationRatio  OPTIONAL: 1.5 (150%) as default
 * @param {BigNumber | string} existingCollateral  0 as default (as wei)
 * @param {Boolean} asBigNumber return as big number? in wei
 *
 * @returns BigNumber
 */
export const calculateMinCollateral = (
  basePrice: BigNumber | string,
  baseAmount: BigNumber | string,
  liquidationRatio: string,
  existingCollateral: BigNumber | string = '0' // OPTIONAL add in
): BigNumber => {
  const _baseUnitPrice = divDecimal(basePrice, WAD_BN);
  const _baseVal = divDecimal(baseAmount, _baseUnitPrice);
  const _existingCollateralValue = new Decimal(ethers.utils.formatUnits(existingCollateral, 18));
  const _minCollatValue = new Decimal(mulDecimal(_baseVal, liquidationRatio));
  const requiredCollateral = _existingCollateralValue.gt(_minCollatValue)
    ? new Decimal('0')
    : _minCollatValue.sub(_existingCollateralValue); // .add('1'); // hmm, i had to add one check

  return toBn(requiredCollateral);
};

/**
 * Calcualtes the amount (base, or other variant) that can be borrowed based on
 * an amount of collateral (ETH, or other), and collateral price.
 *
 * @param {BigNumber | string} collateralAmount amount of collateral
 * @param {BigNumber | string} collateralPrice price of unit collateral (in currency x)
 * @param {BigNumber | string} debtValue value of debt (in currency x)
 * @param {BigNumber | string} liquidationRatio  OPTIONAL: 1.5 (150%) as default
 *
 * @returns {string}
 */
export const calculateBorrowingPower = (
  collateralAmount: BigNumber | string,
  collateralPrice: BigNumber | string,
  debtValue: BigNumber | string,
  liquidationRatio: string = '1.5' // OPTIONAL: 150% as default
): string => {
  const collateralValue = mulDecimal(collateralAmount, collateralPrice);
  const maxSafeDebtValue_ = new Decimal(divDecimal(collateralValue, liquidationRatio));
  const debtValue_ = new Decimal(debtValue.toString());
  const _max = debtValue_.lt(maxSafeDebtValue_) ? maxSafeDebtValue_.sub(debtValue_) : new Decimal('0');
  return _max.toFixed(0);
};

/**
 * Calcualtes the amount (base, or other variant) that can be borrowed based on
 * an amount of collateral (ETH, or other), and collateral price.
 *
 * @param {string} collateralAmount amount of collateral in human readable decimals
 * @param {string} debtAmount amount of debt in human readable decimals
 * @param {number} liquidationRatio  OPTIONAL: 1.5 (150%) as default
 *
 * @returns {string}
 */
export const calcLiquidationPrice = (
  collateralAmount: string, //
  debtAmount: string,
  liquidationRatio: number
): string => {
  const _collateralAmount = parseFloat(collateralAmount);
  const _debtAmount = parseFloat(debtAmount);
  // condition/logic: collAmount*price > debtAmount*ratio
  const liquidationPoint = _debtAmount * liquidationRatio;
  const price = (liquidationPoint / _collateralAmount).toString();
  return price;
};

/**
 *  @param {BigNumber} sharesChange change in shares
 * @param {BigNumber} fyTokenChange change in fyToken
 * @param {BigNumber} poolSharesReserves pool shares reserves
 * @param {BigNumber} poolFyTokenReserves pool fyToken reserves
 * @param {BigNumber} poolTotalSupply pool total supply
 *
 * @returns {BigNumber[]} [newSharesReserves, newFyTokenRealReserves, newTotalSupply, newFyTokenVirtualReserves]
 */
export const newPoolState = (
  sharesChange: BigNumber,
  fyTokenChange: BigNumber,
  poolSharesReserves: BigNumber,
  poolFyTokenReserves: BigNumber,
  poolTotalSupply: BigNumber
): {
  sharesReserves: BigNumber;
  fyTokenRealReserves: BigNumber;
  totalSupply: BigNumber;
  fyTokenVirtualReserves: BigNumber;
} => {
  const newSharesReserves = poolSharesReserves.add(sharesChange);
  const newFyTokenReserves = poolFyTokenReserves.add(fyTokenChange);
  const newTotalSupply = poolTotalSupply.add(fyTokenChange);
  const newFyTokenRealReserves = newFyTokenReserves.sub(newTotalSupply); // real = virtual - totalSupply
  return {
    sharesReserves: newSharesReserves,
    fyTokenRealReserves: newFyTokenRealReserves,
    totalSupply: newTotalSupply,
    fyTokenVirtualReserves: newFyTokenReserves,
  };
};

/**
 *  @param {BigNumber | string} strategyTokenAmount
 * @param {BigNumber} strategyTotalSupply
 * @param {BigNumber} strategyPoolBalance
 * @param {BigNumber} poolSharesReserves
 * @param {BigNumber} poolFyTokenRealReserves
 * @param {BigNumber} poolTotalSupply
 * @param {BigNumber | string} poolTimeToMaturity
 * @param {BigNumber | string} ts
 * @param {BigNumber | string} g2
 * @param { number } decimals
 * @param {BigNumber | string} c
 * @param {BigNumber | string} mu
 *
 * @returns {BigNumber} [fyToken sold to shares, shares received]
 */
export const strategyTokenValue = (
  strategyTokenAmount: BigNumber | string,
  strategyTotalSupply: BigNumber,
  strategyPoolBalance: BigNumber,
  poolSharesReserves: BigNumber,
  poolFyTokenReserves: BigNumber,
  poolTotalSupply: BigNumber,
  poolTimeToMaturity: string | BigNumber,
  ts: BigNumber | string,
  g2: BigNumber | string,
  decimals: number,
  c: BigNumber | string = c_DEFAULT,
  mu: BigNumber | string = mu_DEFAULT
): [BigNumber, BigNumber] => {
  // 0. Calc amount of lpTokens from strat token burn
  // 1. calc amount shares/fyToken recieved from burn
  // 2. calculate new reserves (sharesReserves and fyTokenReserves)
  // 3. try to trade fyToken to shares with new reserves
  const lpReceived = burnFromStrategy(strategyPoolBalance, strategyTotalSupply!, strategyTokenAmount);
  const [_sharesReceived, _fyTokenReceived] = burn(
    poolSharesReserves,
    poolFyTokenReserves.sub(poolTotalSupply),
    poolTotalSupply,
    lpReceived
  );

  const newPool = newPoolState(
    _sharesReceived.mul(-1),
    _fyTokenReceived.mul(-1),
    poolSharesReserves,
    poolFyTokenReserves,
    poolTotalSupply
  );

  const fyTokenToShares = sellFYToken(
    newPool.sharesReserves,
    newPool.fyTokenVirtualReserves,
    _fyTokenReceived,
    poolTimeToMaturity.toString(),
    ts,
    g2,
    decimals,
    c,
    mu
  );

  return [fyTokenToShares, _sharesReceived];
};

/**
 * Calculates the estimated percentage of the pool given an inputted base amount.
 *
 * @param {BigNumber} input amount of base
 * @param {BigNumber} strategyTotalSupply strategy's total supply
 *
 * @returns {BigNumber}
 */
export const getPoolPercent = (input: BigNumber, strategyTotalSupply: BigNumber): string => {
  const input_ = new Decimal(input.toString());
  const totalSupply_ = new Decimal(strategyTotalSupply.toString());

  const ratio = input_.div(totalSupply_.add(input_));
  const percent = ratio.mul(new Decimal(100));

  return percent.toString();
};

/**
 * Calcualtes the MIN and MAX reserve ratios of a pool for a given slippage value
 *
 * @param {BigNumber} sharesReserves
 * @param {BigNumber} fyTokenRealReserves
 * @param {number} slippage
 *
 * @returns {[BigNumber, BigNumber] } [minRatio with slippage, maxRatio with slippage]
 */
export const calcPoolRatios = (
  sharesReserves: BigNumber,
  fyTokenRealReserves: BigNumber,
  slippage: number = 0.1
): [BigNumber, BigNumber] => {
  const sharesReserves_ = new Decimal(sharesReserves.toString());
  const fyTokenRealReserves_ = new Decimal(fyTokenRealReserves.toString());

  // use min/max values when real reserves are very close to (or) zero, due to difficulty estimating precise min/max ratios
  if (fyTokenRealReserves_.lte(ONE_DEC)) return [toBn(ZERO_DEC), toBn(MAX_DEC)];

  const slippage_ = new Decimal(slippage.toString());
  const wad = new Decimal(WAD_BN.toString());

  const ratio = sharesReserves_.div(fyTokenRealReserves_).mul(wad);
  const ratioSlippage = ratio.mul(slippage_);

  const min = toBn(ratio.sub(ratioSlippage));
  const max = toBn(ratio.add(ratioSlippage));

  return [min, max];
};

/**
 * Calculate accrued debt value after maturity
 *
 * @param {BigNumber} rate
 * @param {BigNumber} rateAtMaturity
 * @param {BigNumberr} debt
 *
 * @returns {[BigNumber, BigNumber]} accruedDebt, debt less accrued value
 */
export const calcAccruedDebt = (rate: BigNumber, rateAtMaturity: BigNumber, debt: BigNumber): BigNumber[] => {
  const rate_ = new Decimal(rate.toString());
  const rateAtMaturity_ = new Decimal(rateAtMaturity.toString());
  const debt_ = new Decimal(debt.toString());

  const accRatio_ = rate_.div(rateAtMaturity_);
  const invRatio_ = rateAtMaturity_.div(rate_); // to reverse calc the debt LESS the accrued value

  const accruedDebt = !accRatio_.isNaN() ? debt_.mul(accRatio_) : debt_;
  const debtLessAccrued = debt_.mul(invRatio_);

  return [toBn(accruedDebt), toBn(debtLessAccrued)];
};
