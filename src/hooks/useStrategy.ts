import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { IStrategyDynamic } from '../types';

/**
 * Fetch a single strategy's data
 */
const useStrategy = (address?: string) => {
  const {
    chainState: { strategyRootMap },
  } = useContext(ChainContext);
  const {
    userState: { seriesMap },
  } = useContext(UserContext);

  const { address: account } = useAccount();

  const getStrategy = useCallback(
    async (address: string): Promise<IStrategyDynamic> => {
      console.log('getting strategy');
      const strategy = strategyRootMap.get(address);
      if (!strategy) throw new Error('no strategy with that address');
      const { decimals, strategyContract: contract } = strategy;

      const [currentSeriesId, currentPoolAddr, accountBalance, totalSupply] = await Promise.all([
        contract.seriesId(),
        contract.pool(),
        account ? contract.balanceOf(account) : ethers.constants.Zero,
        contract.totalSupply(),
      ]);

      const currentSeries = seriesMap.get(currentSeriesId);
      if (!currentSeries) throw new Error('no current series');

      const [poolTotalSupply, strategyPoolBalance] = await Promise.all([
        currentSeries.poolContract.totalSupply(),
        currentSeries.poolContract.balanceOf(strategy.address),
      ]);

      return {
        ...strategy,
        currentSeries,
        currentPoolAddr,
        currentSeriesId,
        accountBalance: {
          value: accountBalance,
          formatted: formatUnits(accountBalance, decimals),
        },
        totalSupply: {
          value: totalSupply,
          formatted: formatUnits(totalSupply, decimals),
        },
        poolTotalSupply: {
          value: poolTotalSupply,
          formatted: ethers.utils.formatUnits(poolTotalSupply, decimals),
        },
        strategyPoolBalance: {
          value: strategyPoolBalance,
          formatted: formatUnits(strategyPoolBalance, decimals),
        },
      };
    },
    [account, seriesMap, strategyRootMap]
  );

  // generates the key to be used by swr
  // "mutate" can be called with this key to revalidate and refetch data
  // address passed in as a param because we can mutate the global swr cache using a dynamic key (i.e.: in the dashboard)
  const genKey = useCallback(
    (address: string | undefined) =>
      strategyRootMap.size && address ? ['strategy', address, strategyRootMap, account] : null,
    [account, strategyRootMap]
  );

  // generate the key for the current context's supplied strategy address
  const key = genKey(address);
  const { data, error, isValidating } = useSWRImmutable(key, () => getStrategy(address!));

  return {
    data,
    isLoading: !data && !error,
    error,
    isValidating,
    key,
    genKey,
    getStrategy,
  };
};

export default useStrategy;
