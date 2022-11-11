import { format, getMonth, subDays } from 'date-fns';
import { ContractReceipt } from 'ethers';
import { uniqueNamesGenerator, Config, adjectives, animals } from 'unique-names-generator';

import { ActionCodes, ISeries } from '../types';

export const copyToClipboard = (str: string) => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

export const clearCachedItems = (keys: string[]) => {
  if (keys.length > 0) {
    keys.forEach((k: string) => {
      window.localStorage.removeItem(k);
    });
  } else window.localStorage.clear();
};

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
export const getTxCode = (txType: ActionCodes, SeriesId: string | null) => `${txType}_${SeriesId}`;

export const generateVaultName = (id: string) => {
  const vaultNameConfig: Config = {
    dictionaries: [adjectives, animals],
    separator: ' ',
    length: 2,
  };
  return uniqueNamesGenerator({ seed: parseInt(id.substring(14), 16), ...vaultNameConfig });
};

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
    const input_ = input![0] === '.' ? '0'.concat(input!) : input;
    const inpu = input_?.match(re); // inpu = truncated 'input'... get it?
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

export const getPositionPath = (txCode: string, receipt: any, contractMap?: any, seriesMap?: any) => {
  const action = txCode.split('_')[0];
  const positionId = txCode.split('_')[1];

  switch (action) {
    // BORROW
    case ActionCodes.BORROW:
    case ActionCodes.ADD_COLLATERAL:
    case ActionCodes.REMOVE_COLLATERAL:
    case ActionCodes.REPAY:
    case ActionCodes.ROLL_DEBT:
    case ActionCodes.TRANSFER_VAULT:
    case ActionCodes.MERGE_VAULT:
      return `/vaultposition/${getVaultIdFromReceipt(receipt, contractMap)}`;
    // LEND
    case ActionCodes.LEND:
    case ActionCodes.CLOSE_POSITION:
    case ActionCodes.REDEEM:
      return `/lendposition/${positionId}`;
    case ActionCodes.ROLL_POSITION:
      return `/lendposition/${getSeriesAfterRollPosition(receipt, seriesMap)}`;
    // POOL
    case ActionCodes.ADD_LIQUIDITY:
    case ActionCodes.REMOVE_LIQUIDITY:
    case ActionCodes.ROLL_LIQUIDITY:
      return `/poolposition/${getStrategyAddrFromReceipt(receipt, action)}`;

    default:
      return '/';
  }
};

export const getVaultIdFromReceipt = (receipt: any, contractMap: any) => {
  if (!receipt) return '';
  const cauldronAddr = contractMap?.get('Cauldron')?.address!;
  const vaultIdHex = receipt.events.filter((e: any) => e.address === cauldronAddr)[0]?.topics[1]!;
  return vaultIdHex?.slice(0, 26) || '';
};

export const getSeriesAfterRollPosition = (receipt: ContractReceipt | undefined, seriesMap: Map<string, ISeries>) => {
  if (!receipt) return '';
  const poolAddress = receipt.events![10].address;
  const series = [...seriesMap.values()].find((s) => s.poolAddress === poolAddress);
  return series?.id! || '';
};

export const getStrategyAddrFromReceipt = (receipt: ContractReceipt | undefined, action: ActionCodes) => {
  if (!receipt) return '';
  return action === ActionCodes.ADD_LIQUIDITY ? receipt.events![15]?.address! : receipt.events![0]?.address!;
};

export const formatStrategyName = (name: string) => {
  const name_ = name ? `${name.slice(15, 22)} Strategy` : '';
  return `${name_}`;
};

export const getStrategySymbol = (name: string) => name.slice(2).slice(0, -2);
export const numberWithCommas = (x: number) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const formatValue = (x: string | number, decimals: number) =>
  numberWithCommas(Number(cleanValue(x?.toString(), decimals)));
