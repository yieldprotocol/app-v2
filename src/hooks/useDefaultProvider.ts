import { JsonRpcProvider } from '@ethersproject/providers';
import { useMemo } from 'react';
import { useNetwork, useProvider } from 'wagmi';

const useDefaultProvider = () => {
  const { chains } = useNetwork();
  const provider = useProvider();

  const url = chains[0].rpcUrls.default['http'][0];

  return useMemo(() => provider ?? new JsonRpcProvider(url), [chains, provider]);
};

export default useDefaultProvider;
