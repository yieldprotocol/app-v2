import { format, getMonth, subDays } from 'date-fns';
import { BigNumber, BigNumberish, ethers } from 'ethers';
import Identicon, { IdenticonOptions } from 'identicon.js';
import { ActionCodes } from '../types';

export const copyToClipboard = (str: string) => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

/**
 * Convert bytesX to bytes32 (BigEndian?)
 * @param x string to convert.
 * @param n current bytes value eg. bytes6 or bytes12
 * @returns string bytes32
 */
export function bytesToBytes32(x: string, n: number): string {
  return x + '00'.repeat(32 - n);
}

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
export const decimal18ToDecimalN = (x: BigNumber, decimals: number): BigNumber =>
  BigNumber.from(x.toString().substring(0, 18 - decimals));

/**
 * Convert array to chunks of arrays with size n
 * @param a any array
 * @param size chunk size
 * @returns array of any[]
 */
export const chunkArray = (a: any[], size: number) =>
  Array.from(new Array(Math.ceil(a.length / size)), (_, i) => a.slice(i * size, i * size + size));

/* log to console + any extra action required, extracted  */
export const toLog = (message: string, type: string = 'info') => {
  // eslint-disable-next-line no-console
  console.log(message);
};

/* creates internal tracking code of a transaction type */
export const getTxCode = (txType: ActionCodes, vaultOrSeriesId: string | null) => `${txType}_${vaultOrSeriesId}`;

// /* google analytics log event */
// export const analyticsLogEvent = (eventName: string, eventParams: any ) => {
//   if (eventName) {
//     try {
//     window?.gtag('event', eventName, eventParams);
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.log(e);
//     }
//   }
// };

// TODO make it change based on hemisphere ( ie swap winter and summer)
export enum SeasonType {
  WINTER = 'WINTER',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL',
}
export const getSeason = (dateInSecs: number): SeasonType => {
  const month: number = getMonth(new Date(dateInSecs * 1000));
  const seasons = [
    SeasonType.WINTER,
    SeasonType.WINTER,
    SeasonType.SPRING,
    SeasonType.SPRING,
    SeasonType.SPRING,
    SeasonType.SUMMER,
    SeasonType.SUMMER,
    SeasonType.SUMMER,
    SeasonType.FALL,
    SeasonType.FALL,
    SeasonType.FALL,
    SeasonType.WINTER,
  ];
  return seasons[month];
};

/* Trunctate a string value to a certain number of 'decimal' point */
export const cleanValue = (input: string | undefined, decimals: number = 18) => {
  const re = new RegExp(`(\\d+\\.\\d{${decimals}})(\\d)`);
  if (input !== undefined) {
    const inpu = input?.match(re); // inpu = truncated 'input'... get it?
    if (inpu) {
      return inpu[1];
    }
    return input?.valueOf();
  }
  return '0.0';
};

/* handle Address/hash shortening */
export const abbreviateHash = (addr: string, buffer: number = 4) =>
  `${addr?.substring(0, buffer)}...${addr?.substring(addr.length - buffer)}`;

/**
 *
 * Generate the series name from the maturity number.
 * Examples: full (defualt) : 'MMMM yyyy' ,  apr badge  : 'MMM yy' , mobile: 'MMM yyyy'
 * NOTE: subtraction used to accuount for time zone differences
 * */
export const nameFromMaturity = (maturity: number, style: string = 'MMMM yyyy') =>
  format(subDays(new Date(maturity * 1000), 2), style);

export const genVaultImage = (id: string) => {
  const options = {
    foreground: [0, 0, 255, 255], // rgba black
    background: [255, 255, 255, 255], // rgba white
    margin: 0.2, // 20% margin
    size: 16,
    format: 'svg', // use SVG instead of PNG
  } as IdenticonOptions;
  const data = new Identicon(id, options).toString();
  return `data:image/svg+xml;base64,${data}`;
};

/**
 * Number formatting if reqd.
 * */
export const nFormatter = (num: number, digits: number) => {
  const si = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, '$1') + si[i].symbol;
};

/**
 * Color functions
 * */
export const modColor = (color: any, amount: any) => {
  let c;
  let cT;
  if (color.length === 9 || color.length === 8) {
    c = color.substring(0, color.length - 2);
    cT = color.slice(-2);
  } else {
    c = color;
    cT = 'FF';
  }
  // eslint-disable-next-line prefer-template
  return `#${c
    .replace(/^#/, '')
    .replace(/../g, (col: any) =>
      `0${Math.min(255, Math.max(0, parseInt(col, 16) + amount)).toString(16)}`.substr(-2)
    )}${cT}`;
};

export const contrastColor = (hex: any) => {
  const hex_ = hex.slice(1);
  if (hex_.length !== 6) {
    throw new Error('Invalid HEX color.');
  }
  const r = parseInt(hex_.slice(0, 2), 16);
  const g = parseInt(hex_.slice(2, 4), 16);
  const b = parseInt(hex_.slice(4, 6), 16);

  return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? 'brand' : 'brand-light';
};

export const invertColor = (hex: any) => {
  function padZero(str: string) {
    const zeros = new Array(2).join('0');
    return (zeros + str).slice(-2);
  }
  const hex_ = hex.slice(1);
  if (hex_.length !== 6) {
    throw new Error('Invalid HEX color.');
  }
  const r = (255 - parseInt(hex_.slice(0, 2), 16)).toString(16);
  const g = (255 - parseInt(hex_.slice(2, 4), 16)).toString(16);
  const b = (255 - parseInt(hex_.slice(4, 6), 16)).toString(16);
  // pad each with zeros and return
  return `#${padZero(r)}${padZero(g)}${padZero(b)}`;
};

export const buildGradient = (colorFrom: string, colorTo: string) => `linear-gradient(to bottom right,
      ${modColor(colorFrom || '#add8e6', -50)}, 
      ${modColor(colorFrom || '#add8e6', 0)},
      ${modColor(colorFrom || '#add8e6', 0)},
      ${modColor(colorTo, 50)},
      ${modColor(colorTo, 50)}, 
      ${modColor(colorTo, 50)},
      ${modColor(colorTo, 25)}, 
      ${modColor(colorTo, 0)}, 
      ${modColor(colorTo, 0)})
    `;

export const getPositionPathPrefix = (txCode: string) => {
  const action = txCode.split('_')[0];
  switch (action) {
    // BORROW
    case ActionCodes.BORROW:
    case ActionCodes.REMOVE_COLLATERAL:
    case ActionCodes.REPAY:
    case ActionCodes.ROLL_DEBT:
    case ActionCodes.TRANSFER_VAULT:
    case ActionCodes.MERGE_VAULT:
      return 'vaultposition';
    // LEND
    case ActionCodes.LEND:
    case ActionCodes.CLOSE_POSITION:
    case ActionCodes.ROLL_POSITION:
    case ActionCodes.REDEEM:
      return 'lendposition';
    // POOL
    case ActionCodes.ADD_LIQUIDITY:
    case ActionCodes.REMOVE_LIQUIDITY:
    case ActionCodes.ROLL_LIQUIDITY:
      return 'poolposition';

    default:
      return `${action.toLowerCase()}position`;
  }
};

export const getVaultIdFromReceipt = (receipt: any, contractMap: any) => {
  const cauldronAddr = contractMap.get('Cauldron').address;
  const vaultIdHex = receipt.events.filter((e: any) => e.address === cauldronAddr)[0].topics[1];
  return vaultIdHex.slice(0, 26);
};
