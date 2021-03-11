import React, { useContext, useRef, useState } from 'react';
import { Box, Button, Footer, Header, Main, Text, ThemeContext, ResponsiveContext } from 'grommet';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route, Switch } from 'react-router-dom';

import logo from './logo.svg';
import { mint } from './utils/yieldMath';

import { ChainContext } from './contexts/ChainContext';

import Borrow from './views/Borrow';
import Lend from './views/Lend';
import Pool from './views/Pool';

import YieldNavigation from './components/YieldNavigation';
import MenuLayer from './layers/MenuLayer';
import YieldFooter from './components/YieldFooter';
import Vault from './views/Vault';
import YieldHeader from './components/YieldHeader';
import Markets from './views/Markets';

function App() {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const [menuLayerOpen, setMenuLayerOpen] = useState<boolean>(false);

  return (
    <Box fill>
      <YieldHeader actionList={[() => setMenuLayerOpen(!menuLayerOpen)]} />

      <Box flex={!mobile} overflow="auto" margin={{ top: 'xlarge' }}>
        <ToastContainer />
        { menuLayerOpen && <MenuLayer toggleMenu={() => setMenuLayerOpen(!menuLayerOpen)} />}
        <Switch>
          <Route path="/borrow/:series?/:asset?/:amnt?"> <Borrow /> </Route>
          <Route path="/lend/:series?/:asset?/:amnt?"> <Lend /> </Route>
          <Route path="/pool/:series?/:asset?/:amnt?"> <Pool /> </Route>
          <Route path="/vault/:vault?/:series?"> <Vault /> </Route>
          <Route path="/markets"> <Markets /> </Route>
          <Route path="/*"> 404 </Route>
        </Switch>
      </Box>

      <YieldFooter />

    </Box>
  );
}

export default App;
