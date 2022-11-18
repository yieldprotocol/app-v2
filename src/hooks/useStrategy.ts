import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useContext } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount, useProvider } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { Pool__factory } from '../contracts';
import { IStrategyDynamic } from '../types';

/**
 * Fetch a single strategy's data
 */
const useStrategy = (address?: string) => {
  const {
    chainState: { strategyRootMap },
  } = useContext(ChainContext);

  const provider = useProvider();
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

      const poolContract = Pool__factory.connect(currentPoolAddr, provider);

      const [poolTotalSupply, strategyPoolBalance, currentPoolMaturity] = await Promise.all([
        poolContract.totalSupply(),
        poolContract.balanceOf(strategy.address),
        poolContract.maturity(),
      ]);

      return {
        ...strategy,
        currentPoolAddr,
        currentPoolMaturity,
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
    [account, provider, strategyRootMap]
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
