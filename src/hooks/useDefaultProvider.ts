import { AlchemyProvider } from '@ethersproject/providers';
import { useMemo } from 'react';
import useChainId from './useChainId';

// default provider always uses the non-fork provider and the non-fork chainId
const useDefaultProvider = () => {
  const chainId = useChainId();

  return useMemo(() => new AlchemyProvider(chainId, process.env.ALCHEMY_MAINNET_KEY!), [chainId]);
};

export default useDefaultProvider;
