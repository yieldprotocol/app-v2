import { AlchemyProvider } from '@ethersproject/providers';
import { useMemo } from 'react';
import useChainId from './useChainId';

// default provider always uses the non-fork provider and the non-fork chainId
const useDefaultProvider = () => {
  const chainId = useChainId();
  const key = chainId === 1 ? process.env.ALCHEMY_MAINNET_KEY! : process.env.ALCHEMY_ARBITRUM_KEY!;
  return useMemo(() => new AlchemyProvider(chainId, key), [chainId, key]);
};

export default useDefaultProvider;
