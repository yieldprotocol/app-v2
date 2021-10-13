import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { LedgerConnector } from '@web3-react/ledger-connector';
import { NetworkConnector } from '@web3-react/network-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useCachedState } from './generalHooks';
// import { ChainContext } from '../contexts/ChainContext';

/* Set up web3react config */
const POLLING_INTERVAL = 12000;
const RPC_URLS: { [chainId: number]: string } = {
  1: process.env.REACT_APP_RPC_URL_1 as string,
  42: process.env.REACT_APP_RPC_URL_42 as string,
};

const CHAIN_INFO = new Map<number, { name: string; color: string; supported: boolean }>();
CHAIN_INFO.set(1, { name: 'Mainnet', color: '#29b6af', supported: false });
CHAIN_INFO.set(3, { name: 'Ropsten', color: '#ff4a8d', supported: false });
CHAIN_INFO.set(4, { name: 'Rinkeby', color: '#f6c343', supported: false });
CHAIN_INFO.set(5, { name: 'Goerli', color: '#3099f2', supported: false });
CHAIN_INFO.set(10, { name: 'Optimism', color: '#EB0822', supported: false });
CHAIN_INFO.set(42, { name: 'Kovan', color: '#7F7FFE', supported: true });

// Map the provider connection url name to a nicer format
const CONNECTOR_NAMES = new Map([
  ['metamask', 'Metamask'],
  ['ledgerWithMetamask', 'Ledger (with Metamask)'],
  ['ledger', 'Ledger'],
  ['walletconnect', 'WalletConnect'],
]);

const INIT_INJECTED = 'metamask';

const CONNECTORS = new Map();
CONNECTORS.set(
  INIT_INJECTED,
  new InjectedConnector({
    supportedChainIds: [1, 42],
  })
);
CONNECTORS.set(
  'walletconnect',
  new WalletConnectConnector({
    rpc: { 1: RPC_URLS[1], 42: RPC_URLS[42] },
    bridge: 'https://bridge.walletconnect.org',
    qrcode: true,
    pollingInterval: POLLING_INTERVAL,
  })
);
CONNECTORS.set(
  'ledger',
  new LedgerConnector({
    chainId: 1,
    url: RPC_URLS[1],
    pollingInterval: POLLING_INTERVAL,
  })
);

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useConnection = () => {
  const [tried, setTried] = useState<boolean>(false);
  const [connectOnLoad, setConnectOnLoad] = useState<boolean>(true);
  const [chainInfo, setChainInfo] = useState<any>();

  /* CACHED VARIABLES */
  const [lastChainId, setLastChainId] = useCachedState('lastChainId', 42);

  const primaryConnection = useWeb3React<ethers.providers.Web3Provider>();
  const { connector, library:provider, chainId, account, activate, deactivate, active } = primaryConnection;

  const fallbackConnection = useWeb3React<ethers.providers.JsonRpcProvider>('fallback');
  const { library: fallbackProvider, chainId: fallbackChainId, activate: fallbackActivate } = fallbackConnection;

  const isConnected = useCallback((connection: string) => CONNECTORS.get(connection) === connector, [connector]);
  const connect = useCallback((connection: string = INIT_INJECTED) => activate(CONNECTORS.get(connection)), [activate]);
  const disconnect = useCallback(() => connector && deactivate(), [connector, deactivate]);

  /*
      Watch the chainId for changes (most likely instigated by metamask),
      and change the FALLBACK provider accordingly.
      NOTE: Currently, there is no way to change the fallback provider manually, but the last chainId is cached.
  */
  useEffect(() => {
    const _chainId = chainId || lastChainId;
    /* cache the change of networkId */
    chainId && setLastChainId(chainId);
    /* Connect the fallback */
    tried &&
      fallbackActivate(
        new NetworkConnector({
          urls: { 1: RPC_URLS[1], 42: RPC_URLS[42] },
          defaultChainId: _chainId,
        }),
        (e: any) => console.log(e),
        true
      );
    /* Handle chain changes  -> complete refresh */
    if (chainId && chainId !== lastChainId) {
      window.localStorage.clear();
      // eslint-disable-next-line no-restricted-globals
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, fallbackActivate, lastChainId, tried]);

  /**
   * Try connect automatically to an injected provider on first load
   * */
  useEffect(() => {
    connectOnLoad &&
      !active &&
      CONNECTORS.get(INIT_INJECTED)
        .isAuthorized()
        .then((isAuthorized: boolean) => {
          if (isAuthorized) {
            activate(CONNECTORS.get(INIT_INJECTED), undefined, true).catch(() => {
              setTried(true);
            });
          } else {
            setTried(true); // just move on do nothing nore
          }
        });
  }, [activate, connectOnLoad, active]);

  /* If web3 connected, wait until we get confirmation of that to flip the flag */
  useEffect(() => {
    if (!tried && active) {
      setTried(true);
    }
  }, [tried, active]);

  /* Handle logic to recognize the connector currently being activated */
  const [activatingConnector, setActivatingConnector] = useState<any>();

  useEffect(() => {
    activatingConnector && activatingConnector === connector && setActivatingConnector(undefined);
  }, [activatingConnector, connector]);

  useEffect(() => {
    if (chainId && CHAIN_INFO.has(chainId)) {
      setChainInfo(CHAIN_INFO.get(chainId));
    }
  }, [chainId]);

  return {
    
    connectionState: {
      /* constants */
      CONNECTORS,
      CHAIN_INFO,
      CONNECTOR_NAMES,
      
      /* connections */
      connector,
      provider,
      fallbackProvider,
      chainId,
      fallbackChainId,

      chainInfo,
      account,
      active,

      activatingConnector,
    },

    connectionActions: {
      connect,
      disconnect,
      isConnected,
    },
  };
};
