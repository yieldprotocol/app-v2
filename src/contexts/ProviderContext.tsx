import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core';
import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { IChainContext, IUserContext } from '../types';
import { ChainContext } from './ChainContext';
import { UserContext } from './UserContext';

const getTenderlyProvider = () => new ethers.providers.JsonRpcProvider(process.env.TENDERLY_JSON_RPC_URL);

/* Init the signing web3 environment */
export function getLibrary(provider: ethers.providers.ExternalProvider) {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 6000;
  return library;
}

/* init the fallback web3 connection */
const Web3FallbackProvider = createWeb3ReactRoot('fallback');
export function getFallbackLibrary(provider: any) {
  try {
    if (provider.chainId === 42161)
      return new ethers.providers.AlchemyProvider(provider.chainId, process.env.ALCHEMY_ARBITRUM_KEY);

    if (provider.chainId === 421611)
      return new ethers.providers.AlchemyProvider(provider.chainId, process.env.ALCHEMY_ARBITRUM_RINKEBY_KEY);

    const library = new ethers.providers.InfuraProvider(provider.chainId, process.env.INFURA_KEY);
    library.pollingInterval = 6000;
    return library;
  } catch (e) {
    if (provider.chainId === 1) {
      console.log('Could not connect to infura provider on mainnet, trying alchemy');
      const library = new ethers.providers.AlchemyProvider(provider.chainId, process.env.ALCHEMY_MAINNET_KEY);
      library.pollingInterval = 6000;
      return library;
    }
    console.log('Could not connect to fallback provider');
    return undefined;
  }
}

const ProviderContext = ({ children }: { children: any }) => {
  const { chainState } = useContext(ChainContext) as IChainContext;
  const { chainLoading } = chainState;

  const { userState } = useContext(UserContext) as IUserContext;
  const { userLoading, seriesMap, strategyMap, assetMap } = userState;

  const [allDataUpdated, setAllDataUpdated] = useState<boolean>(false);

  const _getFallbackLibrary = () => (allDataUpdated ? getTenderlyProvider : getFallbackLibrary);
  const _getLibrary = () => (allDataUpdated ? getTenderlyProvider : getLibrary);

  useEffect(() => {
    setAllDataUpdated(!chainLoading && !userLoading && !!seriesMap.size && !!strategyMap.size && !!assetMap.size);
  }, [assetMap.size, chainLoading, seriesMap.size, strategyMap.size, userLoading]);

  useEffect(() => {
    console.log('🦄 ~ file: ProviderContext.tsx ~ line 48 ~ ProviderContext ~ allDataUpdate', allDataUpdated);
  }, [allDataUpdated]);

  return (
    <Web3FallbackProvider getLibrary={_getFallbackLibrary}>
      <Web3ReactProvider getLibrary={_getLibrary}>{children}</Web3ReactProvider>
    </Web3FallbackProvider>
  );
};

export default ProviderContext;
