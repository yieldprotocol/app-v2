import React, { useContext, useState, Suspense, lazy } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Redirect, Route, Switch } from 'react-router-dom';

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

const Borrow = lazy(() => import('./views/Borrow'));
const Lend = lazy(() => import('./views/Lend'));
const Pool = lazy(() => import('./views/Pool'));
const Dashboard = lazy(() => import('./views/Dashboard'));

const VaultPosition = lazy(() => import('./views/VaultPosition'));
const LendPosition = lazy(() => import('./views/LendPosition'));
const PoolPosition = lazy(() => import('./views/PoolPosition'));

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
        <Suspense fallback={<Box />}>
          <Switch>
            <Route path="/borrow/:series?/:asset?/:amnt?">
              <Borrow />
            </Route>

            <Route path="/lend/:series?/:asset?/:amnt?">
              <Lend />
            </Route>

            <Route path="/pool/:series?/:asset?/:amnt?">
              <Pool />
            </Route>

            <Route path="/dashboard">
              <Dashboard />
            </Route>

            <Route exact path="/">
              <Redirect to="/borrow" />
            </Route>

            <Route path="/vaultposition/:id">
              <VaultPosition />
            </Route>

            <Route path="/lendposition/:id">
              <LendPosition />
            </Route>

            <Route path="/poolposition/:id">
              <PoolPosition />
            </Route>

            <Route path="/*"> 404 </Route>
          </Switch>
        </Suspense>
      </Box>
    </Box>
  );
}

const WrappedApp = () => {
  const colorScheme = useColorScheme();
  return (
    <Suspense fallback={null}>
      <Grommet theme={deepMerge(base, yieldTheme)} themeMode={colorScheme} full>
        <App />
      </Grommet>
    </Suspense>
  );
};

export default WrappedApp;
