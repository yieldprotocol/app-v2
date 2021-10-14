import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import {
  InjectedConnector,
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';

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
CONNECTORS.set(
  'ledgerWithMetamask',
  new InjectedConnector({
    supportedChainIds: [1, 42],
  })
);

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useConnection = () => {
  const [tried, setTried] = useState<boolean>(false);
  const [connectOnLoad, setConnectOnLoad] = useState<boolean>(true);

  const [currentChainInfo, setCurrentChainInfo] = useState<any>();
  const [chainSupported, setChainSupported] = useState<boolean>(false);

  /* CACHED VARIABLES */
  const [lastChainId, setLastChainId] = useCachedState('lastChainId', 42);

  const primaryConnection = useWeb3React<ethers.providers.Web3Provider>();
  const { connector, library: provider, chainId, account, activate, deactivate, active } = primaryConnection;

  const fallbackConnection = useWeb3React<ethers.providers.JsonRpcProvider>('fallback');
  const { library: fallbackProvider, chainId: fallbackChainId, activate: fallbackActivate } = fallbackConnection;

  /* extra hooks */ 
  const { handleErrorMessage } = useWeb3Errors();


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
        (e: any) => handleErrorMessage(e),
        true
      );

    /* Handle chain changes  -> clear cache */
    if (chainId && chainId !== lastChainId) {
      window.localStorage.clear();
    }

    setCurrentChainInfo(CHAIN_INFO.get(_chainId));

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
            activate(CONNECTORS.get(INIT_INJECTED), (e:any)=> handleErrorMessage(e) , true).catch(() => {
              setTried(true);
            });
          } else {
            setTried(true); // just move on do nothing nore
          }
        });
  }, [activate, connectOnLoad, active, handleErrorMessage]);

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

  useEffect(() => {}, [chainId]);


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

      chainSupported,

      currentChainInfo,
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

// TODO better error handling */ 
const useWeb3Errors = ()=> {
  const NO_BROWSER_EXT = 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
  const UNSUPPORTED_NETWORK = 'Your Wallet or Browser is connected to an unsupported network.';
  const UNAUTHORISED_SITE = 'Please authorize this website to access your Ethereum account.';
  const UNKNOWN_ERROR = 'An unknown error occurred. Check the console for more details.';
  const handleErrorMessage = (error: Error) => {
    if (error instanceof NoEthereumProviderError) {
      // eslint-disable-next-line no-console
      console.log(NO_BROWSER_EXT);
      return NO_BROWSER_EXT;
    }
    if (error instanceof UnsupportedChainIdError) {
      // eslint-disable-next-line no-console
      console.log(UNSUPPORTED_NETWORK);
      return UNSUPPORTED_NETWORK;
    }
    if (
      error instanceof UserRejectedRequestErrorInjected // || error instanceof UserRejectedRequestErrorWalletConnect || error instanceof UserRejectedRequestErrorFrame
    ) {
      return UNAUTHORISED_SITE;
    }
    // eslint-disable-next-line no-console
    console.error(error);
    return  UNKNOWN_ERROR;
  };
  return { handleErrorMessage };
};
