import { createWeb3ReactRoot } from '@web3-react/core';
import { ethers } from 'ethers';
import { SUPPORTED_RPC_URLS } from '../config/chainData';

const Web3FallbackProvider = createWeb3ReactRoot('fallback');

function getFallbackLibrary(provider: any) {
  const library = new ethers.providers.JsonRpcProvider(SUPPORTED_RPC_URLS[provider.chainId]);
  library.pollingInterval = 6000;
  return library;
}

const Web3FallbackProviderForSSR = ({ children } : { children: any }) => (
  <Web3FallbackProvider getLibrary={getFallbackLibrary}>{children}</Web3FallbackProvider>
);

export default Web3FallbackProviderForSSR;
