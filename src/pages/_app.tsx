import dynamic from 'next/dynamic';
import { useContext, useEffect, useState } from 'react';
import { AppProps } from 'next/app';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';
import { IChainContext, IUserContext } from '../types';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';

const ProviderContext = dynamic(() => import('../contexts/ProviderContext'), { ssr: false });

const DynamicChainProvider = dynamic(() => import('../contexts/ChainContext'), { ssr: false }); // this is set to true now
const DynamicSettingsProvider = dynamic(() => import('../contexts/SettingsContext'), { ssr: false });
const DynamicUserProvider = dynamic(() => import('../contexts/UserContext'), { ssr: false });
const DynamicTxProvider = dynamic(() => import('../contexts/TxContext'), { ssr: false });
const DynamicPriceProvider = dynamic(() => import('../contexts/PriceContext'), { ssr: false });
const DynamicHistoryProvider = dynamic(() => import('../contexts/HistoryContext'), { ssr: false });
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
    <ProviderContext dataUpdated={allDataUpdated}>
      <DynamicChainProvider>
        <DynamicSettingsProvider>
          <DynamicUserProvider>
            <DynamicTxProvider>
              <DynamicPriceProvider>
                <DynamicHistoryProvider>
                  <DynamicLayout>
                    <Component {...pageProps} />
                  </DynamicLayout>
                </DynamicHistoryProvider>
              </DynamicPriceProvider>
            </DynamicTxProvider>
          </DynamicUserProvider>
        </DynamicSettingsProvider>
      </DynamicChainProvider>
    </ProviderContext>
  );
};

export default App;
