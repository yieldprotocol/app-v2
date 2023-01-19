import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount, useProvider } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { Pool__factory } from '../contracts';
import { IStrategyDynamic } from '../types';
import useChainId from './useChainId';
import useStrategies from './useStrategies';

/**
 * Fetch a single strategy's data
 */
const useStrategy = (address?: string) => {
  const {
    chainState: { multicall },
  } = useContext(ChainContext);
  const provider = useProvider();
  const chainId = useChainId();
  const { address: account } = useAccount();
  const { data: strategies } = useStrategies();

  const getStrategy = useCallback(
    async (address: string): Promise<IStrategyDynamic | undefined> => {
      if (!multicall) return;
      console.log(`fetching strategy with address: ${address}`);

      const strategy = strategies?.get(address);
      if (!strategy) throw new Error('no strategy with that address');
      const { decimals, strategyContract: contract } = strategy;

      const [currentSeriesId, currentPoolAddr, accountBalance, totalSupply] = await Promise.all([
        multicall.wrap(contract).seriesId(),
        multicall.wrap(contract).pool(),
        account ? multicall.wrap(contract).balanceOf(account) : ethers.constants.Zero,
        multicall.wrap(contract).totalSupply(),
      ]);

      const poolContract = Pool__factory.connect(currentPoolAddr, provider);

      const [poolTotalSupply, strategyPoolBalance, currentPoolMaturity] = await Promise.all([
        multicall.wrap(poolContract).totalSupply(),
        multicall.wrap(poolContract).balanceOf(strategy.address),
        multicall.wrap(poolContract).maturity(),
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
    [account, multicall, provider, strategies]
  );

  // generates the key to be used by swr
  // "mutate" can be called with this key to revalidate and refetch data
  // address passed in as a param because we can mutate the global swr cache using a dynamic key (i.e.: in the dashboard)
  const genKey = useCallback(
    (address: string | undefined) => (chainId && address ? ['strategy', chainId, address, account] : null),
    [account, chainId]
  );

  // generate the key for the current context's supplied strategy address
  const key = useMemo(() => genKey(address), [address, genKey]);
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
