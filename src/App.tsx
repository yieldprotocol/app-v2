import React, { useContext, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Box, ResponsiveContext, Grommet, base } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { yieldTheme } from './themes';

import YieldHeader from './components/YieldHeader';
import NetworkError from './components/NetworkError';
import TransactionWidget from './components/TransactionWidget';
import NetworkBanner from './components/NetworkBanner';
import YieldMobileMenu from './components/YieldMobileMenu';
import { useColorScheme } from './hooks/useColorScheme';
import TransactionError from './components/TransactionError';

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
    <Grommet theme={deepMerge(base, yieldTheme)} themeMode={colorScheme} full>
      <App />
    </Grommet>
  );
};

export default WrappedApp;
