import { ContractNames } from '../../config/contracts';
import { VRCauldron } from '../../contracts';
import useContracts from '../useContracts';
import useFork from '../useFork';
import useDefaultProvider from '../useDefaultProvider';
import useSWR from 'swr';
import { Provider } from '../../types';
import { useCallback, useMemo } from 'react';

const useBasesVR = () => {
  const contracts = useContracts();
  const { provider: forkProvider, useForkedEnv } = useFork();
  const provider = useDefaultProvider();

  const _getBases = useCallback(
    async (provider: Provider | undefined): Promise<string[]> => {
      if (!contracts) return [];

      const cauldron = contracts.get(ContractNames.VR_CAULDRON) as VRCauldron | undefined;
      if (!cauldron) return [];

      const baseAddedEvents = await cauldron.queryFilter(cauldron.filters.BaseAdded());
      return baseAddedEvents.map(({ args: { baseId } }) => baseId);
    },
    [contracts]
  );

  // combines fork and non-fork data
  const getBases = useCallback(
    async () =>
      useForkedEnv
        ? [...new Set([...(await _getBases(forkProvider)), ...(await _getBases(provider))])]
        : await _getBases(provider),
    [_getBases, forkProvider, provider, useForkedEnv]
  );

  const key = useMemo(() => ['basesVR', useForkedEnv, forkProvider, provider], [forkProvider, provider, useForkedEnv]);

  const { data, isLoading, error } = useSWR(key, getBases, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return { data, isLoading, error };
};

export default useBasesVR;
