import React, { FC, ReactElement } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { ethers } from 'ethers';

import { render, RenderOptions } from '@testing-library/react';
import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core';
import { ChainProvider } from '../contexts/ChainContext';
import { TxProvider } from '../contexts/TxContext';
import { UserProvider } from '../contexts/UserContext';

/* Init the signing web3 environment */
function getLibrary(provider: ethers.providers.ExternalProvider, connector: any) {
  const library = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL_31337 as string);
  library.pollingInterval = 12000;
  return library;
}

/* Init the calling web3 environment */
const Web3FallbackProvider = createWeb3ReactRoot('fallback');

function getFallbackLibrary(provider: any, connector: any) {
  const library = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL_31337 as string);
  library.pollingInterval = 12000;
  return library;
}

const AllTheProviders: FC = ({ children }) => (
  <Router>
    <Web3FallbackProvider getLibrary={getFallbackLibrary}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <ChainProvider>
          <UserProvider>
            <TxProvider>
              {children}
            </TxProvider>
          </UserProvider>
        </ChainProvider>
      </Web3ReactProvider>
    </Web3FallbackProvider>
  </Router>
);

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';

export { customRender as render };
