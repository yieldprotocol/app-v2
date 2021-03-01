import React, {useContext} from 'react';
import logo from './logo.svg';
import './App.css';
import { ChainContext } from './contexts/ChainContext';

function App() {
  const { state: chainState, actions } = useContext(ChainContext)
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        <button onClick={()=> actions.connect('injected') }> connect metamask </button>
        <button onClick={()=> actions.disconnect() }> disconnect metamask </button>
        <p>{chainState.account}</p>
        <p>{chainState.chainId}</p>
      </header>

    </div>
  );
}

export default App;
