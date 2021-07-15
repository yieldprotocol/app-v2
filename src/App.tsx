import React, { useContext, useState } from 'react';
import { Box, ResponsiveContext } from 'grommet';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Redirect, Route, Switch } from 'react-router-dom';

import Borrow from './views/Borrow';
import Lend from './views/Lend';
import Pool from './views/Pool';

import MenuLayer from './layers/MenuLayer';
import YieldFooter from './components/YieldFooter';
import Vault from './views/VaultPosition';
import YieldHeader from './components/YieldHeader';

function App() {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const [menuLayerOpen, setMenuLayerOpen] = useState<boolean>(false);

  return (
    <Box fill>
      <YieldHeader actionList={[() => setMenuLayerOpen(!menuLayerOpen)]} />
      <Box flex={!mobile} overflow="auto" margin={{ top: 'xlarge' }}>
        <ToastContainer />
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
          <Route exact path="/">
            <Redirect to="/borrow" />
          </Route>
          <Route path="/*"> 404 </Route>
        </Switch>
      </Box>
      <YieldFooter />
    </Box>
  );
}

export default App;
