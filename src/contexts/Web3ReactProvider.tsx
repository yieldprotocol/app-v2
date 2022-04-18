import { Web3ReactProvider } from '@web3-react/core';
import { ethers } from 'ethers';

/* Init the signing web3 environment */
function getLibrary(provider: ethers.providers.ExternalProvider, connector: any) {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 6000;
  return library;
}

const Web3ReactProviderForSSR = ({ children }: { children: any }) => (
  <Web3ReactProvider getLibrary={getLibrary}>{children}</Web3ReactProvider>
);

export default Web3ReactProviderForSSR;
