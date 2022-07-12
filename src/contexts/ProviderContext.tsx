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

    if (provider.chainId === 1)
      return new ethers.providers.AlchemyProvider(provider.chainId, process.env.ALCHEMY_MAINNET_KEY);

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

const ProviderContext = ({ children }: { children: any }) => (
  <Web3FallbackProvider getLibrary={getFallbackLibrary}>
    <Web3ReactProvider getLibrary={getLibrary}>{children}</Web3ReactProvider>
  </Web3FallbackProvider>
);

export default ProviderContext;
