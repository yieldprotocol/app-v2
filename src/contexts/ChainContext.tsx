import React, { useEffect } from 'react';
import { ContractFactory, ethers } from 'ethers';

import { format } from 'date-fns';

import { useCachedState } from '../hooks/generalHooks';
import { useConnection } from '../hooks/useConnection';

import * as yieldEnv from './yieldEnv.json';
import * as contracts from '../contracts';
import { IAssetRoot, ISeriesRoot, IStrategyRoot } from '../types';

import { ETH_BASED_ASSETS, USDC } from '../utils/constants';
import { nameFromMaturity, getSeason, SeasonType } from '../utils/appUtils';

import DaiMark from '../components/logos/DaiMark';
import EthMark from '../components/logos/EthMark';
import TSTMark from '../components/logos/TSTMark';
import USDCMark from '../components/logos/USDCMark';
import WBTCMark from '../components/logos/WBTCMark';
import USDTMark from '../components/logos/USDTMark';
import YieldMark from '../components/logos/YieldMark';

const markMap = new Map([
  ['DAI', <DaiMark key="dai" />],
  ['USDC', <USDCMark key="usdc" />],
  ['WBTC', <WBTCMark key="wbtc" />],
  ['TST', <TSTMark key="tst" />],
  ['ETH', <EthMark key="eth" />],
  ['USDT', <USDTMark key="eth" />],
]);

const assetDigitFormatMap = new Map([
  ['ETH', 6],
  ['WBTC', 6],
  ['DAI', 2],
  ['USDC', 2],
  ['USDT', 2],
]);

/* Build the context */
const ChainContext = React.createContext<any>({});

const initState = {
  appVersion: '0.0.0' as string,

  // chainId: Number(process.env.REACT_APP_DEFAULT_CHAINID) as number | null,
  // provider: null as ethers.providers.Web3Provider | null,
  // fallbackProvider: null as ethers.providers.Web3Provider | null,

  // signer: null as ethers.providers.JsonRpcSigner | null,
  // account: null as string | null,

  // web3Active: false as boolean,
  // fallbackActive: false as boolean,

  connection: {
    chainId: Number(process.env.REACT_APP_DEFAULT_CHAINID) as number | null,
    provider: null as ethers.providers.Web3Provider | null,
    fallbackProvider: null as ethers.providers.Web3Provider | null,
    signer: null as ethers.providers.JsonRpcSigner | null,
    account: null as string | null,
    web3Active: false as boolean,
    fallbackActive: false as boolean,
  },

  /* flags */
  chainLoading: true,

  /* Connected Contract Maps */
  contractMap: new Map<string, ContractFactory>(),
  assetRootMap: new Map<string, IAssetRoot>(),
  seriesRootMap: new Map<string, ISeriesRoot>(),
  strategyRootMap: new Map<string, IStrategyRoot>(),
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

    // case 'provider':
    //   return { ...state, provider: onlyIfChanged(action) };
    // case 'fallbackProvider':
    //   return { ...state, fallbackProvider: onlyIfChanged(action) };
    // case 'signer':
    //   return { ...state, signer: onlyIfChanged(action) };

    // case 'chainId':
    //   return { ...state, chainId: onlyIfChanged(action) };
    // case 'CHAIN_INFO':
    //   return { ...state, CHAIN_INFO: onlyIfChanged(action) };
    // case 'account':
    //   return { ...state, account: onlyIfChanged(action) };
    // case 'web3Active':
    //   return { ...state, web3Active: onlyIfChanged(action) };
    // case 'connector':
    //   return { ...state, connector: onlyIfChanged(action) };

    // case 'activatingConnector':
    //     return { ...state, activatingConnector: onlyIfChanged(action) };

    // case 'CHAIN_INFO':
    //   return { ...state, CHAIN_INFO: onlyIfChanged(action) };
    // case 'CONNECTOR_NAMES':
    //   return { ...state, CONNECTOR_NAMES: onlyIfChanged(action) };
    // case 'CONNECTORS':
    //   return { ...state, CONNECTORS: onlyIfChanged(action) };

    case 'connection':
      return { ...state, connection: onlyIfChanged(action) };

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
    case 'addStrategy':
      return {
        ...state,
        strategyRootMap: state.strategyRootMap.set(action.payload.address, action.payload),
      };

    default:
      return state;
  }
}

const ChainProvider = ({ children }: any) => {
  const [chainState, updateState] = React.useReducer(chainReducer, initState);

  const { connectionState, connectionActions } = useConnection();

  const { library, chainId, account, fallbackLibrary, fallbackChainId, CHAIN_INFO } = connectionState;

  const { isConnected, connect, disconnect } = connectionActions;

  /* CACHED VARIABLES */

  // const [lastChainId, setLastChainId] = useCachedState('lastChainId', 42);
  const [lastAppVersion, setLastAppVersion] = useCachedState('lastAppVersion', '');

  const [lastAssetUpdate, setLastAssetUpdate] = useCachedState('lastAssetUpdate', 0);
  const [lastSeriesUpdate, setLastSeriesUpdate] = useCachedState('lastSeriesUpdate', 0);

  const [cachedAssets, setCachedAssets] = useCachedState('assets', []);
  const [cachedSeries, setCachedSeries] = useCachedState('series', []);
  const [cachedStrategies, setCachedStrategies] = useCachedState('strategies', []);

  /**
   * Update on FALLBACK connection/state on network changes (id/library)
   */

  useEffect(() => {
    fallbackLibrary && updateState({ type: 'fallbackProvider', payload: fallbackLibrary });

    if (fallbackLibrary && fallbackChainId && CHAIN_INFO.get(fallbackChainId)?.supported) {
      console.log('Fallback ChainId: ', fallbackChainId);
      console.log('Primary ChainId: ', chainId);

      /* Get the instances of the Base contracts */
      const addrs = (yieldEnv.addresses as any)[fallbackChainId];
      const Cauldron = contracts.Cauldron__factory.connect(addrs.Cauldron, fallbackLibrary);
      const Ladle = contracts.Ladle__factory.connect(addrs.Ladle, fallbackLibrary);
      const ChainlinkMultiOracle = contracts.ChainlinkMultiOracle__factory.connect(
        addrs.ChainlinkMultiOracle,
        fallbackLibrary
      );
      const CompositeMultiOracle = contracts.CompositeMultiOracle__factory.connect(
        addrs.CompositeMultiOracle,
        fallbackLibrary
      );
      const Witch = contracts.Witch__factory.connect(addrs.Witch, fallbackLibrary);

      /* Update the baseContracts state : ( hardcoded based on networkId ) */
      const newContractMap = chainState.contractMap;
      newContractMap.set('Cauldron', Cauldron);
      newContractMap.set('Ladle', Ladle);
      newContractMap.set('Witch', Witch);
      newContractMap.set('ChainlinkMultiOracle', ChainlinkMultiOracle);
      newContractMap.set('CompositeMultiOracle', CompositeMultiOracle);
      updateState({ type: 'contractMap', payload: newContractMap });

      /* Get the hardcoded strategy addresses */
      const strategyAddresses = (yieldEnv.strategies as any)[fallbackChainId];

      /* add on extra/calculated ASSET info  and contract instances */
      const _chargeAsset = (asset: any) => {
        const ERC20Permit = contracts.ERC20Permit__factory.connect(asset.address, fallbackLibrary);
        return {
          ...asset,
          digitFormat: assetDigitFormatMap.has(asset.symbol) ? assetDigitFormatMap.get(asset.symbol) : 6,
          image: markMap.get(asset.symbol),
          color: (yieldEnv.assetColors as any)[asset.symbol],
          baseContract: ERC20Permit,

          /* baked in token fns */
          getBalance: async (acc: string) =>
            ETH_BASED_ASSETS.includes(asset.id) ? library?.getBalance(acc) : ERC20Permit.balanceOf(acc),
          getAllowance: async (acc: string, spender: string) => ERC20Permit.allowance(acc, spender),

          /* TODO remove for prod */
          /* @ts-ignore */
          mintTest: async () =>
            contracts.ERC20Mock__factory.connect(asset.address, library?.getSigner()!).mint(
              account!,
              ethers.utils.parseUnits('100', asset.decimals)
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
            const [name, symbol, decimals, version] = await Promise.all([
              ERC20.name(),
              ERC20.symbol(),
              ERC20.decimals(),
              id === USDC ? '2' : '1', // TODO  ERC20.version()
            ]);

            const newAsset = {
              id,
              address,
              name,
              symbol: symbol !== 'WETH' ? symbol : 'ETH',
              decimals,
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

      /* add on extra/calculated ASYNC series info and contract instances */
      const _chargeSeries = (series: {
        maturity: number;
        baseId: string;
        poolAddress: string;
        fyTokenAddress: string;
      }) => {
        /* contracts need to be added in again in when charging because the cached state only holds strings */
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
          displayName: format(new Date(series.maturity * 1000), 'dd MMM yyyy'),
          displayNameMobile: `${nameFromMaturity(series.maturity, 'MMM yyyy')}`,

          season,
          startColor,
          endColor,
          color: `linear-gradient(${startColor}, ${endColor})`,
          textColor,

          oppStartColor,
          oppEndColor,
          oppTextColor,
          seriesMark: <YieldMark colors={[startColor, endColor]} />,

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
        try {
          await Promise.all([
            ...seriesAddedEvents.map(async (x: any): Promise<void> => {
              const { seriesId: id, baseId, fyToken } = Cauldron.interface.parseLog(x).args;
              const { maturity } = await Cauldron.series(id);

              if (poolMap.has(id)) {
                // only add series if it has a pool
                const poolAddress: string = poolMap.get(id) as string;
                const poolContract = contracts.Pool__factory.connect(poolAddress, fallbackLibrary);
                const fyTokenContract = contracts.FYToken__factory.connect(fyToken, fallbackLibrary);
                // const baseContract = contracts.ERC20__factory.connect(fyToken, fallbackLibrary);
                const [name, symbol, version, decimals, poolName, poolVersion, poolSymbol] = await Promise.all([
                  fyTokenContract.name(),
                  fyTokenContract.symbol(),
                  fyTokenContract.version(),
                  fyTokenContract.decimals(),
                  poolContract.name(),
                  poolContract.version(),
                  poolContract.symbol(),
                  // poolContract.decimals(),
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
                  decimals,
                  poolAddress,
                  poolVersion,
                  poolName,
                  poolSymbol,
                };
                updateState({ type: 'addSeries', payload: _chargeSeries(newSeries) });
                newSeriesList.push(newSeries);
              }
            }),
          ]);
        } catch (e) {
          console.log('Error fetching series data: ', e);
        }
        setLastSeriesUpdate(await fallbackLibrary?.getBlockNumber());
        setCachedSeries([...cachedSeries, ...newSeriesList]);
        console.log('Yield Protocol Series data updated.');
      };

      /* Attach contract instance */
      const _chargeStrategy = (strategy: any) => {
        const Strategy = contracts.Strategy__factory.connect(strategy.address, fallbackLibrary);
        return {
          ...strategy,
          strategyContract: Strategy,
        };
      };

      /* Iterate through the strategies list and update accordingly */
      const _getStrategies = async () => {
        const newStrategyList: any[] = [];
        await Promise.all(
          strategyAddresses.map(async (strategyAddr: string) => {
            /* if the strategy is already in the cache : */
            if (cachedStrategies.findIndex((_s: any) => _s.address === strategyAddr) === -1) {
              const Strategy = contracts.Strategy__factory.connect(strategyAddr, fallbackLibrary);
              const [name, symbol, baseId, decimals, version] = await Promise.all([
                Strategy.name(),
                Strategy.symbol(),
                Strategy.baseId(),
                Strategy.decimals(),
                Strategy.version(),
              ]);

              const newStrategy = {
                id: strategyAddr,
                address: strategyAddr,
                symbol,
                name,
                version,
                baseId,
                decimals,
              };
              // update state and cache
              updateState({ type: 'addStrategy', payload: _chargeStrategy(newStrategy) });
              newStrategyList.push(newStrategy);
            }
          })
        );

        setCachedStrategies([...cachedStrategies, ...newStrategyList]);
        console.log('Yield Protocol Series data updated.');
      };

      /* LOAD the Series and Assets */
      if (cachedAssets.length === 0 || cachedSeries.length === 0) {
        console.log('FIRST LOAD: Loading Asset, Series and Strategies data ');
        (async () => {
          await Promise.all([_getAssets(), _getSeries(), _getStrategies()]);
          updateState({ type: 'chainLoading', payload: false });
        })();
      } else {
        // get assets, series and strategies from cache and 'charge' them, and add to state:
        cachedAssets.forEach((a: IAssetRoot) => {
          updateState({ type: 'addAsset', payload: _chargeAsset(a) });
        });
        cachedSeries.forEach((s: ISeriesRoot) => {
          updateState({ type: 'addSeries', payload: _chargeSeries(s) });
        });
        cachedStrategies.forEach((st: IStrategyRoot) => {
          updateState({ type: 'addStrategy', payload: _chargeStrategy(st) });
        });

        updateState({ type: 'chainLoading', payload: false });

        console.log('Checking for new Assets and Series, and Strategies ...');
        // then async check for any updates (they should automatically populate the map):
        (async () => Promise.all([_getAssets(), _getSeries(), _getStrategies()]))();
      }
    }
  }, [ account,
    fallbackChainId,
    fallbackLibrary,
    chainState.assetRootMap,
    chainState.seriesRootMap,
    chainState.strategyRootMap,
    chainState.contractMap,
    chainId
  ]);

  // /**
  //  * Update on PRIMARY connection any network changes (likely via metamask/walletConnect)
  //  */
  // useEffect(() => {
  //   console.log('Wallet/Account Active: ', active);
  //   updateState({ type: 'chainId', payload: chainId });
  //   updateState({ type: 'CHAIN_INFO', payload: CHAIN_INFO.get(chainId!) || null });
  //   updateState({ type: 'web3Active', payload: active });
  //   updateState({ type: 'provider', payload: library || null });
  //   updateState({ type: 'account', payload: account || null });
  //   updateState({ type: 'signer', payload: library?.getSigner(account!) || null });
  //   updateState({ type: 'connector', payload: connector || null });
  //   updateState({ type: 'activatingConnector', payload: activatingConnector || null });

  //   updateState({ type: 'CHAIN_INFO', payload: CHAIN_INFO || null });
  //   updateState({ type: 'CONNECTORS', payload: CONNECTORS || null });
  //   updateState({ type: 'CONNECTOR_NAMES', payload: CONNECTOR_NAMES || null });

  // }, [active, activatingConnector, account, chainId, library, connector, CHAIN_INFO, CONNECTORS, CONNECTOR_NAMES ]);

  /**
   * Update on PRIMARY connection any network changes (likely via metamask/walletConnect)
   */
  useEffect(() => {
    updateState({ type: 'connection', payload: { library, chainId, account, fallbackLibrary, fallbackChainId, CHAIN_INFO } });
  }, [library, chainId, account, fallbackLibrary, fallbackChainId, CHAIN_INFO ]);

  /* Handle version updates on first load -> complete refresh if app is different */
  useEffect(() => {
    updateState({ type: 'appVersion', payload: process.env.REACT_APP_VERSION });
    console.log('APP VERSION: ', process.env.REACT_APP_VERSION);
    if (process.env.REACT_APP_VERSION !== lastAppVersion) {
      window.localStorage.clear();
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    }
    setLastAppVersion(process.env.REACT_APP_VERSION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ignored to only happen once on init

  /* Pass on the connection actions */
  const chainActions = {
    isConnected,
    connect,
    disconnect,
  };

  return <ChainContext.Provider value={{ chainState, chainActions }}>{children}</ChainContext.Provider>;
};

export { ChainContext, ChainProvider };
