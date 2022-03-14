import { useContext, useState } from 'react';
import { ethers } from 'ethers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Box, ResponsiveContext, Grommet, base } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core';
import { yieldTheme } from './themes';

import YieldHeader from './components/YieldHeader';
import NetworkError from './components/NetworkError';
import TransactionWidget from './components/TransactionWidget';
import NetworkBanner from './components/NetworkBanner';
import YieldMobileMenu from './components/YieldMobileMenu';
import { useColorScheme } from './hooks/useColorScheme';
import TransactionError from './components/TransactionError';

import { ChainProvider } from './contexts/ChainContext';
import { TxProvider } from './contexts/TxContext';
import { UserProvider } from './contexts/UserContext';
import { HistoryProvider } from './contexts/HistoryContext';
import { SettingsProvider } from './contexts/SettingsContext';

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

function App() {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* LOCAL STATE */
  const [menuLayerOpen, setMenuLayerOpen] = useState<boolean>(false);

  return (
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
    </Box>
  );
}

const WrappedApp = () => {
  const colorScheme = useColorScheme();
  return (
    <Web3FallbackProvider getLibrary={getFallbackLibrary}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <ChainProvider>
          <SettingsProvider>
            <UserProvider>
              <TxProvider>
                <HistoryProvider>
                  <Grommet theme={deepMerge(base, yieldTheme)} themeMode={colorScheme} full>
                    <App />
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

export default WrappedApp;
