import { format, getMonth, subDays } from 'date-fns';
import { BigNumber, ethers } from 'ethers';
import { uniqueNamesGenerator, Config, adjectives, animals } from 'unique-names-generator';

import { ActionCodes, ISeries, IStrategy, IStrategyRoot } from '../types';
import { SECONDS_PER_YEAR } from './constants';
import { burnFromStrategy, calculateAPR, strategyTokenValue } from './yieldMath';

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
export const getTxCode = (txType: ActionCodes, vaultOrSeriesId: string | null) => `${txType}_${vaultOrSeriesId}`;

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
      return `/poolposition/${positionId}`;

    default:
      return '/';
  }
};

export const getVaultIdFromReceipt = (receipt: any, contractMap: any) => {
  if (!receipt) return '';
  const cauldronAddr = contractMap?.get('Cauldron')?.address!;
  const vaultIdHex = receipt.events?.filter((e: any) => e.address === cauldronAddr)[0]?.topics[1]!;
  return vaultIdHex?.slice(0, 26) || '';
};

export const getSeriesAfterRollPosition = (receipt: any, seriesMap: any) => {
  if (!receipt) return '';
  const contractAddress = receipt.events[7]?.address!;
  const series = [...seriesMap.values()].filter((s) => s.address === contractAddress)[0];
  return series?.id! || '';
};

export const formatStrategyName = (name: string) => {
  const name_ = name.toLowerCase();
  const timeFrame = name_.slice(-2) === 'q2' ? '3 Month' : '6 Month';
  return `${timeFrame}`;
};

export const getStrategySymbol = (name: string) => name.slice(2).slice(0, -2);

export const numberWithCommas = (x: number) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const formatValue = (x: string | number, decimals: number) =>
  numberWithCommas(Number(cleanValue(x?.toString(), decimals)));

/* google analytics log event */
export const analyticsLogEvent = (eventName: string, eventParams: any, chainId: number) => {
  if (eventName && chainId === 1) {
    try {
      window?.gtag('event', eventName, eventParams);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
};

export const getStrategyBaseValuePerShare = async (
  strategy: IStrategyRoot,
  currStrategySeries: ISeries,
  blockNum: number
) => {
  try {
    const { poolContract } = currStrategySeries as ISeries;
    const [[base, fyTokenVirtual], poolTotalSupply, strategyTotalSupply, decimals, fyTokenToBaseCostEstimate] =
      await Promise.all([
        await poolContract.getCache({ blockTag: blockNum }),
        await poolContract.totalSupply({ blockTag: blockNum }),
        await strategy.strategyContract.totalSupply({ blockTag: blockNum }),
        await poolContract.decimals({ blockTag: blockNum }),
        await poolContract.sellFYTokenPreview(ethers.utils.parseUnits('1', currStrategySeries.decimals), {
          blockTag: blockNum,
        }), // estimate the base value of 1 fyToken unit
      ]);

    // the real balance of fyTokens in the pool
    const fyTokenReal = fyTokenVirtual.sub(poolTotalSupply);

    // the estimated base value of all fyToken in the pool
    const fyTokenToBaseValueEstimate = fyTokenReal
      .mul(fyTokenToBaseCostEstimate)
      .div(BigNumber.from(1).mul(BigNumber.from(10).pow(decimals)));

    // total estimated base value in pool
    const totalBaseValue = base.add(fyTokenToBaseValueEstimate);

    // total number of pool lp tokens associated with a strategy
    const poolLpReceived = burnFromStrategy(poolTotalSupply, strategyTotalSupply, strategyTotalSupply);

    // value per poolToken
    const valuePerPoolToken = Number(totalBaseValue) / Number(poolTotalSupply);
    // the amount of base per strategy LP token
    const baseValuePerStrategyLpToken = valuePerPoolToken * (Number(poolLpReceived) / Number(poolTotalSupply));

    return baseValuePerStrategyLpToken;
  } catch (e) {
    console.log('error getting strategy per share value', e);
    return 0;
  }
};

export const getStrategyReturns = async (
  strategy: IStrategyRoot,
  currStrategySeries: ISeries,
  currBlock: number,
  preBlock: number,
  currBlockTimestamp: number,
  preBlockTimestamp: number
) => {
  try {
    const baseValuePerShareCurr = await getStrategyBaseValuePerShare(strategy, currStrategySeries, currBlock);
    const baseValuePerSharePre = await getStrategyBaseValuePerShare(strategy, currStrategySeries, preBlock);

    const returns = Number(baseValuePerShareCurr) / Number(baseValuePerSharePre) - 1;

    const secondsBetween = currBlockTimestamp - preBlockTimestamp;
    const periods = SECONDS_PER_YEAR / secondsBetween;

    const apy = (1 + returns / periods) ** periods - 1;
    const apy_ = cleanValue((apy * 100).toString(), 2);
    return apy_;
  } catch (e) {
    console.log(e);
  }
  return '0';
};

export const getStrategyBaseValue = async (
  strategy: IStrategyRoot,
  currStrategySeries: ISeries,
  blockNum: number,
  timeTillMaturity: number
) => {
  const { poolContract } = currStrategySeries as ISeries;
  const [[base, fyTokenVirtual], poolTotalSupply, strategyPoolBalance, strategyTotalSupply] = await Promise.all([
    poolContract.getCache({ blockTag: blockNum }),
    poolContract.totalSupply({ blockTag: blockNum }),
    poolContract.balanceOf(strategy.address, { blockTag: blockNum }),
    strategy.strategyContract.totalSupply({ blockTag: blockNum }),
  ]);

  // the real balance of fyTokens in the pool
  const fyTokenReal = fyTokenVirtual.sub(poolTotalSupply);
  const [, value] = strategyTokenValue(
    ethers.utils.parseUnits('1', currStrategySeries.decimals),
    strategyTotalSupply,
    strategyPoolBalance,
    base,
    fyTokenReal,
    poolTotalSupply,
    timeTillMaturity.toString(),
    currStrategySeries.decimals
  );
  return value;
};

export const getStrategyReturnsWithTokenValue = async (
  strategy: IStrategyRoot,
  currStrategySeries: ISeries,
  currBlock: number,
  preBlock: number,
  currBlockTimestamp: number,
  preBlockTimestamp: number
) => {
  const currTimeTillMaturity = +currStrategySeries.getTimeTillMaturity();
  const preTimeTillMaturity = currTimeTillMaturity + (currBlockTimestamp - preBlockTimestamp);
  const currValue = await getStrategyBaseValue(strategy, currStrategySeries, currBlock, currTimeTillMaturity);
  const preValue = await getStrategyBaseValue(strategy, currStrategySeries, preBlock, preTimeTillMaturity);
  console.log('strategy', strategy.symbol);
  console.log('currValue', currValue.toString());
  console.log('preValue', preValue.toString());
  return calculateAPR(preValue, currValue, currBlockTimestamp, preBlockTimestamp);
};
