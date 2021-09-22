import React, { useContext, useState } from 'react';
import { Box, ResponsiveContext } from 'grommet';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ParticlesBg from 'particles-bg';

import { Redirect, Route, Switch } from 'react-router-dom';
import { ChainContext } from './contexts/ChainContext';

import Borrow from './views/Borrow';
import Lend from './views/Lend';
import Pool from './views/Pool';
import Dashboard from './views/Dashboard';

import MenuLayer from './layers/MenuLayer';
import YieldFooter from './components/YieldFooter';
import VaultPosition from './views/VaultPosition';
import YieldHeader from './components/YieldHeader';
import NetworkError from './components/NetworkError';
import LendPosition from './views/LendPosition';
import PoolPosition from './views/PoolPosition';
import TransactionWidget from './components/TransactionWidget';

function App() {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: { chainData, chainId },
  } = useContext(ChainContext);

  /* LOCAL STATE */
  const [menuLayerOpen, setMenuLayerOpen] = useState<boolean>(false);

  return (
    <>
      {/* <ParticlesBg type="circle" num={7} bg={true} /> */}
      {/* "color"
          "ball"‰
          "lines"
          "thick"
          "circle"
          "cobweb"
          "polygon"
          "square"
          "tadpole"
          "fountain"
          "random"
          "custom" */}

      <Box fill>
        {(!chainData || !chainData.get(chainId).supported) && <NetworkError />}

        <YieldHeader actionList={[() => setMenuLayerOpen(!menuLayerOpen)]} />
        <TransactionWidget />

        <Box flex={!mobile} overflow="hidden">
          <ToastContainer position="top-center" />
          {menuLayerOpen && <MenuLayer toggleMenu={() => setMenuLayerOpen(!menuLayerOpen)} />}
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
        </Box>
        <YieldFooter />
      </Box>
    </>
  );
}

export default App;
