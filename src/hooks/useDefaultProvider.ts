import { ethers } from 'ethers';
import { useMemo } from 'react';
import { useNetwork } from 'wagmi';
import { RPC_URLS } from '../config/chainData';
import { useCachedState } from './generalHooks';

const useDefaultProvider = () => {
  const { activeChain } = useNetwork();
  const chainId = activeChain?.id;
  const [lastChainId] = useCachedState('lastChainId', '1');
  const chainIdToUse = chainId ?? lastChainId;

  return useMemo(() => new ethers.providers.StaticJsonRpcProvider(RPC_URLS[chainIdToUse]), [chainIdToUse]);
};

export default useDefaultProvider;
