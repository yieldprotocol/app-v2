import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { NetworkConnector } from '@web3-react/network-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { useCachedState } from '../hooks';

/* Set up web3react config */
const POLLING_INTERVAL = 12000;
const RPC_URLS: { [chainId: number]: string } = {
  1: process.env.REACT_APP_RPC_URL_1 as string,
  42: process.env.REACT_APP_RPC_URL_42 as string,
  31337: process.env.REACT_APP_RPC_URL_31337 as string,
};

const connectors = new Map();

connectors.set(
  'injected',
  new InjectedConnector({
    supportedChainIds: [1, 42, 31337],
  }),
);
connectors.set(
  'walletconnect',
  new WalletConnectConnector({
    rpc: { 1: RPC_URLS[1] },
    bridge: 'https://bridge.walletconnect.org',
    qrcode: true,
    pollingInterval: POLLING_INTERVAL,
  }),
);
// connectors.set(
//   'network',
//   new NetworkConnector({
//     urls: { 1: RPC_URLS[1], 42: RPC_URLS[42], 31337: RPC_URLS[31337] },
//     defaultChainId: 1
//   })
// )

/* Build the context */
const ChainContext = React.createContext<any>({});

const initState = {
  chainId: 1 as number,
  provider: null as ethers.providers.Web3Provider | null,
  fallbackProvider: null as ethers.providers.Web3Provider | null,
  signer: null as ethers.providers.JsonRpcSigner | null,
  account: null as string | null,
  web3Active: false as boolean,
  fallbackActive: false as boolean,
  /* settings */
  connectOnLoad: true as boolean,
};

function chainReducer(state: any, action: any) {
  /* Helper: only change the state if different from existing */
  const onlyIfChanged = (_action: any) => (
    state[action.type] === _action.payload
      ? state[action.type]
      : _action.payload
  );

  /* Reducer switch */
  switch (action.type) {
    case 'provider': return { ...state, provider: onlyIfChanged(action) };
    case 'fallbackProvider': return { ...state, fallbackProvider: onlyIfChanged(action) };
    case 'signer': return { ...state, signer: onlyIfChanged(action) };
    case 'chainId': return { ...state, chainId: onlyIfChanged(action) };
    case 'account': return { ...state, account: onlyIfChanged(action) };
    case 'web3Active': return { ...state, web3Active: onlyIfChanged(action) };
    case 'fallbackActive': return { ...state, fallbackActive: onlyIfChanged(action) };
    /* special internal case for multi-updates - might remove from this context if not needed */
    case '_any': return { ...state, ...action.payload };
    default:
      return state;
  }
}

const ChainProvider = ({ children }: any) => {
  const [state, updateState] = React.useReducer(chainReducer, initState);
  const [lastChainId, setLastChainId] = useCachedState('lastChainId', 1);
  const primaryConnection = useWeb3React<ethers.providers.Web3Provider>();
  const {
    connector, library, chainId, account, activate, deactivate, active, error,
  } = primaryConnection;

  const fallbackConnection = useWeb3React<ethers.providers.JsonRpcProvider>('fallback');
  const {
    library: fallbackLibrary,
    chainId: fallbackChainId,
    activate: fallbackActivate,
    active: fallbackActive,
    error: fallbackError,
  } = fallbackConnection;

  /* Update state chainContext when primaryConnection (likely metamask/walletConnect) updates */
  useEffect(() => {
    updateState({ type: 'chainId', payload: chainId });
    updateState({ type: 'provider', payload: library || null });
    updateState({ type: 'web3Active', payload: active });
    updateState({ type: 'account', payload: account || null });
    updateState({ type: 'signer', payload: library?.getSigner(account!) || null });
  }, [chainId, account, library, active]);

  /*
      Watch the chainId for changes (most likely instigated by metamask),
      and change the FALLBACK provider accordingly.
      NOTE: Currently, there is no way to change the fallback provider manually, but the last chainId is cached.
  */
  useEffect(() => {
    /* cache the change of networkId */
    if (chainId) {
      setLastChainId(chainId);
      chainId !== fallbackChainId && (async () => fallbackActivate(
        new NetworkConnector({
          urls: { 1: RPC_URLS[1], 42: RPC_URLS[42], 31337: RPC_URLS[31337] },
          defaultChainId: chainId || lastChainId,
        }), (e:any) => console.log(e), true,
      )
      )();
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, fallbackActivate, lastChainId]);

  /* Update context state when fallbackConnection changes */
  useEffect(() => {
    updateState({ type: 'fallbackProvider', payload: fallbackLibrary || null });
    updateState({ type: 'fallbackActive', payload: fallbackActive });
    fallbackChainId && console.log('fallback chainID :', fallbackChainId);
  }, [fallbackLibrary, fallbackActive, fallbackChainId]);

  /* Handle logic to recognize the connector currently being activated */
  const [activatingConnector, setActivatingConnector] = useState<any>();
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  /* Try connect automatically to an injected provider on first load */
  const [tried, setTried] = useState<boolean>(false);
  useEffect(() => {
    state.connectOnLoad && connectors.get('injected').isAuthorized().then((isAuthorized: boolean) => {
      if (isAuthorized) {
        activate(connectors.get('injected'), undefined, true).catch(() => {
          setTried(true);
        });
      } else {
        setTried(true);
      }
    });
  }, [activate, state.connectOnLoad]);
  /* If web3 connected, wait until we get confirmation of that to flip the flag */
  useEffect(() => { if (!tried && active) { setTried(true); } }, [tried, active]);

  const actions = {
    isConnected: (connection:string) => connectors.get(connection) === connector,
    connect: (connection:string) => activate(connectors.get(connection)),
    disconnect: () => connector && deactivate(),
  };

  return (
    <ChainContext.Provider value={{ state, actions }}>
      {children}
    </ChainContext.Provider>
  );
};

export { ChainContext, ChainProvider };
