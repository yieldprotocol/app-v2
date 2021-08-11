import React, { useEffect, useState } from 'react';
import { ContractFactory, ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { NetworkConnector } from '@web3-react/network-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';

import { format } from 'date-fns';

import { useCachedState } from '../hooks/generalHooks';

import * as yieldEnv from './yieldEnv.json';
import * as contracts from '../contracts';
import { IAssetRoot, ISeriesRoot } from '../types';

import { ETH_BASED_ASSETS } from '../utils/constants';
import { nameFromMaturity, getSeason, SeasonType } from '../utils/appUtils';

import DaiMark from '../components/logos/DaiMark';
import EthMark from '../components/logos/EthMark';
import TSTMark from '../components/logos/TSTMark';
import USDCMark from '../components/logos/USDCMark';
import WBTCMark from '../components/logos/WBTCMark';
import USDTMark from '../components/logos/USDTMark';
import YieldMark from '../components/logos/YieldMark';
import { ERC20Permit } from '../contracts';

const markMap = new Map([
  ['DAI', <DaiMark key="dai" />],
  ['USDC', <USDCMark key="usdc" />],
  ['WBTC', <WBTCMark key="wbtc" />],
  ['TST', <TSTMark key="tst" />],
  ['WETH', <EthMark key="eth" />],
  ['USDT', <USDTMark key="eth" />],
]);

const assetDigitFormatMap = new Map([
  ['WETH', 6],
  ['WBTC', 6],
  ['DAI', 2],
  ['USDC', 2],
  ['USDT', 2],
]);

/* Set up web3react config */
const POLLING_INTERVAL = 12000;
const RPC_URLS: { [chainId: number]: string } = {
  1: process.env.REACT_APP_RPC_URL_1 as string,
  42: process.env.REACT_APP_RPC_URL_42 as string,
  1337: process.env.REACT_APP_RPC_URL_1337 as string,
  31337: process.env.REACT_APP_RPC_URL_31337 as string,
};

interface IChainData {
  name: string;
  color: string;
}

const chainData = new Map<number, IChainData>();
chainData.set(1, { name: 'Mainnet', color: '#29b6af' });
chainData.set(3, { name: 'Ropsten', color: '#ff4a8d' });
chainData.set(4, { name: 'Rinkeby', color: '#f6c343' });
chainData.set(5, { name: 'Goerli', color: '#3099f2' });
chainData.set(10, { name: 'Optimism', color: '#EB0822' });
chainData.set(42, { name: 'Kovan', color: '#7F7FFE' });

const connectors = new Map();
const injectedName = 'metamask';

connectors.set(
  injectedName,
  new InjectedConnector({
    supportedChainIds: [1, 42, 1337, 31337],
  })
);

connectors.set(
  'walletconnect',
  new WalletConnectConnector({
    rpc: { 1: RPC_URLS[1], 42: RPC_URLS[42] },
    bridge: 'https://bridge.walletconnect.org',
    qrcode: true,
    pollingInterval: POLLING_INTERVAL,
  })
);

// map the provider connection url name to a nicer format
export const connectorNames = new Map([
  ['metamask', 'Metamask'],
  ['walletconnect', 'WalletConnect'],
]);

/* Build the context */
const ChainContext = React.createContext<any>({});

const initState = {
  appVersion: '0.0.0' as string,
  chainId: Number(process.env.REACT_APP_DEFAULT_CHAINID) as number | null,
  chainData: null as any | null,
  provider: null as ethers.providers.Web3Provider | null,
  fallbackProvider: null as ethers.providers.Web3Provider | null,
  signer: null as ethers.providers.JsonRpcSigner | null,
  account: null as string | null,
  web3Active: false as boolean,
  fallbackActive: false as boolean,
  connectors,
  connector: null as any,

  /* settings */
  connectOnLoad: true as boolean,

  /* flags */
  chainLoading: true,

  /* Connected Contract Maps */
  contractMap: new Map<string, ContractFactory>(),
  assetRootMap: new Map<string, IAssetRoot>(),
  seriesRootMap: new Map<string, ISeriesRoot>(),
};

function chainReducer(state: any, action: any) {
  /* Helper: only change the state if different from existing */
  const onlyIfChanged = (_action: any) =>
    state[action.type] === _action.payload ? state[action.type] : _action.payload;

  /* Reducer switch */
  switch (action.type) {
    case 'chainLoading':
      return { ...state, chainLoading: onlyIfChanged(action) };
    case 'appVersion':
      return { ...state, appVersion: onlyIfChanged(action) };
    case 'provider':
      return { ...state, provider: onlyIfChanged(action) };
    case 'fallbackProvider':
      return { ...state, fallbackProvider: onlyIfChanged(action) };
    case 'signer':
      return { ...state, signer: onlyIfChanged(action) };
    case 'chainId':
      return { ...state, chainId: onlyIfChanged(action) };
    case 'chainData':
      return { ...state, chainData: onlyIfChanged(action) };
    case 'account':
      return { ...state, account: onlyIfChanged(action) };
    case 'web3Active':
      return { ...state, web3Active: onlyIfChanged(action) };
    case 'connector':
      return { ...state, connector: onlyIfChanged(action) };
    case 'contractMap':
      return { ...state, contractMap: onlyIfChanged(action) };
    case 'addSeries':
      return {
        ...state,
        seriesRootMap: state.seriesRootMap.set(action.payload.id, action.payload),
      };
    case 'addAsset':
      return {
        ...state,
        assetRootMap: state.assetRootMap.set(action.payload.id, action.payload),
      };
    /* special internal case for multi-updates - might remove from this context if not needed */
    case '_any':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const ChainProvider = ({ children }: any) => {
  const [chainState, updateState] = React.useReducer(chainReducer, initState);

  const [lastChainId, setLastChainId] = useCachedState('lastChainId', 42);

  const [cachedAssetAdded, setCachedAssetAdded] = useCachedState('AssetAdded', []);
  const [cachedJoinAdded, setCachedJoinAdded] = useCachedState('JoinAdded', []);

  const [cachedAssets, setCachedAssets] = useCachedState('assets', []);
  const [cachedSeries, setCachedSeries] = useCachedState('series', []);

  const [lastAssetUpdate, setLastAssetUpdate] = useCachedState('lastAssetUpdate', 0);
  const [lastSeriesUpdate, setLastSeriesUpdate] = useCachedState('lastSeriesUpdate', 0);

  const [tried, setTried] = useState<boolean>(false);

  const primaryConnection = useWeb3React<ethers.providers.Web3Provider>();
  const { connector, library, chainId, account, activate, deactivate, active } = primaryConnection;

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
      const CompoundOracle = contracts.CompoundMultiOracle__factory.connect(addrs.CompoundOracle, fallbackLibrary);
      const ChainlinkOracle = contracts.ChainlinkMultiOracle__factory.connect(addrs.ChainlinkOracle, fallbackLibrary);
      const CompositeMultiOracle = contracts.CompositeMultiOracle__factory.connect(
        addrs.CompositeMultiOracle,
        fallbackLibrary
      );

      updateState({ type: 'appVersion', payload: process.env.REACT_APP_VERSION });

      console.log('VERSION: ', process.env.REACT_APP_VERSION);
      console.log('Fallback ChainId: ', fallbackChainId);
      console.log('ChainId: ', chainId);

      /* Update the baseContracts state : ( hardcoded based on networkId ) */
      const newContractMap = chainState.contractMap;
      newContractMap.set('Cauldron', Cauldron);
      newContractMap.set('Ladle', Ladle);
      newContractMap.set('PoolRouter', PoolRouter);
      newContractMap.set('CompoundOracle', CompoundOracle);
      newContractMap.set('ChainlinkOracle', ChainlinkOracle);
      newContractMap.set('CompositeMultiOracle', CompositeMultiOracle);

      updateState({ type: 'contractMap', payload: newContractMap });

      let test: any;
      (async () => {
        test = await fallbackLibrary.getBalance('0x885Bc35dC9B10EA39f2d7B3C94a7452a9ea442A7');
      })();

      /* add on extra/calculated ASSET info */
      const _chargeAsset = (asset: { id: string; address: string; symbol: string }) => {
        const ERC20 = contracts.ERC20Permit__factory.connect(asset.address, fallbackLibrary);
        return {
          ...asset,
          digitFormat: assetDigitFormatMap.has(asset.symbol) ? assetDigitFormatMap.get(asset.symbol) : 6,
          image: markMap.get(asset.symbol),
          color: (yieldEnv.assetColors as any)[asset.symbol],
          /* baked in token fns */
          getBalance: async (acc: string) =>
            ETH_BASED_ASSETS.includes(asset.id) ? library?.getBalance(acc) : ERC20.balanceOf(acc),
          getAllowance: async (acc: string, spender: string) => ERC20.allowance(acc, spender),
          /* TODO remove for prod */
          /* @ts-ignore */
          mintTest: async () =>
            contracts.ERC20Mock__factory.connect(asset.address, library?.getSigner()!).mint(
              account!,
              ethers.utils.parseEther('100')
            ),
        };
      };

      const _getAssets = async () => {
        /* get all the assetAdded, roacleAdded and joinAdded events and series events at the same time */
        const [assetAddedEvents, joinAddedEvents] = await Promise.all([
          Cauldron.queryFilter('AssetAdded' as any, lastAssetUpdate),
          Ladle.queryFilter('JoinAdded' as any, lastAssetUpdate),
        ]);
        /* Create a map from the joinAdded event data */
        const joinMap: Map<string, string> = new Map(
          joinAddedEvents.map((log: any) => Ladle.interface.parseLog(log).args) as [[string, string]]
        );

        const newAssetList: any[] = [];
        await Promise.all(
          assetAddedEvents.map(async (x: any) => {
            const { assetId: id, asset: address } = Cauldron.interface.parseLog(x).args;
            const ERC20 = contracts.ERC20Permit__factory.connect(address, fallbackLibrary);
            /* Add in any extra static asset Data */ // TODO is there any other fixed asset data needed?
            const [name, symbol] = await Promise.all([
              ERC20.name(),
              ERC20.symbol(),
              // ETH_BASED_ASSETS.includes(id) ? '1' : await ERC20.version()
            ]);

            console.log(symbol, ':', id);
            // TODO check if any other tokens have different versions. maybe abstract this logic somewhere?
            const version = id === '0x555344430000' ? '2' : '1';
            const newAsset = {
              id,
              address,
              name,
              symbol,
              version,
              joinAddress: joinMap.get(id),
            };
            // Update state and cache
            updateState({ type: 'addAsset', payload: _chargeAsset(newAsset) });
            newAssetList.push(newAsset);
          })
        );

        // set the 'last checked' block
        setLastAssetUpdate(await library?.getBlockNumber());
        // log the new assets in the cache
        setCachedAssets([...cachedAssets, ...newAssetList]);
        console.log('Yield Protocol Asset data updated.');
      };

      /* add on extra/calculated SERIES info */
      const _chargeSeries = (series: {
        maturity: number;
        baseId: string;
        poolAddress: string;
        fyTokenAddress: string;
      }) => {
        const poolContract = contracts.Pool__factory.connect(series.poolAddress, fallbackLibrary);
        const fyTokenContract = contracts.FYToken__factory.connect(series.fyTokenAddress, fallbackLibrary);
        const season = getSeason(series.maturity) as SeasonType;
        const oppSeason = (_season: SeasonType) => getSeason(series.maturity + 23670000) as SeasonType;
        const [startColor, endColor, textColor]: string[] = yieldEnv.seasonColors[season];
        const [oppStartColor, oppEndColor, oppTextColor]: string[] = yieldEnv.seasonColors[oppSeason(season)];

        return {
          ...series,
          poolContract,
          fyTokenContract,
          fullDate: format(new Date(series.maturity * 1000), 'dd MMMM yyyy'),
          displayName: `${nameFromMaturity(series.maturity)}`,
          displayNameMobile: `${nameFromMaturity(series.maturity, 'MMM yyyy')}`,

          season,
          startColor,
          endColor,
          color: `linear-gradient(${startColor}, ${endColor})`,
          textColor,

          oppStartColor,
          oppEndColor,
          oppTextColor,
          seriesMark: <YieldMark startColor={startColor} endColor={endColor} />,
          // built-in helper functions:
          getTimeTillMaturity: () => series.maturity - Math.round(new Date().getTime() / 1000),
          isMature: async () => series.maturity < (await fallbackLibrary.getBlock('latest')).timestamp,
          getBaseAddress: () => chainState.assetRootMap.get(series.baseId).address, // TODO refactor to get this static - if possible?
        };
      };

      const _getSeries = async () => {
        /* get poolAdded events and series events at the same time */
        const [seriesAddedEvents, poolAddedEvents] = await Promise.all([
          Cauldron.queryFilter('SeriesAdded' as any, lastSeriesUpdate),
          Ladle.queryFilter('PoolAdded' as any, lastSeriesUpdate),
        ]);

        /* build a map from the poolAdded event data */
        const poolMap: Map<string, string> = new Map(
          poolAddedEvents.map((log: any) => Ladle.interface.parseLog(log).args) as [[string, string]]
        );

        const newSeriesList: any[] = [];
        /* Add in any extra static series */
        await Promise.all([
          ...seriesAddedEvents.map(async (x: any): Promise<void> => {
            const { seriesId: id, baseId, fyToken } = Cauldron.interface.parseLog(x).args;
            const { maturity } = await Cauldron.series(id);
            const poolAddress: string = poolMap.get(id) as string;
            const poolContract = contracts.Pool__factory.connect(poolAddress, fallbackLibrary);
            const fyTokenContract = contracts.FYToken__factory.connect(fyToken, fallbackLibrary);
            const [name, symbol, version, poolName, poolVersion] = await Promise.all([
              fyTokenContract.name(),
              fyTokenContract.symbol(),
              fyTokenContract.version(),
              poolContract.name(),
              poolContract.version(),
            ]);
            const newSeries = {
              id,
              baseId,
              maturity,
              name,
              symbol,
              version,
              address: fyToken,
              fyTokenAddress: fyToken,
              poolAddress,
              poolVersion,
              poolName,
            };
            updateState({ type: 'addSeries', payload: _chargeSeries(newSeries) });
            newSeriesList.push(newSeries);
          }),
        ]);
        setLastSeriesUpdate(await fallbackLibrary?.getBlockNumber());
        setCachedSeries([...cachedSeries, ...newSeriesList]);
        console.log('Yield Protocol series data updated.');
      };

      /* LOAD the Series and Assets */
      if (cachedAssets.length === 0) {
        console.log('FIRST LOAD: Loading Asset and Series data ');
        (async () => {
          await Promise.all([_getAssets(), _getSeries()]);
          updateState({ type: 'chainLoading', payload: false });
        })();
      } else {
        // get assets and series from cache and 'charge' them, and add to state:
        cachedAssets.forEach((a: IAssetRoot) => {
          updateState({ type: 'addAsset', payload: _chargeAsset(a) });
        });
        cachedSeries.forEach((s: ISeriesRoot) => {
          updateState({ type: 'addSeries', payload: _chargeSeries(s) });
        });
        updateState({ type: 'chainLoading', payload: false });
        console.log('Checking for new Assets and Series...');
        // then async check for any updates (they should automatically populate the map):
        (async () => Promise.all([_getAssets(), _getSeries()]))();
      }
    }
  }, [
    account,
    fallbackChainId,
    fallbackLibrary,
    chainState.assetRootMap,
    chainState.seriesRootMap,
    chainState.contractMap,
    chainId,
  ]);

  /**
   * Once the series list updates, update the list with the associated joins > this needs to be seperate from above to
   * allow for caching - and watching for any newly added assets
   */
  // useEffect(() => {
  //   chainState.seriesRootMap && console.log(chainState.seriesRootMap);
  // }, [chainState.seriesRootMap]);

  /**
   * Update on PRIMARY connection any network changes (likely via metamask/walletConnect)
   */
  useEffect(() => {
    console.log('Wallet/Account Active: ', active);
    updateState({ type: 'chainId', payload: chainId });
    chainId && updateState({ type: 'chainData', payload: chainData.get(chainId) });
    updateState({ type: 'web3Active', payload: active });
    updateState({ type: 'provider', payload: library || null });
    updateState({ type: 'account', payload: account || null });
    updateState({ type: 'signer', payload: library?.getSigner(account!) || null });
    updateState({ type: 'connector', payload: connector || null });
  }, [active, account, chainId, library, connector]);

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
          urls: { 1: RPC_URLS[1], 42: RPC_URLS[42], 31337: RPC_URLS[31337], 1337: RPC_URLS[1337] },
          defaultChainId: _chainId,
        }),
        (e: any) => console.log(e),
        true
      );

    // eslint-disable-next-line no-restricted-globals
    chainId && chainId !== lastChainId && location.reload();

    if (chainId && chainId !== lastChainId) {
      setCachedAssets([]);
      setCachedSeries([]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, fallbackActivate, lastChainId, tried]);

  /**
   * Try connect automatically to an injected provider on first load
   * */
  useEffect(() => {
    chainState.connectOnLoad &&
      connectors
        .get(injectedName)
        .isAuthorized()
        .then((isAuthorized: boolean) => {
          if (isAuthorized) {
            activate(connectors.get(injectedName), undefined, true).catch(() => {
              setTried(true);
            });
          } else {
            setTried(true); // just move on do nothing nore
          }
        });
  }, [activate, chainState.connectOnLoad]);
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

  const chainActions = {
    isConnected: (connection: string) => connectors.get(connection) === connector,
    connect: (connection: string = injectedName) => activate(connectors.get(connection)),
    disconnect: () => connector && deactivate(),
    connectTest: () =>
      activate(
        new NetworkConnector({
          urls: { 31337: RPC_URLS[31337], 1337: RPC_URLS[1337] },
          defaultChainId: 42,
        }),
        (e: any) => console.log(e),
        true
      ),
  };

  return <ChainContext.Provider value={{ chainState, chainActions }}>{children}</ChainContext.Provider>;
};

export { ChainContext, ChainProvider };
