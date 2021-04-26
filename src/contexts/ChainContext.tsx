import React, { useEffect, useState } from 'react';
import { ContractFactory, ethers, utils } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { NetworkConnector } from '@web3-react/network-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { useCachedState } from '../hooks';

import * as yieldEnv from './yieldEnv.json';
import * as contracts from '../contracts';
import { IAsset, ISeries } from '../types';
import { nameFromMaturity } from '../utils/displayUtils';
import { Pool } from '../contracts';

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
    supportedChainIds: [1, 31337],
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
//   'networkconnect',
//   new NetworkConnector({
//     urls: { 1: RPC_URLS[1], 42: RPC_URLS[42], 31337: RPC_URLS[31337] },
//     defaultChainId: 31337,
//   }),
// );

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

  /* flags */
  chainLoading: true,

  /* Connected Contract Maps */
  contractMap: new Map<string, ContractFactory>(),
  assetMap: new Map<string, IAsset>(),
  seriesMap: new Map<string, ISeries>(),
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
    case 'chainLoading': return { ...state, chainLoading: onlyIfChanged(action) };

    case 'provider': return { ...state, provider: onlyIfChanged(action) };
    case 'fallbackProvider': return { ...state, fallbackProvider: onlyIfChanged(action) };
    case 'signer': return { ...state, signer: onlyIfChanged(action) };
    case 'chainId': return { ...state, chainId: onlyIfChanged(action) };
    case 'account': return { ...state, account: onlyIfChanged(action) };
    case 'web3Active': return { ...state, web3Active: onlyIfChanged(action) };

    case 'contractMap': return { ...state, contractMap: onlyIfChanged(action) };
    case 'addSeries': return {
      ...state,
      seriesMap: state.seriesMap.set(action.payload.id, action.payload),
    };
    case 'addAsset': return {
      ...state,
      assetMap: state.assetMap.set(action.payload.id, action.payload),
    };

    /* special internal case for multi-updates - might remove from this context if not needed */
    case '_any': return { ...state, ...action.payload };
    default: return state;
  }
}

const ChainProvider = ({ children }: any) => {
  const [chainState, updateState] = React.useReducer(chainReducer, initState);
  const [lastChainId, setLastChainId] = useCachedState('lastChainId', 1);
  const [lastBlock, setLastBlock] = useCachedState('lastBlock', 1);

  const [tried, setTried] = useState<boolean>(false);

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
    active: fallbackActive,
    error: fallbackError,
  } = fallbackConnection;

  /**
   * Update on FALLBACK connection/state on network changes (id/library)
   */
  // TODO add in caching
  useEffect(() => {
    fallbackLibrary && updateState({ type: 'fallbackProvider', payload: fallbackLibrary });

    // fallbackChainId && console.log('fallback chainID :', fallbackChainId);
    // chainId && console.log('chainID :', chainId);

    if (fallbackLibrary && fallbackChainId) {
      /* Get the instance of the Base contracts */
      const addrs = (yieldEnv.addresses as any)[fallbackChainId];
      const Cauldron = contracts.Cauldron__factory.connect(addrs.Cauldron, fallbackLibrary);
      const Ladle = contracts.Ladle__factory.connect(addrs.Ladle, fallbackLibrary);
      const PoolRouter = contracts.PoolRouter__factory.connect(addrs.PoolRouter, fallbackLibrary);

      /* Update the baseContracts state : ( hardcoded based on networkId ) */
      const newContractMap = chainState.contractMap;
      newContractMap.set('Cauldron', Cauldron);
      newContractMap.set('Ladle', Ladle);
      newContractMap.set('PoolRouter', PoolRouter);
      updateState({ type: 'contractMap', payload: newContractMap });

      /* Update the 'dynamic' contracts (series and assets) */
      Promise.all([
        /* Update the available assetsMap based on Cauldron events */
        (async () => {
          /* get all the assetAdded, roacleAdded and joinAdded events and series events at the same time */
          const [assetAddedEvents, spotOracleAddedEvents, rateOracleAddedEvents, joinAddedEvents] = await Promise.all([
            Cauldron.queryFilter('AssetAdded' as any),
            Cauldron.queryFilter('SpotOracleAdded' as any),
            Cauldron.queryFilter('RateOracleAdded' as any),
            Ladle.queryFilter('JoinAdded' as any),
          ]);

          /* Create a map from the joinAdded event data */
          const joinMap: Map<string, string> = new Map(
            joinAddedEvents.map((log:any) => Ladle.interface.parseLog(log).args) as [[string, string]],
          );

          /* Create a map from the rateOracleAdded event data */
          // event RateOracleAdded(bytes6 indexed baseId, address indexed oracle);
          const rateOracleMap: Map<string, string> = new Map(
            rateOracleAddedEvents.map((log:any) => Cauldron.interface.parseLog(log).args) as [[string, string]],
          );

          /* Create a map from the spotOracleAdded event data : structure>  Map[ string, Map[string, [address, string ]]] */
          // event SpotOracleAdded(bytes6 indexed baseId, bytes6 indexed ilkId, address indexed oracle, uint32 ratio);
          const spotOracleMap: Map<string, string> = new Map(
            spotOracleAddedEvents.map((log:any) => {
              const { args } = Cauldron.interface.parseLog(log);
              // const _map = new Map([args[1], [args[2], args[3]]]);
              return [args[0], args[3]];
            }) as [[string, string]],
          );

          await Promise.all(assetAddedEvents.map(async (x:any) => {
            const { assetId: id, asset: address } = Cauldron.interface.parseLog(x).args;
            const ERC20 = contracts.ERC20__factory.connect(address, fallbackLibrary);
            /* Add in any extra static asset Data */ // TODO is there any other fixed asset data needed?
            const [displayName, symbol] = await Promise.all([ERC20.name(), ERC20.symbol()]);
            updateState({ type: 'addAsset',
              payload: {
                id,
                address,
                displayName,
                symbol,
                joinAddress: joinMap.get(id),
                /* baked in token fns */
                balance: async () => account && await ERC20.balanceOf(account),
                allowance: async (spender:string) => account && await ERC20.allowance(account, spender),
              } });
          }));
        })(),

        /* ... AT THE SAME TIME update the available seriesMap based on Cauldron events */
        (async () => {
          /* get both poolAdded events and series events at the same time */
          const [seriesAddedEvents, poolAddedEvents] = await Promise.all([
            Cauldron.queryFilter('SeriesAdded' as any),
            Ladle.queryFilter('PoolAdded' as any),
          ]);

          /* build a map from the poolAdded event data */
          const poolMap: Map<string, string> = new Map(
            poolAddedEvents.map((log:any) => Ladle.interface.parseLog(log).args) as [[string, string]],
          );

          /* Add in any extra static series */
          await Promise.all([
            ...seriesAddedEvents.map(async (x:any) : Promise<void> => {
              const { seriesId: id, baseId, fyToken } = Cauldron.interface.parseLog(x).args;
              const { maturity } = await Cauldron.series(id);

              const poolAddress: string = poolMap.get(id) as string;
              const poolContract: Pool = contracts.Pool__factory.connect(poolAddress, fallbackLibrary);
              const fyTokenContract = contracts.FYToken__factory.connect(fyToken, fallbackLibrary);

              updateState({
                type: 'addSeries',
                payload: {
                  id,
                  baseId,
                  maturity,
                  displayName: nameFromMaturity(maturity),
                  displayNameMobile: nameFromMaturity(maturity, 'MMM yyyy'),
                  fyTokenContract,
                  fyTokenAddress: fyToken,
                  poolAddress,
                  poolContract,
                  getBaseAddress: () => chainState.assetMap.get(baseId).address, // TODO refactor to get this static - if poosible?
                } });
            }),
          ]);
        })(),
      ])
        .then(() => {
          updateState({ type: 'chainLoading', payload: false });
          console.log('ASSETS:', chainState.assetMap);
          console.log('SERIES:', chainState.seriesMap);
        });
    }
  }, [
    account,
    fallbackChainId,
    fallbackLibrary,
    chainState.assetMap,
    chainState.seriesMap,
    chainState.contractMap,
  ]);

  /**
   * Once the series list updates, update the list with the associated joins > this needs to be seperate from above to
   * allow for caching - and watching for any newly added assets
   */
  useEffect(() => {
    chainState.seriesMap && console.log(chainState.seriesMap);
  }, [chainState.seriesMap]);

  /**
   * Update on PRIMARY connection any network changes (likely via metamask/walletConnect)
   */
  useEffect(() => {
    console.log('Metamask/WalletConnect Active: ', active);
    updateState({ type: 'chainId', payload: chainId });
    updateState({ type: 'web3Active', payload: active });
    updateState({ type: 'provider', payload: library || null });
    updateState({ type: 'account', payload: account || null });
    updateState({ type: 'signer', payload: library?.getSigner(account!) || null });
  }, [active, account, chainId, library]);

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
    tried && fallbackActivate(
      new NetworkConnector({
        urls: { 1: RPC_URLS[1], 42: RPC_URLS[42], 31337: RPC_URLS[31337] },
        defaultChainId: _chainId,
      }), (e:any) => console.log(e), true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, fallbackActivate, lastChainId, tried]);

  /**
   * Try connect automatically to an injected provider on first load
   * */
  useEffect(() => {
    chainState.connectOnLoad &&
    connectors.get('injected')
      .isAuthorized()
      .then((isAuthorized: boolean) => {
        if (isAuthorized) {
          activate(connectors.get('injected'), undefined, true).catch(() => {
            setTried(true);
          });
        } else {
          setTried(true); // just move on do nothing nore
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
    connect: (connection:string = 'injected') => activate(connectors.get(connection)),
    disconnect: () => connector && deactivate(),
  };

  return (
    <ChainContext.Provider value={{ chainState, chainActions }}>
      {children}
    </ChainContext.Provider>
  );
};

export { ChainContext, ChainProvider };
