import React, { useState, useContext } from 'react';

import { ethers } from 'ethers';
import { AppProps } from 'next/app';
import { ToastContainer } from 'react-toastify';
import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core';
import { deepMerge } from 'grommet/utils';
import { base, Box, Grommet, ResponsiveContext } from 'grommet';
import NetworkBanner from '../components/NetworkBanner';
import NetworkError from '../components/NetworkError';
import TransactionError from '../components/TransactionError';
import TransactionWidget from '../components/TransactionWidget';
import YieldHeader from '../components/YieldHeader';
import YieldMobileMenu from '../components/YieldMobileMenu';
import 'react-toastify/dist/ReactToastify.css';
import { useColorScheme } from '../hooks/useColorScheme';
import { ChainProvider } from '../contexts/ChainContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { UserProvider } from '../contexts/UserContext';
import { TxProvider } from '../contexts/TxContext';
import { HistoryProvider } from '../contexts/HistoryContext';

import { yieldTheme } from '../themes';

declare global {
  interface Window {
    gtag: any;
  }
}

/* this is only for walletConnect to work */
(window as any).global = window;
// eslint-disable-next-line global-require
(window as any).global.Buffer = (window as any).global.Buffer || require('buffer').Buffer;

/* Init the signing web3 environment */
function getLibrary(provider: ethers.providers.ExternalProvider, connector: any) {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 6000;
  return library;
}

/* Init the calling web3 environment */
const Web3FallbackProvider = createWeb3ReactRoot('fallback');

function getFallbackLibrary(provider: any) {
  const library: ethers.providers.JsonRpcProvider = new ethers.providers.JsonRpcProvider(
    process.env[`REACT_APP_RPC_URL_${provider.chainId}`]
  );
  library.pollingInterval = 6000;
  return library;
}

const App = ({ Component, pageProps }: AppProps) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const colorScheme = useColorScheme();

  /* LOCAL STATE */
  const [menuLayerOpen, setMenuLayerOpen] = useState<boolean>(false);

  return (
    // eslint-disable-next-line react/react-in-jsx-scope
    <Web3FallbackProvider getLibrary={getFallbackLibrary}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <ChainProvider>
          <SettingsProvider>
            <UserProvider>
              <TxProvider>
                <HistoryProvider>
                  <Grommet theme={deepMerge(base, yieldTheme)} themeMode={colorScheme} full>
                    <Box fill background="background">
                      <YieldHeader actionList={[() => setMenuLayerOpen(!menuLayerOpen)]} />
                      <NetworkBanner />
                      <TransactionWidget />
                      <NetworkError />
                      <TransactionError />
                      <ToastContainer position="top-right" />

                      <Box flex={!mobile} overflow="hidden">
                        {menuLayerOpen && <YieldMobileMenu toggleMenu={() => setMenuLayerOpen(!menuLayerOpen)} />}
                      </Box>
                      <Component {...pageProps} />
                    </Box>
                  </Grommet>
                </HistoryProvider>
              </TxProvider>
            </UserProvider>
          </SettingsProvider>
        </ChainProvider>
      </Web3ReactProvider>
    </Web3FallbackProvider>
  );
};

export default App;
