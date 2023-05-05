import { ContractNames } from '../../config/contracts';
import { VRCauldron, VRCauldron__factory } from '../../contracts';
import useFork from '../useFork';
import useDefaultProvider from '../useDefaultProvider';
import useSWR from 'swr';
import { Provider } from '../../types';
import { useCallback, useContext, useMemo } from 'react';
import { MulticallContext } from '../../contexts/MutlicallContext';
import useContracts from '../useContracts';

const useBasesVR = () => {
  const contracts = useContracts();
  const { multicall, forkMulticall } = useContext(MulticallContext);
  const { provider: forkProvider, useForkedEnv, forkStartBlock } = useFork();
  const provider = useDefaultProvider();

  const getCauldronVR = (provider: Provider) =>
    VRCauldron__factory.connect(contracts?.get(ContractNames.VR_CAULDRON)?.address!, provider);
  const cauldronVR = multicall?.wrap(getCauldronVR(provider));
  const forkCauldronVR = forkMulticall?.wrap(getCauldronVR(forkProvider!));

  const _getBases = useCallback(async (cauldron: VRCauldron, fromBlock?: string | number): Promise<string[]> => {
    const baseAddedEvents = await cauldron.queryFilter(cauldron.filters.BaseAdded(), fromBlock);
    return baseAddedEvents.map(({ args: { baseId } }) => baseId);
  }, []);

  // combines fork and non-fork data
  const getBases = useCallback(async () => {
    console.log('getting vr bases');
    const baseIds = await _getBases(cauldronVR!);
    const forkBaseIds = useForkedEnv && forkCauldronVR ? await _getBases(forkCauldronVR, forkStartBlock) : [];
    const allIds = [...new Set([...baseIds, ...forkBaseIds])];
    return allIds;
  }, [_getBases, cauldronVR, forkCauldronVR, forkStartBlock, useForkedEnv]);

  const key = useMemo(
    () => ['basesVR', useForkedEnv, forkProvider, provider, _getBases],
    [forkProvider, provider, useForkedEnv, _getBases]
  );

  const { data, isLoading, error } = useSWR(key, getBases, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  return { data, isLoading, error };
};

export default useBasesVR;
