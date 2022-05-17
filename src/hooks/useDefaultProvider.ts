import { ethers } from 'ethers';
import { useEffect, useMemo } from 'react';
import { useNetwork } from 'wagmi';
import { RPC_URLS } from '../config/chainData';
import { clearCachedItems } from '../utils/appUtils';
import { useCachedState } from './generalHooks';

const useDefaultProvider = () => {
  const { activeChain } = useNetwork();
  const chainId = activeChain?.id;
  const [lastChainId, setLastChainId] = useCachedState('lastChainId', '1');
  const chainIdToUse = chainId ?? +lastChainId;

  const _provider = useMemo(
    () => new ethers.providers.StaticJsonRpcProvider(RPC_URLS[chainIdToUse], chainIdToUse),
    [chainIdToUse]
  );

  /**
   * Handle chain/provider changes
   * Clear provider-dependent items in localStorage
   */
  useEffect(() => {
    if (chainId && lastChainId && chainId !== lastChainId) {
      clearCachedItems([
        'lastChainId',
        'assets',
        'series',
        'lastAssetUpdate',
        'lastSeriesUpdate',
        'strategies',
        'lastStrategiesUpdate',
        'connectionName',
      ]);

      setLastChainId(chainId);
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    }
  }, [_provider, chainId, lastChainId, setLastChainId]);

  return _provider;
};

export default useDefaultProvider;
