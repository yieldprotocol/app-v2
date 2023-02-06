import { useCallback, useContext, useMemo } from 'react';
import useSWR from 'swr';
import { useChainId } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';

export const useSeriesEntities = (seriesId: string | undefined) => {
  const {
    chainState: { seriesRootMap },
  } = useContext(ChainContext);

  const chainId = useChainId();
  const DEFAULT_SWR_KEY = useMemo(() => ['seriesEntities', chainId], [chainId]);

  const getSeriesEntities = async () => {
    console.log('getting all series data');
    const newMap = seriesRootMap;
    return newMap;
  };

  const { data: seriesEntities } = useSWR(DEFAULT_SWR_KEY, getSeriesEntities, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // This function is used to generate the key for the main useSWR hook below
  const genKey = useCallback(() => {
    if (seriesId) {
      return ['seriesEntities', chainId, seriesEntities, seriesId];
    }

    return DEFAULT_SWR_KEY;
  }, [DEFAULT_SWR_KEY, chainId, seriesEntities, seriesId]);

  // gets a specific series entity or all series entities if no seriesId is provided
  const main = async () => {
    if (!seriesId) return seriesEntities;

    console.log('getting series entity data for series with id: ', seriesId);
    return seriesEntities?.has(seriesId) ? seriesEntities.get(seriesId) : undefined;
  };

  // main entry hook that returns either a specific series entity's data, or all series entities' data if no seriesId is provided
  const { data, error } = useSWR(() => genKey(), main, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    data,
    error,
    isLoading: !data && !error,
    genKey,
  };
};

export default useSeriesEntities;
