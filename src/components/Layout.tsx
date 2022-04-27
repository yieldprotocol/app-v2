import dynamic from 'next/dynamic';
import Script from 'next/script';
import Head from 'next/head';
import { base, Grommet, ResponsiveContext, Box } from 'grommet';
import { FC, useContext, useState } from 'react';
import { ToastContainer } from 'react-toastify';

import { deepMerge } from 'grommet/utils';
import { useColorScheme } from '../hooks/useColorScheme';
import { yieldTheme } from '../themes';

// get dynaimc imports for applicable components (to account for non-ssr)
const DynamicYieldHeader = dynamic(() => import('./YieldHeader'), { ssr: false });
const DynamicYieldMobileMenu = dynamic(() => import('./YieldMobileMenu'), { ssr: false });
const DynamicNetworkBanner = dynamic(() => import('./NetworkBanner'), { ssr: false });
const DynamicNetworkError = dynamic(() => import('./NetworkError'), { ssr: false });
const DynamicTransactionWidget = dynamic(() => import('./TransactionWidget'), { ssr: false });
const DynamicTransactionError = dynamic(() => import('./TransactionError'), { ssr: false });

const Layout: FC = ({ children }) => {
  const [menuLayerOpen, setMenuLayerOpen] = useState<boolean>(false);
  const colorScheme = useColorScheme();

  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-QGLQ100R01" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`if ('%NODE_ENV%' !== 'development') {
            console.log('PRODUCTION MODE');
            window.dataLayer = window.dataLayer || [];
          function gtag() {
            dataLayer.push(arguments);
          }
          gtag('js', new Date());
          gtag('config', 'G-QGLQ100R01');
        } else {
          console.log('%NODE_ENV% mode'.toUpperCase()) // development
        }`}
      </Script>
      <Head>
        <title>Yield Protocol App</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="Yield Protocol App" content="Yield App v2" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/favicons/site.webmanifest" />
      </Head>

      <Grommet theme={deepMerge(base, yieldTheme) as any} themeMode={colorScheme} full>
        <Box fill background="background">
          <DynamicYieldHeader actionList={[() => setMenuLayerOpen(!menuLayerOpen)]} />
          <DynamicNetworkBanner />
          <DynamicTransactionWidget />
          <DynamicNetworkError />
          <DynamicTransactionError />
          <ToastContainer position="top-right" />
          <Box overflow="hidden">
            {menuLayerOpen && <DynamicYieldMobileMenu toggleMenu={() => setMenuLayerOpen(!menuLayerOpen)} />}
          </Box>
          {children}
        </Box>
      </Grommet>
    </>
  );
};

export default Layout;
