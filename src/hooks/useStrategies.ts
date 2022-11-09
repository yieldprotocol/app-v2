import { useContext } from 'react';
import useSWR from 'swr';
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

  const getStrategies = async () =>
    [...strategyRootMap.values()].reduce(async (acc, s) => {
      const [currentSeriesId, currentPoolAddr] = await Promise.all([
        s.strategyContract.seriesId(),
        s.strategyContract.pool(),
      ]);
      const currentSeries = seriesMap.get(currentSeriesId);
      return (await acc).set(s.address, { ...s, currentSeriesId, currentPoolAddr, currentSeries });
    }, Promise.resolve(new Map<string, IStrategy>()));

  const { data, error } = useSWR(`/strategies?chainId=${chainId}`, getStrategies, { revalidateOnFocus: false });

  return {
    data,
    isLoading: !data && !error,
  };
};

export default useStrategies;
