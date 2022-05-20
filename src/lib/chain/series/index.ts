import { format } from 'date-fns';
import { Contract, ethers } from 'ethers';
import { ETH_BASED_ASSETS } from '../../../config/assets';
import { arbitrumColorMap, ethereumColorMap } from '../../../config/colors';
import { FYToken__factory, Pool__factory } from '../../../contracts';
import { SeriesAddedEvent } from '../../../contracts/Cauldron';
import { PoolAddedEvent } from '../../../contracts/ConvexLadleModule';
import { ISeries } from '../../../types';
import { getSeason, nameFromMaturity, SeasonType } from '../../../utils/appUtils';
import { calculateAPR, floorDecimal, secondsToFrom, sellFYToken } from '../../../utils/yieldMath';

export const getSeries = async (
  provider: ethers.providers.JsonRpcProvider,
  contractMap: Map<string, Contract>
): Promise<{ [id: string]: ISeries }> => {
  const { chainId } = await provider.getNetwork();
  const Cauldron = contractMap.get('Cauldron');
  const Ladle = contractMap.get('Ladle');

  /* get poolAdded events and series events at the same time */
  const [seriesAddedEvents, poolAddedEvents] = await Promise.all([
    Cauldron.queryFilter('SeriesAdded' as ethers.EventFilter),
    Ladle.queryFilter('PoolAdded' as ethers.EventFilter),
  ]);

  /* Create a map from the poolAdded event data or hardcoded pool data if available */
  const poolMap = new Map(poolAddedEvents.map((e: PoolAddedEvent) => e.args)); // event values);

  /* Create a array from the seriesAdded event data or hardcoded series data if available */
  const seriesAdded = seriesAddedEvents.map((e: SeriesAddedEvent) => e.args);

  return seriesAdded.reduce(async (seriesMap, x) => {
    const { seriesId: id, baseId, fyToken } = x;
    const { maturity } = await Cauldron.series(id);

    if (poolMap.has(id)) {
      // only add series if it has a pool
      const poolAddress = poolMap.get(id);
      const poolContract = Pool__factory.connect(poolAddress, provider);
      const fyTokenContract = FYToken__factory.connect(fyToken, provider);
      const [name, symbol, version, decimals, poolName, poolVersion, poolSymbol] = await Promise.all([
        fyTokenContract.name(),
        fyTokenContract.symbol(),
        fyTokenContract.version(),
        fyTokenContract.decimals(),
        poolContract.name(),
        poolContract.version(),
        poolContract.symbol(),
      ]);

      const fullDate = format(new Date(maturity * 1000), 'dd MMMM yyyy');
      const displayName = format(new Date(maturity * 1000), 'dd MMM yyyy');
      const displayNameMobile = `${nameFromMaturity(maturity, 'MMM yyyy')}`;

      const newSeries = {
        id,
        baseId,
        maturity,
        name,
        symbol,
        version,
        address: fyToken,
        fyTokenAddress: fyToken,
        decimals,
        poolAddress,
        poolVersion,
        poolName,
        poolSymbol,
        seriesIsMature: maturity - Math.round(new Date().getTime() / 1000) <= 0,
        fullDate,
        displayName,
        displayNameMobile,
      };

      return { ...(await seriesMap), [id]: getColors(chainId, newSeries) as ISeries };
    }
    return seriesMap;
  }, {});
};

const getColors = (chainId: number, series: any) => {
  const seasonColorMap = [1, 4, 5, 42].includes(chainId) ? ethereumColorMap : arbitrumColorMap;

  const season = getSeason(series.maturity);
  const oppSeason = (_season: SeasonType) => getSeason(series.maturity + 23670000);
  const [startColor, endColor, textColor] = seasonColorMap.get(season)!;
  const [oppStartColor, oppEndColor, oppTextColor] = seasonColorMap.get(oppSeason(season))!;

  return {
    ...series,
    startColor,
    endColor,
    color: `linear-gradient(${startColor}, ${endColor})`,
    textColor,
    oppStartColor,
    oppEndColor,
    oppTextColor,
  };
};

export const chargeSeries = async (provider: ethers.providers.JsonRpcProvider, series: ISeries) => {
  const poolContract = Pool__factory.connect(series.poolAddress, provider);
  const fyTokenContract = FYToken__factory.connect(series.fyTokenAddress, provider);

  /* Get all the data simultanenously in a promise.all */
  const [baseReserves, fyTokenReserves, totalSupply, ts, g1, g2, baseAddress, fyTokenRealReserves] = await Promise.all([
    poolContract.getBaseBalance(),
    poolContract.getFYTokenBalance(),
    poolContract.totalSupply(),
    poolContract.ts(),
    poolContract.g1(),
    poolContract.g2(),
    poolContract.base(),
    fyTokenContract.balanceOf(series.poolAddress),
  ]);

  const rateCheckAmount = ethers.utils.parseUnits(
    ETH_BASED_ASSETS.includes(series.baseId) ? '.001' : '1',
    series.decimals
  );

  /* Calculates the base/fyToken unit selling price */
  const _sellRate = sellFYToken(
    baseReserves,
    fyTokenReserves,
    rateCheckAmount,
    secondsToFrom(series.maturity.toString()),
    ts,
    g2,
    series.decimals
  );

  const apr = calculateAPR(floorDecimal(_sellRate), rateCheckAmount, series.maturity) || '0';

  return {
    ...series,
    apr: `${Number(apr).toFixed(2)}`,
    baseReserves,
    baseReserves_: ethers.utils.formatUnits(baseReserves, series.decimals),
    poolContract,
    fyTokenContract,
    fyTokenReserves,
    fyTokenRealReserves,
    totalSupply,
    totalSupply_: ethers.utils.formatUnits(totalSupply, series.decimals),
    ts,
    g1,
    g2,

    // built-in helper functions:
    isMature: () => series.maturity - Math.round(new Date().getTime() / 1000) <= 0,
    getTimeTillMaturity: () => (series.maturity - Math.round(new Date().getTime() / 1000)).toString(),
    getBaseAddress: () => baseAddress,
  };
};
