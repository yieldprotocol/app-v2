import React, { useContext, useState, useEffect } from 'react';
import { Box, ResponsiveContext } from 'grommet';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import { UserContext } from './contexts/UserContext';

function App() {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: { chainData, error: chainError },
  } = useContext(ChainContext);
  const {
    userState: { error: userError },
  } = useContext(UserContext);

  /* LOCAL STATE */
  const [menuLayerOpen, setMenuLayerOpen] = useState<boolean>(false);

  useEffect(() => {
    chainError && toast.error(chainError);
    userError && toast.error(userError);
  }, [chainError, userError]);

  return (
    <Box fill>
      {chainData && !chainData.supported && <NetworkError />}

      <YieldHeader actionList={[() => setMenuLayerOpen(!menuLayerOpen)]} />

      <Box flex={!mobile} overflow="auto">
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
            <VaultPosition close={() => null} />
          </Route>

          <Route path="/lendposition/:id">
            <LendPosition close={() => null} />
          </Route>

          <Route path="/poolposition/:id">
            <PoolPosition close={() => null} />
          </Route>

          <Route path="/*"> 404 </Route>
        </Switch>
      </Box>
      <YieldFooter />
    </Box>
  );
}

export default App;
