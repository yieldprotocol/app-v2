import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { AppProps } from 'next/app';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';

const Web3FallbackProvider = dynamic(() => import('../contexts/FallbackProvider'), { ssr: false });
const Web3ReactProvider = dynamic(() => import('../contexts/Web3ReactProvider'), { ssr: false });
const DynamicChainProvider = dynamic(() => import('../contexts/ChainContext'), { ssr: false });
const DynamicSettingsProvider = dynamic(() => import('../contexts/SettingsContext'), { ssr: false });
const DynamicUserProvider = dynamic(() => import('../contexts/UserContext'), { ssr: false });
const DynamicTxProvider = dynamic(() => import('../contexts/TxContext'), { ssr: false });
const DynamicPriceProvider = dynamic(() => import('../contexts/PriceContext'), { ssr: false });
const DynamicHistoryProvider = dynamic(() => import('../contexts/HistoryContext'), { ssr: false });
const DynamicGrommet = dynamic(() => import('../contexts/GrommetProvider'), { ssr: false });
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
        <DynamicChainProvider>
          <DynamicSettingsProvider>
            <DynamicUserProvider>
              <DynamicTxProvider>
                <DynamicPriceProvider>
                  <DynamicHistoryProvider>
                    <DynamicGrommet>
                      <DynamicLayout>
                        <Component {...pageProps} />
                      </DynamicLayout>
                    </DynamicGrommet>
                  </DynamicHistoryProvider>
                </DynamicPriceProvider>
              </DynamicTxProvider>
            </DynamicUserProvider>
          </DynamicSettingsProvider>
        </DynamicChainProvider>
      </Web3ReactProvider>
    </Web3FallbackProvider>
  );
};

export default App;
