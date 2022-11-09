import { ethers } from 'ethers';
import { useContext } from 'react';
import useSWR from 'swr';
import { useAccount } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { IStrategy } from '../types';
import useChainId from './useChainId';

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

  const chainId = useChainId();
  const { address: account } = useAccount();

  const getStrategies = async () =>
    [...strategyRootMap.values()].reduce(async (acc, s) => {
      const [currentSeriesId, currentPoolAddr, accountBalance] = await Promise.all([
        s.strategyContract.seriesId(),
        s.strategyContract.pool(),
        account ? s.strategyContract.balanceOf(account) : ethers.constants.Zero,
      ]);
      const currentSeries = seriesMap.get(currentSeriesId);
      return (await acc).set(s.address, { ...s, currentSeriesId, currentPoolAddr, currentSeries, accountBalance });
    }, Promise.resolve(new Map<string, IStrategy>()));

  const genKey = () => `/strategies?chainId=${chainId}${account ? `&account=${account}` : ''}`;

  const { data, error } = useSWR(genKey(), getStrategies, {
    revalidateOnFocus: false,
  });

  return {
    data,
    isLoading: !data && !error,
    key: genKey(),
  };
};

export default useStrategies;
