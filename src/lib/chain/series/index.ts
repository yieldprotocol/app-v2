import { format } from 'date-fns';
import { Contract, ethers } from 'ethers';
import { arbitrumColorMap, ethereumColorMap } from '../../../config/colors';
import { FYToken__factory, Pool__factory } from '../../../contracts';
import { SeriesAddedEvent } from '../../../contracts/Cauldron';
import { PoolAddedEvent } from '../../../contracts/ConvexLadleModule';
import { ISeriesRoot } from '../../../types';
import { getSeason, nameFromMaturity, SeasonType } from '../../../utils/appUtils';

export const getSeries = async (
  provider: ethers.providers.JsonRpcProvider,
  chainId: number,
  contractMap: Map<string, Contract>
) => {
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
      };

      return { ...(await seriesMap), [id]: chargeSeries(chainId, newSeries) };
    }
    return seriesMap;
  }, {});
};

const chargeSeries = (
  chainId: number,
  series: { maturity: number; baseId: string; poolAddress: string; fyTokenAddress: string }
) => {
  const seasonColorMap = [1, 4, 42].includes(chainId) ? ethereumColorMap : arbitrumColorMap;

  const season = getSeason(series.maturity);
  const oppSeason = (_season: SeasonType) => getSeason(series.maturity + 23670000);
  const [startColor, endColor, textColor] = seasonColorMap.get(season)!;
  const [oppStartColor, oppEndColor, oppTextColor] = seasonColorMap.get(oppSeason(season))!;
  return {
    ...series,

    displayName: format(new Date(series.maturity * 1000), 'dd MMM yyyy'),
    displayNameMobile: `${nameFromMaturity(series.maturity, 'MMM yyyy')}`,

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
