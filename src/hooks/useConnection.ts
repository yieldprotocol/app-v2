import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import {
  InjectedConnector,
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';
import {
  WalletConnectConnector,
  UserRejectedRequestError as UserRejectedRequestErrorWalletConnect,
} from '@web3-react/walletconnect-connector';

import { NetworkConnector } from '@web3-react/network-connector';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useCachedState } from './generalHooks';

import MetamaskMark from '../components/logos/MetamaskMark';
import LedgerMark from '../components/logos/LedgerMark';
import WalletconnectMark from '../components/logos/WalletconnectMark';
// import TrezorMark from '../components/logos/TrezorMark';

const NO_BROWSER_EXT =
  'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
const UNSUPPORTED_NETWORK = 'Your Wallet or Browser is connected to an unsupported network.';
const UNAUTHORISED_SITE = 'Please authorize this website to access your Ethereum account.';
const UNKNOWN_ERROR = 'An unknown error occurred. Check the console for more details.';

/* Set up web3react config */
const RPC_URLS: { [chainId: number]: string } = {
  1: process.env.REACT_APP_RPC_URL_1 as string,
  42: process.env.REACT_APP_RPC_URL_42 as string,
};

const CHAIN_INFO = new Map<number, { name: string; color: string }>();
CHAIN_INFO.set(1, { name: 'Mainnet', color: '#29b6af' });
CHAIN_INFO.set(3, { name: 'Ropsten', color: '#ff4a8d' });
CHAIN_INFO.set(4, { name: 'Rinkeby', color: '#f6c343' });
CHAIN_INFO.set(5, { name: 'Goerli', color: '#3099f2' });
CHAIN_INFO.set(10, { name: 'Optimism', color: '#EB0822' });
CHAIN_INFO.set(42, { name: 'Kovan', color: '#7F7FFE' });

const CONNECTOR_INFO = new Map<string, { displayName: string; image: any }>();
CONNECTOR_INFO.set('metamask', { displayName: 'Metamask', image: MetamaskMark });
CONNECTOR_INFO.set('ledgerWithMetamask', { displayName: 'Hardware Wallet (with Metamask)', image: LedgerMark});
CONNECTOR_INFO.set('ledger', { displayName: 'Ledger', image: LedgerMark });
CONNECTOR_INFO.set('walletconnect', { displayName: 'WalletConnect', image: WalletconnectMark });

const INIT_INJECTED = (JSON.parse(localStorage.getItem('connectionName')!) as string) || 'metamask';

// const INIT_INJECTED = 'metamask';

const CONNECTORS = new Map();
CONNECTORS.set(
  'metamask',
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
  })
);
CONNECTORS.set(
  'ledgerWithMetamask',
  new InjectedConnector({
    supportedChainIds: [1, 42],
  })
);

export const useConnection = () => {
  const [tried, setTried] = useState<boolean>(false);

  const [connectionName, setConnectionName] = useCachedState('connectionName', '');
  const [currentChainInfo, setCurrentChainInfo] = useState<any>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [fallbackErrorMessage, setFallbackErrorMessage] = useState<string | undefined>(undefined);

  /* CACHED VARIABLES */
  const [lastChainId, setLastChainId] = useCachedState('lastChainId', 1);

  const primaryConnection = useWeb3React<ethers.providers.Web3Provider>();
  const { connector, library: provider, chainId, account, activate, deactivate, active, error } = primaryConnection;

  const fallbackConnection = useWeb3React<ethers.providers.JsonRpcProvider>('fallback');
  const {
    library: fallbackProvider,
    chainId: fallbackChainId,
    activate: fallbackActivate,
    active: fallbackActive,
    error: fallbackError,
  } = fallbackConnection;

  /* extra hooks */
  const { handleErrorMessage } = useWeb3Errors();
  useInactiveListener(); // inactive listener for when a wallet is availble, but not connected.

  const isConnected = (connection: string) => CONNECTORS.get(connection) === connector;
  const disconnect = () => connector && deactivate();
  const connect = (connection: string = INIT_INJECTED) => {
    setErrorMessage(undefined);
    activate(
      CONNECTORS.get(connection),
      (e: Error) => {
        setErrorMessage(handleErrorMessage(e));
        setTried(true); // tried, failed, move on.
      },
      false
    );
    CONNECTORS.has(connection) && setConnectionName(connection)
  };

  /**
   * FIRST STEP > Try to connect automatically to an injected provider on first load
   * */
  useEffect(() => {
    if (!tried && !active) {
      setErrorMessage(undefined);
      CONNECTORS.get(INIT_INJECTED)
        .isAuthorized()
        .then((isAuthorized: boolean) => {
          if (isAuthorized) {
            activate(
              CONNECTORS.get(INIT_INJECTED),
              (e: Error) => {
                setErrorMessage(handleErrorMessage(e));
                setTried(true); // tried, failed, move on.
              },
              false
            );
            setConnectionName(INIT_INJECTED);
          } else {
            setTried(true); // not authorsied, move on
          }
        });
    }
    /* if active, set tried to true */
    !tried && active && setTried(true);
  }, [activate, active, handleErrorMessage, tried, setConnectionName]);

  /*
      Watch the chainId for changes (most likely instigated by metamask),
      and change the FALLBACK provider accordingly.
      NOTE: Currently, there is no way to change the fallback provider manually, but the last chainId is cached.
  */
  useEffect(() => {
    /* Case: Auto Connection FAILURE > Set the fallback connector to the lastChainId */
    if (tried && !chainId) {
      console.log('Connecting fallback Provider to the default network');
      setFallbackErrorMessage(undefined);
      fallbackActivate(
        new NetworkConnector({
          urls: { 1: RPC_URLS[1], 42: RPC_URLS[42] },
          defaultChainId: lastChainId,
        }),
        (e: Error) => {
          setFallbackErrorMessage(handleErrorMessage(e));
        },
        false
      );
    }

    /* Case: Auto Connection SUCCESS > set the fallback connector to the same as the chainId */
    if (tried && chainId) {
      console.log('Connecting fallback Provider to the same network as connected wallet');
      setFallbackErrorMessage(undefined);
      fallbackActivate(
        new NetworkConnector({
          urls: { 1: RPC_URLS[1], 42: RPC_URLS[42] },
          defaultChainId: chainId,
        }),
        (e: Error) => {
          setFallbackErrorMessage(handleErrorMessage(e));
        },
        false
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tried, chainId, fallbackActivate, lastChainId]);

  /* Watch the connector currently being activated */
  const [activatingConnector, setActivatingConnector] = useState<any>();
  useEffect(() => {
    activatingConnector && activatingConnector === connector && setActivatingConnector(undefined);
  }, [activatingConnector, connector]);

  /* handle chain changes */
  useEffect(() => {
    fallbackChainId && setCurrentChainInfo(CHAIN_INFO.get(fallbackChainId));
    if (fallbackChainId && lastChainId && fallbackChainId !== lastChainId) {
      localStorage.clear();
      setLastChainId(fallbackChainId);
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    }
  }, [fallbackChainId, lastChainId, setLastChainId]);

  return {
    connectionState: {
      /* constants */
      CONNECTORS,
      CHAIN_INFO,
      CONNECTOR_INFO,

      /* connections */
      connectionName,
      connector,
      provider,
      fallbackProvider,
      chainId,
      fallbackChainId,
      lastChainId,

      currentChainInfo,
      errorMessage,
      fallbackErrorMessage,

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

// For better error handling */
const useWeb3Errors = () => {
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
    if (error instanceof UserRejectedRequestErrorInjected || error instanceof UserRejectedRequestErrorWalletConnect) {
      return UNAUTHORISED_SITE;
    }
    // eslint-disable-next-line no-console
    console.error(error);
    return UNKNOWN_ERROR;
  };
  return { handleErrorMessage };
};

const useInactiveListener = (suppress: boolean = false) => {
  const { active, error, activate, chainId: _chainId } = useWeb3React();
  const [lastChainId, setLastChainId] = useCachedState('lastChainId', null);

  // eslint-disable-next-line consistent-return
  useEffect((): any => {
    const { ethereum } = window as any;
    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleConnect = () => {
        if (lastChainId !== _chainId && active) {
          console.log('Handling CONNECT');
        }
      };

      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Handling ACCOUNT CHANGED', accounts);
        // if (accounts.length > 0) {
        // }
      };

      const handleChainChanged = (chainId: string) => {
        console.log('CHAIN CHANGED in the background with payload: ', chainId);
        window.localStorage.clear();
        setLastChainId(parseInt(chainId, 16));
        // eslint-disable-next-line no-restricted-globals
        location.reload();
      };

      ethereum.on('connect', handleConnect);
      ethereum.on('chainChanged', handleChainChanged);
      ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('connect', handleConnect);
          ethereum.removeListener('chainChanged', handleChainChanged);
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [active, error, suppress, activate, _chainId, lastChainId]);
};
