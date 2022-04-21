import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core';
import { ethers } from 'ethers';
import { SUPPORTED_RPC_URLS } from '../config/chainData';

/* Init the signing web3 environment */
function getLibrary(provider: ethers.providers.ExternalProvider, connector: any) {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 6000;
  return library;
}

/* init the fallback web3 connection */
const Web3FallbackProvider = createWeb3ReactRoot('fallback');
function getFallbackLibrary(provider: any) {
    const library = new ethers.providers.JsonRpcProvider(SUPPORTED_RPC_URLS[provider.chainId]);
    library.pollingInterval = 6000;
    return library;
  }

const ProviderContext = ({ children } : { children: any }) => (
    <Web3FallbackProvider getLibrary={getFallbackLibrary}>
        <Web3ReactProvider getLibrary={getLibrary}>
            {children}
        </Web3ReactProvider>
    </Web3FallbackProvider>
  );
  
export default ProviderContext; 

