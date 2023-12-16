import { AlchemyProvider } from '@ethersproject/providers';
import { useMemo } from 'react';
import { useNetwork } from 'wagmi';


// default provider always uses the non-fork provider and the non-fork chainId
const useDefaultProvider = () => {
  const {chain} = useNetwork();
  const key = chain?.id === 1 ? process.env.ALCHEMY_MAINNET_KEY! : process.env.ALCHEMY_ARBITRUM_KEY!;
  return useMemo(() => new AlchemyProvider(chain?.id, key), [chain?.id, key]);
};

export default useDefaultProvider;
