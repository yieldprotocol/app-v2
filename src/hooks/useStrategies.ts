import { ReadContractsContract } from '@wagmi/core/dist/declarations/src/actions/contracts/readContracts';
import { useContext, useMemo } from 'react';
import { useContractReads } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { IStrategy } from '../types';

const chunk = <T>(items: T[], chunkLength: number) =>
  items.reduce((chunks: T[][], item: T, index) => {
    const chunk = Math.floor(index / chunkLength);
    chunks[chunk] = ([] as T[]).concat(chunks[chunk] || [], item);
    return chunks;
  }, []);

/**
 * Fetch all strategy data using wagmi read contracts
 */
const useStrategies = () => {
  const {
    chainState: { strategyRootMap },
  } = useContext(ChainContext);
  const {
    userState: { seriesMap },
  } = useContext(UserContext);

  const strategyFuncs = ['seriesId', 'pool'];
  const strategiesContractCalls: ReadContractsContract[] = useMemo(
    () =>
      [...strategyRootMap.values()]
        .map((strategy) => {
          const { strategyContract } = strategy;
          return [
            {
              addressOrName: strategyContract.address,
              contractInterface: strategyContract.interface,
              functionName: 'seriesId',
            },
            {
              addressOrName: strategyContract.address,
              contractInterface: strategyContract.interface,
              functionName: 'pool',
            },
          ];
        })
        .flat(),
    [strategyRootMap]
  );

  const { data, isLoading, refetch } = useContractReads({
    contracts: strategiesContractCalls,
    enabled: !!strategyRootMap.size,
  });

  // chunk it for parsing
  // looks like:
  // [[strategy1Data], [strategy2Data], etc.]
  const chunked = useMemo(() => {
    return data && data.length
      ? (chunk(data, strategyFuncs.length) as unknown as [seriesId: string, pool: string][])
      : undefined;
  }, [data, strategyFuncs.length]);

  // parse through data from wagmi
  const strategyMap = useMemo(() => {
    return [...strategyRootMap.values()].reduce((acc, strategy, i) => {
      if (!chunked) return acc;

      const strategyData = chunked[i];
      const [seriesId, pool] = strategyData;
      const currentSeries = seriesMap.get(seriesId);

      return acc.set(strategy.address, {
        ...strategyRootMap.get(strategy.address),
        currentSeries,
        currentSeriesId: seriesId,
        currentPoolAddr: pool,
      } as IStrategy);
    }, new Map() as Map<string, IStrategy>);
  }, [chunked, seriesMap, strategyRootMap]);

  return {
    data: strategyMap,
    isLoading,
    refetch,
  };
};

export default useStrategies;
