import React, { useContext, useState } from 'react';
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
import AccountLayer from './layers/AccountLayer';
import YieldFooter from './components/YieldFooter';

function App() {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const { state: chainState, actions } = useContext(ChainContext);

  const [accountOpen, setAccountOpen] = useState<boolean>(false);

  return (
    <Box fill>
      <Header pad="medium" height="xsmall" justify="between">
        { !mobile && <Box background="brand" pad="xsmall"> <Text> YIELD</Text> </Box> }
        <YieldNavigation />

        <Box>
          {
          mobile
            ? <Text> = </Text>
            : <Box onClick={() => setAccountOpen(true)}> Account and vaults</Box>
          }
        </Box>
      </Header>

      <Main flex overflow="auto">
        <ToastContainer />
        { accountOpen && <AccountLayer close={() => setAccountOpen(false)} />}

        <Switch>
          <Route path="/borrow/:series?/:amnt?"> <Borrow /> </Route>
          <Route path="/lend/:series?/:amnt?"> <Lend /> </Route>
          <Route path="/pool/:series?/:amnt?"> <Pool /> </Route>
          <Route path="/*"> 404 </Route>
        </Switch>

      </Main>

      <YieldFooter />

    </Box>
  );
}

export default App;
