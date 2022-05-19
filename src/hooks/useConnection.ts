import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from '@web3-react/walletconnect-connector';

import { NetworkConnector } from '@web3-react/network-connector';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useCachedState } from './generalHooks';
import { CHAIN_INFO, SUPPORTED_RPC_URLS } from '../config/chainData';
import { CONNECTORS, CONNECTOR_INFO, INIT_INJECTED } from '../config/connectors';
import { clearCachedItems } from '../utils/appUtils';
// import TrezorMark from '../components/logos/TrezorMark';

const NO_BROWSER_EXT =
  'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
const UNSUPPORTED_NETWORK = 'Your Wallet or Browser is connected to an unsupported network.';
const UNAUTHORISED_SITE = 'Please authorize this website to access your Ethereum account.';
const UNKNOWN_ERROR = 'An unknown error occurred. Check the console for more details.';

export const useConnection = () => {
  const [tried, setTried] = useState<boolean>(false);

  const [currentChainInfo, setCurrentChainInfo] = useState<any>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [fallbackErrorMessage, setFallbackErrorMessage] = useState<string | undefined>(undefined);

  /* CACHED VARIABLES */
  const [lastChainId, setLastChainId] = useCachedState('lastChainId', 1);
  const [connectionName, setConnectionName] = useCachedState('connectionName', '');

  const primaryConnection = useWeb3React<ethers.providers.Web3Provider>();
  const { connector, library: provider, chainId, account, activate, deactivate, active } = primaryConnection;

  const fallbackConnection = useWeb3React<ethers.providers.JsonRpcProvider>('fallback');
  const { library: fallbackProvider, chainId: fallbackChainId, activate: fallbackActivate } = fallbackConnection;

  /* extra hooks */
  const { handleErrorMessage } = useWeb3Errors();
  useInactiveListener(); // inactive listener for when a wallet is availble, but not connected.

  const isConnected = (connection: string) => CONNECTORS.get(connection) === connector;
  const disconnect = () => connector && deactivate();

  const connect = useCallback(
    async (connection: string) => {
      setErrorMessage(undefined);

      await activate(
        CONNECTORS.get(connection),
        (e: Error) => {
          setErrorMessage(handleErrorMessage(e));
          setTried(true); // tried, failed, move on.
          localStorage.removeItem('connectionName');
          return null;
        },
        false
      );
      setConnectionName(connection);
    },
    [activate, handleErrorMessage, setConnectionName]
  );

  /**
   * FIRST STEP > Try to connect automatically to an injected provider on first load
   * */
  useEffect(() => {
    if (!tried && !active) {
      setErrorMessage(undefined);
      if (INIT_INJECTED === 'metamask') {
        CONNECTORS.get(INIT_INJECTED)
          .isAuthorized()
          .then((isAuthorized: boolean) => {
            if (isAuthorized) {
              connect(INIT_INJECTED);
            } else setTried(true); // not authorsied, move on
          });
      } else {
        // connect('walletconnect');
        setTried(true); // tried, failed, move on.
      }
    }
    /* if active, set tried to true */
    !tried && active && setTried(true);
  }, [activate, active, connect, handleErrorMessage, tried]);

  /*
      SETTTING THE FALLBACK CHAINID >
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
          urls: SUPPORTED_RPC_URLS,
          defaultChainId: lastChainId || process.env.REACT_APP_DEFAULT_CHAINID,
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
          urls: SUPPORTED_RPC_URLS,
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

  /* Watch and track the connector currently being activated */
  const [activatingConnector, setActivatingConnector] = useState<any>();
  useEffect(() => {
    activatingConnector && activatingConnector === connector && setActivatingConnector(undefined);
  }, [activatingConnector, connector]);

  /* handle chainId changes */
  useEffect(() => {
    fallbackChainId && setCurrentChainInfo(CHAIN_INFO.get(fallbackChainId));
    if (fallbackChainId && lastChainId && fallbackChainId !== lastChainId) {
      // localStorage.clear();
      clearCachedItems([
        'lastChainId',
        'assets',
        'series',
        'lastAssetUpdate',
        'lastSeriesUpdate',
        'strategies',
        'lastStrategiesUpdate',
        'connectionName',
      ]);
      setLastChainId(fallbackChainId);
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    }
  }, [fallbackChainId, lastChainId, setLastChainId]);

  /* Use the connected provider if available, else use fallback */
  const getFallbackProvider = () => {
    if ([42161, 421611].includes(chainId)) return fallbackProvider; // always use fallback for arbitrum (testnet) to access historical data
    // return provider ?? fallbackProvider;
    return fallbackProvider
  };

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
      chainId,
      fallbackProvider: getFallbackProvider(),
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
    if (typeof window !== 'undefined') {
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
          // window.localStorage.clear();
          clearCachedItems([
            'assets',
            'series',
            'lastAssetUpdate',
            'lastSeriesUpdate',
            'strategies',
            'lastStrategiesUpdate',
          ]);
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
    }
  }, [active, error, suppress, activate, _chainId, lastChainId]);
};
