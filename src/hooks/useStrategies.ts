import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useContext, useEffect, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { IStrategy } from '../types';

/**
 * Fetch all strategy data
 */
const useStrategies = () => {
  const {
    chainState: { strategyRootMap },
  } = useContext(ChainContext);
  const {
    userState: { seriesMap },
  } = useContext(UserContext);

  const { address: account } = useAccount();

  const getStrategies = async () => {
    return [...strategyRootMap.values()].reduce(async (acc, s) => {
      const [currentSeriesId, currentPoolAddr, accountBalance] = await Promise.all([
        s.strategyContract.seriesId(),
        s.strategyContract.pool(),
        account ? s.strategyContract.balanceOf(account) : ethers.constants.Zero,
      ]);

      const currentSeries = seriesMap.get(currentSeriesId);
      if (!currentSeries) return await acc;

      return (await acc).set(s.address, {
        ...s,
        currentSeriesId,
        currentPoolAddr,
        currentSeries,
        accountBalance: { value: accountBalance, formatted: formatUnits(accountBalance, s.decimals) },
      });
    }, Promise.resolve(new Map<string, IStrategy>()));
  };

  const key = useMemo(() => {
    return seriesMap.size ? ['strategies', seriesMap, account] : null;
  }, [account, seriesMap]);

  const { data, error } = useSWRImmutable(key, getStrategies);

  return {
    data,
    isLoading: !data && !error,
    key,
  };
};

export default useStrategies;
