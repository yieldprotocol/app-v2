import contractAddresses, { ContractNames } from '../../config/contracts';
import { VRCauldron__factory } from '../../contracts';
import useFork from '../useFork';
import useDefaultProvider from '../useDefaultProvider';
import useSWR from 'swr';
import { Provider } from '../../types';
import { useCallback, useMemo } from 'react';
import useChainId from '../useChainId';

const useBasesVR = () => {
  const chainId = useChainId();
  const { provider: forkProvider, useForkedEnv, forkStartBlock } = useFork();
  const provider = useDefaultProvider();

  const cauldronAddr = contractAddresses.addresses.get(chainId)?.get(ContractNames.VR_CAULDRON);

  const _getBases = useCallback(
    async (provider: Provider | undefined, fromBlock?: string | number): Promise<string[]> => {
      if (!provider || !cauldronAddr) return [];

      const cauldron = VRCauldron__factory.connect(cauldronAddr, provider);

      const baseAddedEvents = await cauldron.queryFilter(cauldron.filters.BaseAdded(), fromBlock || 'earliest');
      return baseAddedEvents.map(({ args: { baseId } }) => baseId);
    },
    [cauldronAddr]
  );

  // combines fork and non-fork data
  const getBases = useCallback(
    async () =>
      useForkedEnv
        ? [...new Set([...(await _getBases(forkProvider, forkStartBlock)), ...(await _getBases(provider))])]
        : await _getBases(provider),
    [_getBases, forkProvider, forkStartBlock, provider, useForkedEnv]
  );

  const key = useMemo(
    () => ['basesVR', useForkedEnv, forkProvider, provider, _getBases],
    [forkProvider, provider, useForkedEnv, _getBases]
  );

  const { data, isLoading, error } = useSWR(key, getBases, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return { data, isLoading, error };
};

export default useBasesVR;
