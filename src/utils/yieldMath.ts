import { ethers, BigNumber } from 'ethers';
import { Decimal } from 'decimal.js';
import { TransactionDescription } from 'ethers/lib/utils';

Decimal.set({ precision: 64 });

export const ZERO: Decimal = new Decimal(0);
export const ONE: Decimal = new Decimal(1);
export const TWO: Decimal = new Decimal(2);
export const SECONDS_PER_YEAR: number = (365 * 24 * 60 * 60);

export const k = new Decimal(1 / 126144000 ); // inv of seconds in 4 years
export const g1 = new Decimal(950 / 1000);
export const g2 = new Decimal(1000 / 950);
const precisionFee = new Decimal(1000000000000);

export function mint(
  daiReserves: BigNumber | string, 
  fyDaiReserves: BigNumber | string, 
  totalSupply: BigNumber | string, 
  dai: BigNumber | string
) : [ any, any ] {
  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const supply_ = new Decimal(totalSupply.toString());
  const dai_ = new Decimal(dai.toString());
  const m = (supply_.mul(dai_)).div(daiReserves_);
  const y = (fyDaiReserves_.mul(m)).div(supply_);
  return [ m, y ];
}

export function burn(
  daiReserves: BigNumber | string, 
  fyDaiReserves: BigNumber | string, 
  totalSupply: BigNumber | string, 
  lpTokens: BigNumber | string
): [any, any] {
  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const supply_ = new Decimal(totalSupply.toString());
  const lpTokens_ = new Decimal(lpTokens.toString());
  const z = (lpTokens_.mul(daiReserves_ )).div(supply_);
  const y = (lpTokens_.mul(fyDaiReserves_)).div(supply_);
  return [ z, y ];
}

export function sellDai(
  daiReserves: BigNumber | string, 
  fyDaiReserves: BigNumber | string, 
  dai: BigNumber | string, 
  timeTillMaturity: BigNumber | string,
  withNoFee: boolean = false // optional: default === false
): string {
  
  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const dai_ = new Decimal(dai.toString());
 
  const g = withNoFee? ONE : g1;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Zxa = (daiReserves_.add(dai_)).pow(a);
  const sum = (Za.add(Ya)).sub(Zxa);
  const y = fyDaiReserves_.sub( sum.pow(invA) ) ; 
  const yFee = y.sub(precisionFee);

  return yFee.toString();
}

export function sellFYDai(
  daiReserves: BigNumber | string, 
  fyDaiReserves: BigNumber | string, 
  fyDai: BigNumber | string, 
  timeTillMaturity: BigNumber | string,
  withNoFee: boolean = false // optional: default === false
): string {
  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const fyDai_ = new Decimal(fyDai.toString());

  const g = withNoFee? ONE : g2;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Yxa = (fyDaiReserves_.add(fyDai_)).pow(a);
  const sum = Za.add(Ya.sub(Yxa));
  const y = daiReserves_.sub(sum.pow(invA));
  const yFee = y.sub(precisionFee);

  return yFee.toString();
}

export function buyDai(
  daiReserves: BigNumber | string,
  fyDaiReserves: BigNumber | string,
  dai: BigNumber | string, 
  timeTillMaturity: BigNumber | string,
  withNoFee: boolean = false // optional: default === false
): string {

  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const dai_ = new Decimal(dai.toString());

  const g = withNoFee? ONE : g2;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Zxa = (daiReserves_.sub(dai_)).pow(a);
  const sum = (Za.add(Ya)).sub(Zxa);
  const y = (sum.pow(invA)).sub(fyDaiReserves_);
  const yFee = y.add(precisionFee);

  return yFee.toString();
}

export function buyFYDai(
  daiReserves: BigNumber | string, 
  fyDaiReserves: BigNumber | string, 
  fyDai: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  withNoFee: boolean = false // optional: default === false
): string {

  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const fyDai_ = new Decimal(fyDai.toString());

  const g = withNoFee? ONE : g1;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Yxa = (fyDaiReserves_.sub(fyDai_)).pow(a);
  const sum = Za.add( Ya.sub(Yxa));
  const y = (sum.pow(invA) ).sub(daiReserves_);
  const yFee = y.add(precisionFee);

  return yFee.toString();
}

export function getFee(
  daiReserves: BigNumber | string,
  fyDaiReserves: BigNumber | string,
  fyDai: BigNumber | string,
  timeTillMaturity: BigNumber | string
): string {
  let fee_: Decimal = ZERO;
  const fyDai_: BigNumber =  BigNumber.isBigNumber(fyDai) ? fyDai : BigNumber.from(fyDai);

  if (fyDai_.gte(ethers.constants.Zero)) {
    const daiWithFee: string = buyFYDai(daiReserves, fyDaiReserves, fyDai, timeTillMaturity);
    const daiWithoutFee: string = buyFYDai(daiReserves, fyDaiReserves, fyDai, timeTillMaturity, true);
    fee_ = (new Decimal(daiWithFee)).sub(new Decimal(daiWithoutFee)); 
  } else {
    const daiWithFee:string = sellFYDai(daiReserves, fyDaiReserves, fyDai_.mul(BigNumber.from('-1')), timeTillMaturity );
    const daiWithoutFee:string = sellFYDai(daiReserves, fyDaiReserves, fyDai_.mul(BigNumber.from('-1')), timeTillMaturity, true);
    fee_ = (new Decimal(daiWithoutFee)).sub(new Decimal(daiWithFee));
  }
  return fee_.toString();
}

export function fyDaiForMint(
  daiReserves: BigNumber |string,
  fyDaiRealReserves: BigNumber|string,
  fyDaiVirtualReserves: BigNumber|string,
  dai: BigNumber|string,
  timeTillMaturity: BigNumber|string,
): string {

  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiRealReserves_ = new Decimal(fyDaiRealReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const dai_ = new Decimal(dai.toString());

  let min = ZERO;
  let max = dai_;
  let yOut = Decimal.floor( (min.add(max)).div(TWO) ); 

  let i = 0;
  while ( true ) {
    
    const zIn = new Decimal( buyFYDai(daiReserves, fyDaiVirtualReserves, BigNumber.from(yOut.toFixed(0)), timeTillMaturity_.toString() ) );
    const Z_1 = daiReserves_.add(zIn); // New dai reserves
    const Y_1 = fyDaiRealReserves_.sub(yOut); // New fyDai reserves
    const pz = (dai_.sub(zIn)).div( (dai_.sub(zIn)).add(yOut) ); // dai proportion in my assets
    const PZ = Z_1.div(Z_1.add(Y_1)); // dai proportion in the reserves

    // The dai proportion in my assets needs to be higher than but very close to the dai proportion in the reserves, to make sure all the fyDai is used.
    if ( PZ.mul(new Decimal(1.000001)) <= pz ) min = yOut;
    yOut = (yOut.add(max)).div(TWO); // bought too little fyDai, buy some more
    
    if (pz <= PZ) max = yOut;
    yOut = (yOut.add(min)).div(TWO); // bought too much fyDai, buy a bit less
    if ( PZ.mul(new Decimal(1.000001)) > pz && pz > PZ) return Decimal.floor(yOut).toFixed(); // Just right
    
    // eslint-disable-next-line no-plusplus
    if (i++ > 10000) return Decimal.floor(yOut).toFixed();
  }
}

/**
   * Split a certain amount of X liquidity into its two componetnts (eg. Dai and fyDai) 
   * 
   * @param { BigNumber } xReserves // eg. Dai reserves
   * @param { BigNumber } yReserves // eg. fyDai reservers
   * @param {BigNumber} xAmount // amount to split in wei
   * 
   * @returns  [ BigNumber, BigNumber ] returns an array of [dai, fyDai] 
   */
export const splitLiquidity =(
  xReserves: BigNumber | string,
  yReserves: BigNumber | string,
  xAmount: BigNumber | string,
) : [string, string] => {

  const xReserves_ = new Decimal(xReserves.toString());
  const yReserves_ = new Decimal(yReserves.toString()); 
  const xAmount_ = new Decimal(xAmount.toString());

  const xPortion = ( xAmount_.mul(xReserves_) ).div( yReserves_.add(xReserves_) );
  
  const yPortion = xAmount_.sub(xPortion);
  return [ xPortion.toFixed(), yPortion.toFixed() ];
};

/**
   * Calculate amount of LP Tokens that will be minted  
   *
   * @param { BigNumber | string } xReserves // eg. dai balance of pool
   * @param { BigNumber  | string} yReserves// eg. yDai series balance of Pool
   * @param { BigNumber | string  } totalSupply // total LP tokens
   * @param { BigNumber | string } xInput // dai input value by user
   * 
   * @returns { string } number of tokens minted
   */
export const calcTokensMinted =(
  xReserves: BigNumber | string,
  yReserves: BigNumber | string,
  totalSupply: BigNumber| string,
  xInput: BigNumber | string,
) : string => {

  const xReserves_ = new Decimal(xReserves.toString());
  const _totalSupply = new Decimal(totalSupply.toString());
  const _yReserves = new Decimal(yReserves.toString());
  const _xInput = new Decimal(xInput.toString());

  const xOffered = (_xInput.mul(xReserves_)).div( _yReserves.add(xReserves_) );   
  // const [xOffered, ] =  splitLiquidity(xReserves, yReserves, xInput);

  return (_totalSupply).mul(xOffered).div(xReserves_).toString() ;
};

/**
   * Calculate Slippage 
   *
   * @param { BigNumber } value  
   * @param { BigNumber } slippage optional: defaults to 0.005 (0.5%)
   * @param { number } minimise optional: whether the resutl should be a minimum or maximum (default max)
   * 
   * @returns { string } human readable string
   */
export const calculateSlippage = (
  value: BigNumber | string, 
  slippage: BigNumber | string = '0.005', 
  minimise:boolean=false 
): string => {
  const value_ = new Decimal(value.toString());
  const _slippageAmount = floorDecimal( mulDecimal(value, slippage));
  if (minimise) {
    return value_.sub(_slippageAmount).toFixed();
  } 
  return value_.add(_slippageAmount).toFixed();
};

/**
   * Calculate Annualised Yield Rate
   *
   * @param { BigNumber | string } rate // current [Dai] price per unit y[Dai]
   * @param { BigNumber | string } amount // y[Dai] amount at maturity
   * @param { number } maturity  // date of maturity
   * @param { number } fromDate // ***optional*** start date - defaults to now()
   * 
   * @returns { string | undefined } human readable string
   */
export const calculateAPR =(
  tradeValue: BigNumber | string,
  amount: BigNumber | string,
  maturity: number,
  fromDate: number = (Math.round(new Date().getTime() / 1000)), // if not provided, defaults to current time.
): string | undefined => {

  const tradeValue_ = new Decimal(tradeValue.toString());
  const amount_ = new Decimal(amount.toString());

  if (
    maturity > Math.round(new Date().getTime() / 1000)
  ) {
    const secsToMaturity = maturity - fromDate;
    const propOfYear = new Decimal(secsToMaturity/SECONDS_PER_YEAR);
    const priceRatio = amount_.div(tradeValue_);
    const powRatio = ONE.div(propOfYear);
    const apr = (priceRatio.pow(powRatio)).sub(ONE);
    
    if(apr.gt(ZERO) && apr.lt(100)) {
      return apr.mul(100).toFixed();
    }
    return undefined;
  }
  return undefined;
};

/**
   * Calculates the collateralization ratio 
   * based on the collat amount and value and debt value.
   *
   * @param { BigNumber | string } collateralAmount  amount of collateral ( in wei)
   * @param { BigNumber | string } collateralPrice price of collateral (in USD)
   * @param { BigNumber | string } debtValue value of dai debt (in USD)
   * @param {boolean} asPercent OPTIONAL: flag to return ratio as a percentage
  
   * @returns { string | undefined }
   */
export const collateralizationRatio = ( 
  collateralAmount: BigNumber | string, 
  collateralPrice: BigNumber | string, 
  debtValue: BigNumber | string,
  asPercent: boolean = false // OPTIONAL:  flag to return as percentage
): string | undefined => {
  if (
    ethers.BigNumber.isBigNumber(debtValue) ? debtValue.isZero(): debtValue === '0' 
  ) {
    return undefined;
  }
  const _colVal = mulDecimal(collateralAmount, collateralPrice); 
  const _ratio = divDecimal(_colVal, debtValue);

  if ( asPercent ) {
    return mulDecimal('100', _ratio);
  }
  return _ratio;
};

/**
   * Calcualtes the amount (Dai, or other variant) that can be borrowed based on 
   * an amount of collateral (ETH, or other), and collateral price.
   *
   * @param {BigNumber | string} collateralAmount amount of collateral
   * @param {BigNumber | string} collateralPrice price of unit collateral (in currency x)
   * @param {BigNumber | string} debtValue value of debt (in currency x)
   * @param {BigNumber | string} liquidationRatio  OPTIONAL: 1.5 (150%) as default
   * 
   * @returns {string}
   */
export const borrowingPower = (
  collateralAmount: BigNumber | string,
  collateralPrice: BigNumber | string,
  debtValue: BigNumber | string,
  liquidationRatio: string = '1.5' // OPTIONAL: 150% as default
): string => {
  const collateralValue = mulDecimal(collateralAmount, collateralPrice );
  const maxSafeDebtValue_ = new Decimal(divDecimal(collateralValue, liquidationRatio));
  const debtValue_ = new Decimal(debtValue.toString());
  const _max = debtValue_.lt(maxSafeDebtValue_) ? maxSafeDebtValue_.sub(debtValue_) : new Decimal('0');
  return _max.toFixed(0);
};


export const secondsToFrom  = (
  to: BigNumber | string, 
  from: BigNumber | string = BigNumber.from( Math.round(new Date().getTime() / 1000)), // OPTIONAL: FROM defaults to current time if omitted
) : string => {

  const to_ = ethers.BigNumber.isBigNumber(to)? to : BigNumber.from(to);
  const from_ = ethers.BigNumber.isBigNumber(from)? from : BigNumber.from(from);

  return to_.sub(from_).toString();
};

enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

/* eg. Dai(X) Obtained from SELLING  USDC (Y) */
export const psmXOut = ( 
  y :BigNumber| string, // WAD precision
  tin: BigNumber| string,
  tradeType: TradeType = TradeType.SELL // TODO add in buy (instead of sell)
) : string => {
  const y_ = new Decimal(y.toString());
  const tin_ = new Decimal(tin.toString());
  const wad = new Decimal(1e18);
  return Decimal.floor( y_.mul(wad.sub(tin_)).div(wad) ).toFixed(); // usdc*(1-tin)
};

/* eg. USD (Y) Obtained from SELLING Dai (X) */ 
export const psmYOut = ( 
  x:BigNumber| string, // WAD precision
  tin: BigNumber| string,
  tradeType: TradeType = TradeType.SELL // TODO add in buy (instead of sell)
) : string => {

  const x_ = new Decimal(x.toString());
  const tin_ = new Decimal(tin.toString());
  const wad = new Decimal(1e18);
  return x_.div( wad.sub(tin_) ).toFixed(18); // dai/(1-tin)

};

/**
 * 
 * Math Support fns:
 * 
 * */

export const mulDecimal = (
  multiplicant: BigNumber | string, 
  multiplier: BigNumber | string, 
  precisionDifference: string = '1',  // Difference between multiplicant and mulitplier precision (eg. wei vs ray '1e-27' )
): string => {
  const multiplicant_ = new Decimal(multiplicant.toString());
  const multiplier_ = new Decimal(multiplier.toString());
  const _preDif = new Decimal(precisionDifference.toString());
  const _normalisedMul =  multiplier_.mul(_preDif); 
  return multiplicant_.mul(_normalisedMul).toFixed();
};

export const divDecimal = (
  numerator:BigNumber | string, 
  divisor:BigNumber | string,
  precisionDifference: string = '1', // Difference between multiplicant and mulitplier precision (eg. wei vs ray '1e-27' )
): string => {
  const numerator_ = new Decimal(numerator.toString());
  const divisor_ = new Decimal(divisor.toString());
  const _preDif = new Decimal(precisionDifference.toString());
  const _normalisedDiv =  divisor_.mul(_preDif); 
  return numerator_.div(_normalisedDiv).toFixed();
};

export const floorDecimal = (val: BigNumber | string): string => {
  return Decimal.floor(val.toString()).toFixed();
};
