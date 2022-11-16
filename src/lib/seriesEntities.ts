import yieldEnv from './../contexts/yieldEnv.json';
import { Block, JsonRpcProvider } from '@ethersproject/providers';
import { format } from 'date-fns';
import { arbitrumColorMap, ethereumColorMap } from '../config/colors';
import { SERIES_1, SERIES_42161 } from '../config/series';
import { Cauldron, Cauldron__factory, FYToken__factory, Pool__factory } from '../contracts';
import { ISeries, ISeriesDynamic, ISeriesMap, Value } from '../types';
import { getSeason, nameFromMaturity, SeasonType } from '../utils/appUtils';
import request from 'graphql-request';
import { EULER_SUPGRAPH_ENDPOINT } from '../utils/constants';
import { BigNumber, ethers } from 'ethers';
import Decimal from 'decimal.js';
import { calculateAPR, floorDecimal, sellFYToken, toBn } from '@yield-protocol/ui-math';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { ETH_BASED_ASSETS } from '../config/assets';
import { Provider } from '@wagmi/core';

// gets a single series non-dynamic
export const getSeriesEntity = async (
  provider: JsonRpcProvider | Provider,
  cauldron: Cauldron,
  chainId: number,
  id: string
): Promise<ISeries> => {
  const seriesMap = chainId === 1 ? SERIES_1 : SERIES_42161;
  if (!cauldron) throw new Error('no cauldron detected');

  const seriesEntity = seriesMap.get(id);
  if (!seriesEntity) throw new Error(`no series with ${id} in series config`);

  const { fyTokenAddress, poolAddress } = seriesEntity;

  const poolContract = Pool__factory.connect(poolAddress, provider);
  const fyTokenContract = FYToken__factory.connect(fyTokenAddress, provider);

  const [{ maturity, baseId }, name, symbol, version, decimals, poolName, poolVersion, poolSymbol, baseAddress] =
    await Promise.all([
      cauldron.series(id),
      fyTokenContract.name(),
      fyTokenContract.symbol(),
      fyTokenContract.version(),
      fyTokenContract.decimals(),
      poolContract.name(),
      poolContract.version(),
      poolContract.symbol(),
      poolContract.base(),
    ]);

  const seasonColorMap = [1, 4, 5, 42].includes(chainId) ? ethereumColorMap : arbitrumColorMap;
  const season = getSeason(maturity);
  const oppSeason = (_season: SeasonType) => getSeason(maturity + 23670000);
  const [startColor, endColor, textColor] = seasonColorMap.get(season)!;
  const [oppStartColor, oppEndColor, oppTextColor] = seasonColorMap.get(oppSeason(season))!;

  return {
    id,
    baseId,
    maturity,
    name,
    symbol,
    version,
    address: fyTokenAddress,
    fyTokenAddress,
    decimals,
    poolAddress,
    poolVersion,
    poolName,
    poolSymbol,
    baseAddress,
    fullDate: format(new Date(maturity * 1000), 'dd MMMM yyyy'),
    displayName: format(new Date(maturity * 1000), 'dd MMM yyyy'),
    displayNameMobile: `${nameFromMaturity(maturity, 'MMM yyyy')}`,

    season,
    startColor,
    endColor,
    color: `linear-gradient(${startColor}, ${endColor})`,
    textColor,

    oppStartColor,
    oppEndColor,
    oppTextColor,
  };
};

export const getSeriesEntities = async (provider: JsonRpcProvider | Provider, cauldron: Cauldron, chainId: number) => {
  const seriesMap = chainId === 1 ? SERIES_1 : SERIES_42161;
  return [...seriesMap.keys()].reduce(async (acc, id) => {
    const seriesEntity = await getSeriesEntity(provider, cauldron, chainId, id);
    return { ...(await acc), [id]: { ...seriesEntity } };
  }, Promise.resolve<{ [id: string]: ISeries }>({}));
};

export const getSeriesEntitiesSSR = async () => {
  // returns a chain id mapped to a ISeriesMap
  const chainIds = [1, 42161];
  return chainIds.reduce(async (acc, chainId) => {
    const { addresses } = yieldEnv;
    const chainAddrs = (addresses as any)[chainId];

    const provider = new JsonRpcProvider(
      chainId === 1 ? process.env.REACT_APP_RPC_URL_1 : process.env.REACT_APP_RPC_URL_42161
    );
    const cauldron = Cauldron__factory.connect(chainAddrs.Cauldron, provider);

    return {
      ...(await acc),
      [chainId]: await getSeriesEntities(provider, cauldron, chainId),
    };
  }, Promise.resolve(<{ [chainId: number]: ISeriesMap | undefined }>{}));
};

const getPoolAPY = async (sharesTokenAddr: string) => {
  const query = `
    query ($address: Bytes!) {
      eulerMarketStore(id: "euler-market-store") {
        markets(where:{eTokenAddress:$address}) {
          supplyAPY
         } 
      }
    }
  `;

  interface EulerRes {
    eulerMarketStore: {
      markets: {
        supplyAPY: string;
      }[];
    };
  }

  try {
    const {
      eulerMarketStore: { markets },
    } = await request<EulerRes>(EULER_SUPGRAPH_ENDPOINT, query, { address: sharesTokenAddr });
    return ((+markets[0].supplyAPY * 100) / 1e27).toString();
  } catch (error) {
    console.log(`could not get pool apy for pool with shares token: ${sharesTokenAddr}`, error);
    return undefined;
  }
};

export const mapify = (obj: Object) =>
  [...Object.keys(obj)].reduce((map, key) => {
    return map.set(key, (obj as any)[key]);
  }, new Map());

// gets a single seriesEntities dynamic data
export const getSeriesEntityDynamic = async (
  provider: JsonRpcProvider | Provider,
  cauldron: Cauldron,
  chainId: number,
  id: string,
  account: string | undefined
): Promise<ISeriesDynamic> => {
  const seriesEntity = await getSeriesEntity(provider, cauldron, chainId, id);
  const { maturity, baseId, decimals, poolAddress, baseAddress } = seriesEntity;
  const poolContract = Pool__factory.connect(seriesEntity.poolAddress, provider);
  const fyTokenContract = FYToken__factory.connect(seriesEntity.fyTokenAddress, provider);

  const [baseReserves, fyTokenReserves, totalSupply, fyTokenRealReserves, ts, g1, g2] = await Promise.all([
    poolContract.getBaseBalance(),
    poolContract.getFYTokenBalance(),
    poolContract.totalSupply(),
    fyTokenContract.balanceOf(poolAddress),
    poolContract.ts(),
    poolContract.g1(),
    poolContract.g2(),
  ]);

  let sharesReserves: BigNumber;
  let c: BigNumber | undefined;
  let mu: BigNumber | undefined;
  let currentSharePrice: BigNumber;
  let sharesAddress: string;

  try {
    [sharesReserves, c, mu, currentSharePrice, sharesAddress] = await Promise.all([
      poolContract.getSharesBalance(),
      poolContract.getC(),
      poolContract.mu(),
      poolContract.getCurrentSharePrice(),
      poolContract.sharesToken(),
    ]);
  } catch (error) {
    sharesReserves = baseReserves;
    currentSharePrice = parseUnits('1', decimals);
    sharesAddress = baseAddress;
    console.log('Using old pool contract that does not include c, mu, and shares');
  }

  // convert base amounts to shares amounts (baseAmount is wad)
  const getShares = (baseAmount: BigNumber) =>
    toBn(new Decimal(baseAmount.toString()).mul(10 ** decimals).div(new Decimal(currentSharePrice.toString())));

  // convert shares amounts to base amounts
  const getBase = (sharesAmount: BigNumber) =>
    toBn(new Decimal(sharesAmount.toString()).mul(new Decimal(currentSharePrice.toString())).div(10 ** decimals));

  const rateCheckAmount = parseUnits(ETH_BASED_ASSETS.includes(baseId) ? '.001' : '1', decimals);
  const latestTimestamp = (await provider.getBlock('latest')).timestamp;

  /* Calculates the base/fyToken unit selling price */
  const _sellRate = sellFYToken(
    sharesReserves,
    fyTokenReserves,
    rateCheckAmount,
    (maturity - latestTimestamp).toString(),
    ts,
    g2,
    decimals,
    c,
    mu
  );

  const apr = calculateAPR(floorDecimal(_sellRate), rateCheckAmount, maturity) || '0';
  const poolAPY = await getPoolAPY(sharesAddress);

  let currentInvariant: BigNumber | undefined;
  let initInvariant: BigNumber | undefined;
  let startBlock: Block | undefined;

  try {
    // get pool init block
    const gmFilter = poolContract.filters.gm();
    const gm = (await poolContract.queryFilter(gmFilter))[0];
    startBlock = await gm.getBlock();

    currentInvariant = await poolContract.invariant();
    initInvariant = await poolContract.invariant({ blockTag: startBlock.number });
  } catch (e) {
    console.log('Could not get current and init invariant for series', seriesEntity.id);
  }

  let poolTokens: BigNumber;
  let fyTokenBalance: BigNumber;

  if (account) {
    [poolTokens, fyTokenBalance] = await Promise.all([
      poolContract.balanceOf(account),
      fyTokenContract.balanceOf(account),
    ]);
  } else {
    poolTokens = ethers.constants.Zero;
    fyTokenBalance = ethers.constants.Zero;
  }

  return {
    ...seriesEntity,
    ts: BigNumber.from(ts),
    g1,
    g2,
    c,
    mu,
    sharesReserves: {
      value: sharesReserves,
      formatted: formatUnits(sharesReserves, decimals),
    },
    fyTokenReserves: {
      value: fyTokenReserves,
      formatted: formatUnits(fyTokenReserves, decimals),
    },
    fyTokenRealReserves: {
      value: fyTokenRealReserves,
      formatted: formatUnits(fyTokenRealReserves, decimals),
    },
    totalSupply: {
      value: totalSupply,
      formatted: formatUnits(totalSupply, decimals),
    },
    apr,
    poolAPY,
    getBase,
    getShares,
    seriesIsMature: maturity < latestTimestamp,
    poolContract,
    fyTokenContract,
    currentInvariant,
    initInvariant,
    startBlock,
    sharesAddress,
    poolTokens: {
      value: poolTokens,
      formatted: formatUnits(poolTokens, decimals),
    },
    fyTokenBalance: {
      value: fyTokenBalance,
      formatted: formatUnits(fyTokenBalance, decimals),
    },
  };
};
