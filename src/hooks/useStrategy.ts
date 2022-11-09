import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { IStrategyDynamic } from '../types';
import useChainId from './useChainId';

/**
 * Fetch a single strategy's data
 */
const useStrategy = (address: string) => {
  const {
    chainState: { strategyRootMap },
  } = useContext(ChainContext);
  const {
    userState: { seriesMap },
  } = useContext(UserContext);

  const chainId = useChainId();
  const { address: account } = useAccount();

  const getStrategy = async (): Promise<IStrategyDynamic> => {
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
  };

  const key = useMemo(
    () => (chainId ? `/strategy?id=${address}chainId=${chainId}${account ? `&account=${account}` : ''}` : null),
    [account, address, chainId]
  );

  const { data, error } = useSWRImmutable(key, getStrategy);

  return {
    data,
    isLoading: !data && !error,
    key,
    getStrategy,
  };
};

export default useStrategy;
