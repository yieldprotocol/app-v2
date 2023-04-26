import { bytesToBytes32 } from '@yield-protocol/ui-math';
import { IAsset, Provider } from '../../types';
import useSWR from 'swr';
import { useCallback, useContext, useMemo } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { MulticallContext } from '../../contexts/MutlicallContext';
import useContracts from '../useContracts';
import contractAddresses, { ContractNames } from '../../config/contracts';
import { Cauldron, Cauldron__factory, VRCauldron, VRCauldron__factory } from '../../contracts';
import useFork from '../useFork';
import { stETH, wstETH } from '../../config/assets';
import useDefaultProvider from '../useDefaultProvider';
import useChainId from '../useChainId';

const useIlks = () => {
  const contracts = useContracts();
  const { useForkedEnv, forkStartBlock, provider: forkProvider } = useFork();
  const provider = useDefaultProvider();
  const { multicall, forkMulticall } = useContext(MulticallContext);
  const {
    userState: { selectedVR, selectedSeries, assetMap, selectedBase },
  } = useContext(UserContext);

  // contract instantiations
  const getCauldronFR = (provider: Provider) =>
    Cauldron__factory.connect(contracts?.get(ContractNames.CAULDRON)?.address!, provider);
  const getCauldronVR = (provider: Provider) =>
    VRCauldron__factory.connect(contracts?.get(ContractNames.VR_CAULDRON)?.address!, provider);
  const cauldronFR = multicall?.wrap(getCauldronFR(provider));
  const cauldronVR = multicall?.wrap(getCauldronVR(provider));
  const forkCauldronFR = forkMulticall?.wrap(getCauldronFR(forkProvider!));
  const forkCauldronVR = forkMulticall?.wrap(getCauldronVR(forkProvider!));

  const _getAssetsFromIlkIds = useCallback(
    (ids: string[]) =>
      ids.reduce((acc, id) => {
        const asset = assetMap.get(id.toLowerCase());
        if (!asset) return acc;

        // handle/add stETH if wstETH; it's wrapped to wstETH by default and doesn't have an addIlk event
        return asset.id.toLowerCase() === wstETH.toLowerCase()
          ? [...acc, asset, assetMap.get(stETH.toLowerCase())!]
          : [...acc, asset];
      }, [] as IAsset[]),
    [assetMap]
  );

  const getIlksFR = useCallback(async () => {
    if (!selectedSeries || !cauldronFR) return [];

    console.log('getting ilks fr');

    const _getIlkAddedEvents = async (cauldron: Cauldron, fromBlock?: number | string) => {
      try {
        return await cauldronFR.queryFilter(cauldron.filters.IlkAdded(bytesToBytes32(selectedSeries.id, 6)), fromBlock);
      } catch (e) {
        console.log('error getting fr ilk added events: ', e);
        return [];
      }
    };

    const ilkAddedEvents = await _getIlkAddedEvents(cauldronFR);
    const forkIlkAddedEvents =
      useForkedEnv && forkCauldronFR ? await _getIlkAddedEvents(forkCauldronFR, forkStartBlock) : [];
    const allIds = [...new Set([...ilkAddedEvents, ...forkIlkAddedEvents])].map(({ args: { ilkId } }) => ilkId);

    return _getAssetsFromIlkIds(allIds);
  }, [_getAssetsFromIlkIds, cauldronFR, forkCauldronFR, forkStartBlock, selectedSeries, useForkedEnv]);

  const getIlksVR = useCallback(async () => {
    if (!selectedVR || !cauldronVR || !selectedBase) return [];

    console.log('getting ilks vr');

    const _getIlkAddedEvents = async (cauldron: VRCauldron, fromBlock?: string | number) => {
      try {
        return await cauldron.queryFilter(cauldron.filters.IlkAdded(bytesToBytes32(selectedBase.id, 6)), fromBlock);
      } catch (e) {
        console.log('error getting vr ilk added events: ', e);
        return [];
      }
    };

    const ilkAddedEvents = await _getIlkAddedEvents(cauldronVR);
    const forkIlkAddedEvents =
      useForkedEnv && forkCauldronVR ? await _getIlkAddedEvents(forkCauldronVR, forkStartBlock) : [];
    const allIds = [...new Set([...ilkAddedEvents, ...forkIlkAddedEvents])].map(({ args: { ilkId } }) => ilkId);

    return _getAssetsFromIlkIds(allIds);
  }, [_getAssetsFromIlkIds, cauldronVR, forkCauldronVR, forkStartBlock, selectedBase, selectedVR, useForkedEnv]);

  const getIlks = useCallback(() => (selectedVR ? getIlksVR() : getIlksFR()), [getIlksFR, getIlksVR, selectedVR]);

  const key = useMemo(
    () => ['ilks', selectedVR, useForkedEnv, forkStartBlock, selectedBase, selectedSeries, assetMap],
    [assetMap, forkStartBlock, selectedBase, selectedSeries, selectedVR, useForkedEnv]
  );

  const { data, error, isLoading } = useSWR(key, getIlks, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  return { data, error, isLoading };
};

export default useIlks;
