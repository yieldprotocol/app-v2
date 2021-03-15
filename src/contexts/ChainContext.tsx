import React, { useEffect, useState } from 'react';
import { ContractFactory, ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { NetworkConnector } from '@web3-react/network-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { useCachedState } from '../hooks';

import * as yieldEnv from './yieldEnv.json';
import * as contracts from '../contracts';
import { IYieldAsset, IYieldSeries } from '../types';

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
    supportedChainIds: [31337],
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

/* Build the context */
const ChainContext = React.createContext<any>({});

const initState = {
  chainId: Number(process.env.REACT_APP_DEFAULT_CHAINID) as number,
  provider: null as ethers.providers.Web3Provider | null,
  fallbackProvider: null as ethers.providers.Web3Provider | null,
  signer: null as ethers.providers.JsonRpcSigner | null,
  account: null as string | null,
  web3Active: false as boolean,
  fallbackActive: false as boolean,

  /* settings */
  connectOnLoad: true as boolean,

  /* Connected Contract Maps */
  baseMap: new Map<string, { name: string, callContract: ContractFactory, txContract: ContractFactory }>(),
  assetMap: new Map<string, IYieldAsset>(),
  seriesMap: new Map<string, IYieldSeries>(),

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

    case 'baseMap': return { ...state, baseMap: onlyIfChanged(action) };
    case 'assetMap': return { ...state, assetMap: onlyIfChanged(action) };
    case 'seriesMap': return { ...state, seriesMap: onlyIfChanged(action) };

    /* special internal case for multi-updates - might remove from this context if not needed */
    case '_any': return { ...state, ...action.payload };
    default:
      return state;
  }
}

const ChainProvider = ({ children }: any) => {
  const [chainState, updateState] = React.useReducer(chainReducer, initState);
  const [lastChainId, setLastChainId] = useCachedState('lastChainId', 1);
  const [lastBlock, setLastBlock] = useCachedState('lastBlock', 1);
  const primaryConnection = useWeb3React<ethers.providers.Web3Provider>();

  const {
    connector,
    library,
    chainId,
    account,
    activate,
    deactivate,
    active,
    error,
  } = primaryConnection;

  const fallbackConnection = useWeb3React<ethers.providers.JsonRpcProvider>('fallback');
  const {
    library: fallbackLibrary,
    chainId: fallbackChainId,
    activate: fallbackActivate,
    error: fallbackError,
  } = fallbackConnection;

  /*
      Watch the chainId for changes (most likely instigated by metamask),
      and change the FALLBACK provider accordingly.
      NOTE: Currently, there is no way to change the fallback provider manually, but the last chainId is cached.
  */
  useEffect(() => {
    if (chainId) {
      /* cache the change of networkId */
      setLastChainId(chainId);
      /* align the fallback and primary chainIds */
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

  /**
   * Update on FALLBACK connection on network changes (id/library)
   */
  useEffect(() => {
    fallbackLibrary && updateState({ type: 'fallbackProvider', payload: fallbackLibrary });
    fallbackChainId && console.log('fallback chainID :', fallbackChainId);

    if (fallbackLibrary && fallbackChainId) {
      /* Get the instance of the Cauldron contract */
      const addrs = (yieldEnv.addresses as any)[fallbackChainId];
      const Cauldron = contracts.Cauldron__factory.connect(
        addrs.Cauldron,
        fallbackLibrary,
      );
      (async () => {
        await Promise.all([
          /* Update the available assetsMap based on Cauldron events, */
          (async () => {
            const _assetList = await Cauldron.queryFilter('AssetAdded' as any);
            const newAssetMap = _assetList.reduce((acc:any, item:any) => {
              const _map = acc;
              const { assetId, asset } = Cauldron.interface.parseLog(item).args;
              _map.set(
                assetId,
                {
                  id: assetId,
                  address: asset,
                  callContract: contracts.ERC20__factory.connect(asset, fallbackLibrary),
                },
              );
              return _map;
            }, chainState.assetMap);
            console.log(newAssetMap);
            updateState({ type: 'assetMap', payload: newAssetMap });
          })(),

          /* ... at the same time update the available seriesMap based on Cauldron events */
          (async () => {
            const _seriesList = await Cauldron.queryFilter('SeriesAdded' as any);
            const newSeriesMap = _seriesList.reduce((acc:any, item:any) => {
              const _map = acc;
              const { seriesId, baseId, fyToken } = Cauldron.interface.parseLog(item).args;
              _map.set(
                seriesId,
                {
                  id: seriesId,
                  base: baseId,
                  address: fyToken,
                  callContract: contracts.FYToken__factory.connect(fyToken, fallbackLibrary),
                },
              );
              return _map;
            }, chainState.seriesMap);
            console.log(newSeriesMap);
            updateState({ type: 'seriesMap', payload: newSeriesMap });
          })(),
        ]);
      })();
    }
  }, [fallbackChainId, chainState.assetMap, fallbackLibrary, chainState.seriesMap]);

  /**
   * Update on PRIMARY connection network changes (likely via metamask/walletConnect)
   */
  useEffect(() => {
    console.log('Metamask/WalletConnect Active: ', active);
    updateState({ type: 'chainId', payload: chainId });
    updateState({ type: 'web3Active', payload: active });
    updateState({ type: 'provider', payload: library || null });
    updateState({ type: 'account', payload: account || null });
    updateState({ type: 'signer', payload: library?.getSigner(account!) || null });

    if (library && chainId) {
      /* Get the instance of the Cauldron contract */
      const addrs = (yieldEnv.addresses as any)[chainId];
      const Cauldron = contracts.Cauldron__factory.connect(
        addrs.Cauldron,
        library.getSigner(),
      );

      updateState({ type: 'baseMap', payload: chainState.baseMap });
      console.log(chainState.assetMap, chainState.seriesMap);
      // console.log(library.getSigner());
    }
  }, [active, account, chainId, library, chainState.assetMap, chainState.seriesMap]);

  /* Try connect automatically to an injected provider on first load */
  const [tried, setTried] = useState<boolean>(false);
  useEffect(() => {
    chainState.connectOnLoad && connectors.get('injected').isAuthorized().then((isAuthorized: boolean) => {
      if (isAuthorized) {
        activate(connectors.get('injected'), undefined, true).catch(() => {
          setTried(true);
        });
      } else {
        setTried(true);
      }
    });
  }, [activate, chainState.connectOnLoad]);
  /* If web3 connected, wait until we get confirmation of that to flip the flag */
  useEffect(() => { if (!tried && active) { setTried(true); } }, [tried, active]);

  // /* Handle logic to recognize the connector currently being activated */
  // const [activatingConnector, setActivatingConnector] = useState<any>();
  // useEffect(() => {
  //   (activatingConnector && activatingConnector === connector) && setActivatingConnector(undefined);
  // }, [activatingConnector, connector]);

  const chainActions = {
    isConnected: (connection:string) => connectors.get(connection) === connector,
    connect: (connection:string) => activate(connectors.get(connection)),
    disconnect: () => connector && deactivate(),
  };

  return (
    <ChainContext.Provider value={{ chainState, chainActions }}>
      {children}
    </ChainContext.Provider>
  );
};

export { ChainContext, ChainProvider };
