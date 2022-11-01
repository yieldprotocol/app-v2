import { JsonRpcProvider } from '@ethersproject/providers';
import { useMemo } from 'react';
import { useNetwork, useProvider } from 'wagmi';

const useDefaulProvider = () => {
  const { chains } = useNetwork();
  const provider = useProvider();

  return useMemo(() => provider ?? new JsonRpcProvider(chains[0].rpcUrls[0]), [chains, provider]);
};

export default useDefaulProvider;
