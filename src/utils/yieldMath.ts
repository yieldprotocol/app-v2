import { ethers, BigNumber, BigNumberish } from 'ethers';
import { Decimal } from 'decimal.js';

Decimal.set({ precision: 64 });

/* constants exposed for export */
export const ZERO_DEC: Decimal = new Decimal(0);
export const ONE_DEC: Decimal = new Decimal(1);
export const TWO_DEC: Decimal = new Decimal(2);
export const SECONDS_PER_YEAR: number = 365 * 24 * 60 * 60;

/* locally used constants */
const ZERO = ZERO_DEC;
const ONE = ONE_DEC;
const TWO = TWO_DEC;
const k = new Decimal(1 / 126144000); // inv of seconds in 4 years
const g1 = new Decimal(950 / 1000);
const g2 = new Decimal(1000 / 950);
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
  BigNumber.from(x.toString() + '0'.repeat(18 - decimals));

/**
 * Convert a decimal18 to a bn of any decimal
 * @param x 18 decimal to reduce
 * @param decimals required
 * @returns BigNumber
 */
export const decimal18ToDecimalN = (x: BigNumber, decimals: number): BigNumber => {
  const str = x.toString();
  const first = str.slice(0, str.length - (18 - decimals));
  return BigNumber.from(first);
};

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

/** *************************
 YieldSpace functions
 *************************** */

/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } base
 * @returns {[BigNumber, BigNumber]}
 *
 * https://www.desmos.com/calculator/mllhtohxfx
 */
export function mint(
  baseReserves: BigNumber | string,
  fyTokenReserves: BigNumber | string,
  totalSupply: BigNumber | string,
  base: BigNumber | string
): [BigNumber, BigNumber] {
  const baseReserves_ = new Decimal(baseReserves.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves.toString());
  const supply_ = new Decimal(totalSupply.toString());
  const base_ = new Decimal(base.toString());
  const m = supply_.mul(base_).div(baseReserves_);
  const y = fyTokenReserves_.mul(m).div(supply_);
  return [toBn(m), toBn(y)];
}

/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } lpTokens
 * @returns {[BigNumber, BigNumber]}
 *
 * https://www.desmos.com/calculator/ubsalzunpo
 */
export function burn(
  baseReserves: BigNumber | string,
  fyTokenReserves: BigNumber | string,
  totalSupply: BigNumber | string,
  lpTokens: BigNumber | string
): [BigNumber, BigNumber] {
  const Z = new Decimal(baseReserves.toString());
  const Y = new Decimal(fyTokenReserves.toString());
  const S = new Decimal(totalSupply.toString());
  const x = new Decimal(lpTokens.toString());
  const z = x.mul(Z).div(S);
  const y = x.mul(Y).div(S);
  return [toBn(z), toBn(y)];
}

/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReservesVirtual
 * @param { BigNumber | string } fyTokenReservesReal
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } fyToken
 * @param { BigNumber | string } timeTillMaturity
 *  @param { number } decimals
 *
 * @returns {[BigNumber, BigNumber]}
 */
export function mintWithBase(
  baseReserves: BigNumber | string,
  fyTokenReservesVirtual: BigNumber | string,
  fyTokenReservesReal: BigNumber | string,
  supply: BigNumber | string,
  fyToken: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  decimals: number = 18
): [BigNumber, BigNumber] {
  const Z = new Decimal(baseReserves.toString());
  const YR = new Decimal(fyTokenReservesReal.toString());
  const S = new Decimal(supply.toString());
  const y = new Decimal(fyToken.toString());
  // buyFyToken:
  const z1 = new Decimal(
    buyFYToken(baseReserves, fyTokenReservesVirtual, fyToken, timeTillMaturity, decimals).toString()
  );
  // Mint specifying how much fyToken to take in. Reverse of `mint`.
  const m = S.mul(y).div(YR.sub(y));
  const z2 = Z.add(z1).mul(m).div(S);
  return [toBn(m), toBn(z1.add(z2))];
}

/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReservesVirtual
 * @param { BigNumber | string } fyTokenReservesReal
 * @param { BigNumber | string } totalSupply
 * @param { BigNumber | string } lpTokens
 * @param { BigNumber | string } timeTillMaturity
 *
 *  @param { number } decimals
 * @returns { BigNumber }
 */
export function burnForBase(
  baseReserves: BigNumber,
  fyTokenReservesVirtual: BigNumber,
  fyTokenReservesReal: BigNumber,
  supply: BigNumber,
  lpTokens: BigNumber,
  timeTillMaturity: BigNumber,
  decimals: number = 18
): BigNumber {
  // Burn FyToken
  const [z1, y] = burn(baseReserves, fyTokenReservesReal, supply, lpTokens);
  // Sell FyToken for base
  const z2 = sellFYToken(baseReserves, fyTokenReservesVirtual, y, timeTillMaturity, decimals);
  const z1D = new Decimal(z1.toString());
  const z2D = new Decimal(z2.toString());
  return toBn(z1D.add(z2D));
}

/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } base
 * @param { BigNumber | string } timeTillMaturity
 * @param { boolean } withNoFee
 * @returns { BigNumber }
 */
export function sellBase(
  baseReserves: BigNumber | string,
  fyTokenReserves: BigNumber | string,
  base: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  decimals: number = 18, // optional : default === 18
  withNoFee: boolean = false // optional: default === false
): BigNumber {
  /* convert to 18 decimals, if required */
  const baseReserves18 = decimalNToDecimal18(BigNumber.from(baseReserves), decimals);
  const fyTokenReserves18 = decimalNToDecimal18(BigNumber.from(fyTokenReserves), decimals);
  const base18 = decimalNToDecimal18(BigNumber.from(base), decimals);

  const baseReserves_ = new Decimal(baseReserves18.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves18.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const base_ = new Decimal(base18.toString());

  const g = withNoFee ? ONE : g1;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub(g.mul(t));
  const invA = ONE.div(a);

  const Za = baseReserves_.pow(a);
  const Ya = fyTokenReserves_.pow(a);
  const Zxa = baseReserves_.add(base_).pow(a);
  const sum = Za.add(Ya).sub(Zxa);
  const y = fyTokenReserves_.sub(sum.pow(invA));

  const yFee = y.sub(precisionFee);

  // return yFee.isNaN() ? ethers.constants.Zero : toBn(yFee);
  return yFee.isNaN() ? ethers.constants.Zero : decimal18ToDecimalN(toBn(yFee), decimals);
}

/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } fyToken
 * @param { BigNumber | string } timeTillMaturity
 * @param { boolean } withNoFee
 * @returns { BigNumber }
 */
export function sellFYToken(
  baseReserves: BigNumber | string,
  fyTokenReserves: BigNumber | string,
  fyToken: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  decimals: number = 18, // optional : default === 18
  withNoFee: boolean = false // optional: default === false
): BigNumber {
  /* convert to 18 decimals, if required */
  const baseReserves18 = decimalNToDecimal18(BigNumber.from(baseReserves), decimals);
  const fyTokenReserves18 = decimalNToDecimal18(BigNumber.from(fyTokenReserves), decimals);
  const fyToken18 = decimalNToDecimal18(BigNumber.from(fyToken), decimals);

  const baseReserves_ = new Decimal(baseReserves18.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves18.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const fyDai_ = new Decimal(fyToken18.toString());

  const g = withNoFee ? ONE : g2;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub(g.mul(t));
  const invA = ONE.div(a);

  const Za = baseReserves_.pow(a);
  const Ya = fyTokenReserves_.pow(a);
  const Yxa = fyTokenReserves_.add(fyDai_).pow(a);
  const sum = Za.add(Ya.sub(Yxa));
  const y = baseReserves_.sub(sum.pow(invA));

  const yFee = y.sub(precisionFee);

  // return yFee.isNaN() ? ethers.constants.Zero : toBn(yFee);
  return yFee.isNaN() ? ethers.constants.Zero : decimal18ToDecimalN(toBn(yFee), decimals);
}

/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } base
 * @param { BigNumber | string } timeTillMaturity
 * @param { boolean } withNoFee
 * @returns { BigNumber }
 */
export function buyBase(
  baseReserves: BigNumber | string,
  fyTokenReserves: BigNumber | string,
  base: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  decimals: number = 18, // optional : default === 18
  withNoFee: boolean = false // optional: default === false
): BigNumber {
  /* convert to 18 decimals, if required */
  const baseReserves18 = decimalNToDecimal18(BigNumber.from(baseReserves), decimals);
  const fyTokenReserves18 = decimalNToDecimal18(BigNumber.from(fyTokenReserves), decimals);
  const base18 = decimalNToDecimal18(BigNumber.from(base), decimals);

  const baseReserves_ = new Decimal(baseReserves18.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves18.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const base_ = new Decimal(base18.toString());

  const g = withNoFee ? ONE : g2;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub(g.mul(t));
  const invA = ONE.div(a);

  const Za = baseReserves_.pow(a);
  const Ya = fyTokenReserves_.pow(a);
  const Zxa = baseReserves_.sub(base_).pow(a);
  const sum = Za.add(Ya).sub(Zxa);
  const y = sum.pow(invA).sub(fyTokenReserves_);

  const yFee = y.add(precisionFee);

  return yFee.isNaN() ? ethers.constants.Zero : decimal18ToDecimalN(toBn(yFee), decimals);
}

/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } fyToken
 * @param { BigNumber | string } timeTillMaturity
 * @param { boolean } withNoFee
 * @returns { BigNumber }
 */
// NOT USED YET
export function buyFYToken(
  baseReserves: BigNumber | string,
  fyTokenReserves: BigNumber | string,
  fyToken: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  decimals: number = 18, // optional : default === 18
  withNoFee: boolean = false // optional: default === false
): BigNumber {
  /* convert to 18 decimals, if required */
  const baseReserves18 = decimalNToDecimal18(BigNumber.from(baseReserves), decimals);
  const fyTokenReserves18 = decimalNToDecimal18(BigNumber.from(fyTokenReserves), decimals);
  const fyToken18 = decimalNToDecimal18(BigNumber.from(fyToken), decimals);

  const baseReserves_ = new Decimal(baseReserves18.toString());
  const fyTokenReserves_ = new Decimal(fyTokenReserves18.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const fyDai_ = new Decimal(fyToken18.toString());

  const g = withNoFee ? ONE : g1;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub(g.mul(t));
  const invA = ONE.div(a);

  const Za = baseReserves_.pow(a);
  const Ya = fyTokenReserves_.pow(a);
  const Yxa = fyTokenReserves_.sub(fyDai_).pow(a);
  const sum = Za.add(Ya.sub(Yxa));
  const y = sum.pow(invA).sub(baseReserves_);

  const yFee = y.add(precisionFee);

  // return yFee.isNaN() ? ethers.constants.Zero : toBn(yFee);

  return yFee.isNaN() ? ethers.constants.Zero : decimal18ToDecimalN(toBn(yFee), decimals);
}

/**
 * @param { BigNumber | string } baseReserves
 * @param { BigNumber | string } fyTokenReserves
 * @param { BigNumber | string } fyToken
 * @param { BigNumber | string } timeTillMaturity
 * @returns { BigNumber }
 */
export function getFee(
  baseReserves: BigNumber | string,
  fyTokenReserves: BigNumber | string,
  fyToken: BigNumber | string,
  timeTillMaturity: BigNumber | string
): BigNumber {
  let fee_: Decimal = ZERO;
  const fyToken_: BigNumber = BigNumber.isBigNumber(fyToken) ? fyToken : BigNumber.from(fyToken);

  if (fyToken_.gte(ethers.constants.Zero)) {
    const tokenWithFee: BigNumber = buyFYToken(baseReserves, fyTokenReserves, fyToken, timeTillMaturity);
    const tokenWithoutFee: BigNumber = buyFYToken(baseReserves, fyTokenReserves, fyToken, timeTillMaturity, 18, true);
    fee_ = new Decimal(tokenWithFee.toString()).sub(new Decimal(tokenWithoutFee.toString()));
  } else {
    const tokenWithFee: BigNumber = sellFYToken(
      baseReserves,
      fyTokenReserves,
      fyToken_.mul(BigNumber.from('-1')),
      timeTillMaturity
    );
    const tokenWithoutFee: BigNumber = sellFYToken(
      baseReserves,
      fyTokenReserves,
      fyToken_.mul(BigNumber.from('-1')),
      timeTillMaturity,
      18,
      true
    );
    fee_ = new Decimal(tokenWithoutFee.toString()).sub(new Decimal(tokenWithFee.toString()));
  }
  return toBn(fee_);
}

export function fyTokenForMint(
  baseReserves: BigNumber | string,
  fyTokenRealReserves: BigNumber | string,
  fyTokenVirtualReserves: BigNumber | string,
  base: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  decimals: number = 18
): string {
  const baseReserves_ = new Decimal(baseReserves.toString());
  const fyDaiRealReserves_ = new Decimal(fyTokenRealReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const base_ = new Decimal(base.toString());

  let min = ZERO;
  let max = base_;
  let yOut = Decimal.floor(min.add(max).div(TWO));

  let i = 0;
  while (true) {
    const zIn = new Decimal(
      buyFYToken(
        baseReserves,
        fyTokenVirtualReserves,
        BigNumber.from(yOut.toFixed(0)),
        timeTillMaturity_.toString(),
        decimals
      ).toString()
    );
    const Z_1 = baseReserves_.add(zIn); // New base reserves
    const Y_1 = fyDaiRealReserves_.sub(yOut); // New fyToken reserves
    const pz = base_.sub(zIn).div(base_.sub(zIn).add(yOut)); // base proportion in my assets
    const PZ = Z_1.div(Z_1.add(Y_1)); // base proportion in the reserves

    // The base proportion in my assets needs to be higher than but very close to the base proportion in the reserves, to make sure all the fyToken is used.
    if (PZ.mul(new Decimal(1.000001)) <= pz) min = yOut;
    yOut = yOut.add(max).div(TWO); // bought too little fyToken, buy some more

    if (pz <= PZ) max = yOut;
    yOut = yOut.add(min).div(TWO); // bought too much fyToken, buy a bit less
    if (PZ.mul(new Decimal(1.000001)) > pz && pz > PZ) return Decimal.floor(yOut).toFixed(); // Just right

    // eslint-disable-next-line no-plusplus
    if (i++ > 10000) return Decimal.floor(yOut).toFixed();
  }
}

/**
 * Split a certain amount of X liquidity into its two components (eg. base and fyToken)
 * @param { BigNumber } xReserves // eg. base reserves
 * @param { BigNumber } yReserves // eg. fyToken reservers
 * @param {BigNumber} xAmount // amount to split in wei
 * @returns  [ BigNumber, BigNumber ] returns an array of [base, fyToken]
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
 * @param { boolean } minimise optional: whether the resutl should be a minimum or maximum (default max)
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
 * @returns { string | undefined }
 */
export const calculateCollateralizationRatio = (
  collateralAmount: BigNumber | string,
  basePrice: BigNumber | string,
  baseAmount: BigNumber | string,
  asPercent: boolean = false // OPTIONAL:  flag to return as percentage
): string | undefined => {
  if (ethers.BigNumber.isBigNumber(baseAmount) ? baseAmount.isZero() : baseAmount === '0') {
    return undefined;
  }

  const _baseUnitPrice = divDecimal(basePrice, '1000000000000000000');
  const _baseVal = divDecimal(baseAmount, _baseUnitPrice); // base/debt value in terms of collateral
  const _ratio = divDecimal(collateralAmount, _baseVal); // collateralValue divide by debtValue

  if (asPercent) {
    return mulDecimal('100', _ratio);
  }
  return _ratio;
};

/**
 * Calculates the collateralization ratio
 * based on the collat amount and value and debt value.
 * @param { BigNumber | string } basePrice bases per unit collateral (in wei)
 * @param { BigNumber | string } baseAmount amount of bases / debt (in wei)
 * @param {BigNumber | string} liquidationRatio  OPTIONAL: 1.5 (150%) as default
 * @param {BigNumber | string} existingCollateral  0 as default (as wei)
 * @param {Boolean} asBigNumber return as big number? in wei
 *
 * @returns { string | undefined }
 */
export const calculateMinCollateral = (
  basePrice: BigNumber | string,
  baseAmount: BigNumber | string,
  liquidationRatio: string = '1.5', // OPTIONAL: 150% as default
  existingCollateral: BigNumber | string = '0', // OPTIONAL add in
  asBigNumber: boolean = false
): string | BigNumber => {
  const _baseUnitPrice = divDecimal(basePrice, '1000000000000000000');
  const _baseVal = divDecimal(baseAmount, _baseUnitPrice);
  const _existingCollateralValue = new Decimal(ethers.utils.formatUnits(existingCollateral, 18));
  const _minCollatValue = new Decimal(mulDecimal(_baseVal, liquidationRatio));
  const requiredCollateral = _existingCollateralValue.gt(_minCollatValue)
    ? new Decimal('0')
    : _minCollatValue.sub(_existingCollateralValue).add('1'); // hmm, i had to add one check
  return asBigNumber ? toBn(requiredCollateral) : requiredCollateral.toFixed(0);
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
