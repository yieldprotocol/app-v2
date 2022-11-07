import { ReadContractsContract } from '@wagmi/core/dist/declarations/src/actions/contracts/readContracts';
import { BigNumber, ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useContext, useEffect, useMemo } from 'react';
import { useAccount, useContractReads } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { Pool__factory } from '../contracts';
import { IStrategy, IStrategyRoot } from '../types';
import useDefaultProvider from './useDefaultProvider';

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
  const { address: account } = useAccount();
  const provider = useDefaultProvider();

  const strategyFuncs = ['totalSupply', 'seriesId', 'pool', 'balanceOf'];
  const strategiesContractCalls = useMemo(
    () =>
      [...strategyRootMap.values()]
        .map((strategy) => {
          const { strategyContract } = strategy;
          return [
            {
              addressOrName: strategyContract.address,
              contractInterface: strategyContract.interface,
              functionName: 'totalSupply',
            },
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
            {
              addressOrName: strategyContract.address,
              contractInterface: strategyContract.interface,
              functionName: 'balanceOf',
              args: [account ?? undefined],
            },
          ];
        })
        .flat(),
    [account, strategyRootMap]
  );

  const {
    data: strategiesData,
    isLoading: strategiesDataLoading,
    refetch: refetchStrategies,
  } = useContractReads({
    contracts: strategiesContractCalls,
    enabled: !!strategyRootMap.size,
  });

  // chunk it for parsing
  // looks like:
  // [[strategy1Data], [strategy2Data], etc.]
  const chunked =
    strategiesData && strategiesData.length
      ? (chunk(strategiesData, strategyFuncs.length) as unknown as [
          totalSupply: BigNumber,
          seriesId: string,
          pool: string,
          balance: BigNumber
        ][])
      : undefined;

  // parse through data from wagmi
  const strategyMap = useMemo(() => {
    return [...strategyRootMap.values()].reduce((acc, strategy, i) => {
      if (!chunked) return acc;

      const strategyData = chunked[i];
      const [totalSupply, seriesId, pool] = strategyData;
      const balance = account && strategiesData ? strategiesData[3] : ethers.constants.Zero;
      const currentSeries = seriesMap.get(seriesId);

      return acc.set(strategy.address, {
        strategyTotalSupply: totalSupply,
        strategyTotalSupply_: formatUnits(totalSupply, strategy.decimals),

        currentSeries,
        currentSeriesId: seriesId,
        currentPoolAddr: pool,

        accountBalance: balance,
        accountBalance_: formatUnits(balance, strategy.decimals),

        active: true,
      } as IStrategy);
    }, new Map() as Map<string, IStrategy>);
  }, [account, chunked, seriesMap, strategiesData, strategyRootMap]);

  /* Get the data dependent upon series */
  // strategy's pool contract calls
  const seriesFuncs = ['balanceOf', 'balanceOf'];
  const seriesContractCalls: ReadContractsContract[] = useMemo(
    () =>
      [...strategyMap.values()]
        .map((strategy) => {
          if (!strategy.currentPoolAddr) return [];

          const poolContract = Pool__factory.connect(strategy.currentPoolAddr, provider);
          return [
            {
              addressOrName: poolContract.address,
              contractInterface: poolContract.interface,
              functionName: 'balanceOf',
              args: [strategy.address],
            },
            {
              addressOrName: poolContract.address,
              contractInterface: poolContract.interface,
              functionName: 'balanceOf',
              args: [account ?? undefined],
            },
          ];
        })
        .flat(),
    [account, provider, strategyMap]
  );

  const {
    data: seriesData,
    isLoading: seriesDataLoading,
    refetch: refetchStrategySeries,
  } = useContractReads({
    contracts: seriesContractCalls,
    enabled: !!strategyMap.size && !!strategiesData && !!seriesMap.size,
  });

  const chunkedSeriesCalls =
    seriesData && seriesData.length
      ? (chunk(seriesData, seriesFuncs.length) as unknown as [
          strategyPoolBalance: BigNumber,
          accountPoolBalance: BigNumber
        ][])
      : undefined;

  // parse through data again (with associated pool data) from wagmi
  const strategyMapWithPool = useMemo(() => {
    return [...strategyMap.values()].reduce((acc, strategy, i) => {
      if (!chunkedSeriesCalls) return acc;
      const data = chunkedSeriesCalls[i];
      const [strategyPoolBalance, accountPoolBalance] = data;

      return acc.set(strategy.address, {
        ...strategy,
        strategyPoolBalance,
        strategyPoolBalance_: formatUnits(strategyPoolBalance || ethers.constants.Zero, strategy.decimals),

        accountPoolBalance,
        accountPoolBalance_: formatUnits(accountPoolBalance || ethers.constants.Zero, strategy.decimals),
      } as IStrategy);
    }, new Map() as Map<string, IStrategy>);
  }, [chunkedSeriesCalls, strategyMap]);

  useEffect(() => {}, []);

  useEffect(() => {}, []);

  return {
    data: strategyMapWithPool,
    isLoading: strategiesDataLoading || seriesDataLoading,
    refetch: () => {
      refetchStrategies();
      refetchStrategySeries();
    },
  };
};

export default useStrategies;
