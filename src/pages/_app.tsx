import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { AppProps } from 'next/app';
import { ChainProvider } from '../contexts/ChainContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { UserProvider } from '../contexts/UserContext';
import { TxProvider } from '../contexts/TxContext';
import { HistoryProvider } from '../contexts/HistoryContext';
import { PriceProvider } from '../contexts/PriceContext';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';

const Web3FallbackProvider = dynamic(() => import('../contexts/FallbackProvider'), { ssr: false });
const Web3ReactProvider = dynamic(() => import('../contexts/Web3ReactProvider'), { ssr: false });
const Grommet = dynamic(() => import('../contexts/GrommetProvider'), { ssr: false });
const DynamicLayout = dynamic(() => import('../components/Layout'), { ssr: false });

declare global {
  interface Window {
    gtag: any;
  }
}

const App = ({ Component, pageProps }: AppProps) => {
  useEffect(() => {
    /* this is only for walletConnect to work */
    if (typeof window !== 'undefined') {
      (window as any).global = window;
      // eslint-disable-next-line global-require
      (window as any).global.Buffer = (window as any).global.Buffer || require('buffer').Buffer;
    }
  }, []);

  return (
    <Web3FallbackProvider>
      <Web3ReactProvider>
        <ChainProvider>
          <SettingsProvider>
            <UserProvider>
              <TxProvider>
                <PriceProvider>
                  <HistoryProvider>
                    <Grommet>
                      <DynamicLayout>
                        <Component {...pageProps} />
                      </DynamicLayout>
                    </Grommet>
                  </HistoryProvider>
                </PriceProvider>
              </TxProvider>
            </UserProvider>
          </SettingsProvider>
        </ChainProvider>
      </Web3ReactProvider>
    </Web3FallbackProvider>
  );
};

export default App;
