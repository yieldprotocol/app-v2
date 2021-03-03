import React, { useContext } from 'react';
import { Box, Button, Footer, Header, Main, Text, ThemeContext, ResponsiveContext } from 'grommet';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route, Switch } from 'react-router-dom';

import logo from './logo.svg';
import { mint } from './utils/yieldMath';

import { ChainContext } from './contexts/ChainContext';

// import Borrow from './containers/Borrow';
import Lend from './containers/Lend';
import Pool from './containers/Pool';

import YieldNavigation from './components/YieldNavigation';

function App() {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const { state: chainState, actions } = useContext(ChainContext);

  return (
    <Box>
      <Header pad="medium" height="xsmall" justify="between" border>

        { !mobile && <Box> <Text> Yield Title </Text> </Box> }

        <YieldNavigation />

        <Box>
          { mobile ? <Text> = </Text> : <Box> Account and vaults</Box> }
        </Box>
      </Header>

      <Box>
        <ToastContainer />

        <Main>

          <Switch>
            {/* <Route path="/borrow/:series?/:amnt?"> <Borrow /> </Route> */}
            <Route path="/lend/:series?/:amnt?"> <Lend /> </Route>
            <Route path="/pool/:series?/:amnt?"> <Pool /> </Route>
            <Route path="/*"> 404 </Route>
          </Switch>

          <img src={logo} className="App-logo" alt="logo" />
          <Button type="button" onClick={() => actions.connect('injected')} label="Connect web3" />
          <Button type="button" onClick={() => actions.disconnect()} label="Disconnect web3" />
          <p>{chainState.account}</p>
          <p>{chainState.chainId}</p>
          <p>
            something
            { mint('2234', '3122', '2000', '123').toString() }
          </p>
          <Button primary onClick={() => toast.error('Hello')} label="Notify Example" />

        </Main>

        <Footer />
      </Box>
    </Box>
  );
}

export default App;
