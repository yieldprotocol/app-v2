import React, { useEffect } from 'react';
import { BigNumber, Contract, ethers } from 'ethers';
import { format } from 'date-fns';

import { useCachedState } from '../hooks/generalHooks';
import { useConnection } from '../hooks/useConnection';

import yieldEnv from './yieldEnv.json';
import * as contracts from '../contracts';
import { IAssetInfo, IAssetRoot, IChainContextState, ISeriesRoot, IStrategyRoot, TokenType } from '../types';
import { ASSET_INFO, ETH_BASED_ASSETS, UNKNOWN } from '../config/assets';

import { nameFromMaturity, getSeason, SeasonType, clearCachedItems } from '../utils/appUtils';

import { ethereumColorMap, arbitrumColorMap } from '../config/colors';
import { AssetAddedEvent, SeriesAddedEvent } from '../contracts/Cauldron';
import { JoinAddedEvent, PoolAddedEvent } from '../contracts/Ladle';

import markMap from '../config/marks';
import YieldMark from '../components/logos/YieldMark';
import { getContracts } from '../lib/chain/contracts';
import { getAssets } from '../lib/chain/assets';
import { getSeries } from '../lib/chain/series';

enum ChainState {
  CHAIN_LOADING = 'chainLoading',
  APP_VERSION = 'appVersion',
  CONNECTION = 'connection',
  CONTRACT_MAP = 'contractMap',
  ADD_SERIES = 'addSeries',
  ADD_ASSET = 'addAsset',
  ADD_STRATEGY = 'addStrategy',
}

/* Build the context */
const ChainContext = React.createContext<any>({});

const initState: IChainContextState = {
  appVersion: '0.0.0' as string,

  connection: {
    provider: null as ethers.providers.Web3Provider | null,
    chainId: null as number | null,

    fallbackProvider: null as ethers.providers.Web3Provider | null,
    fallbackChainId: Number(process.env.REACT_APP_DEFAULT_CHAINID) as number | null,

    signer: null as ethers.providers.JsonRpcSigner | null,
    account: null as string | null,

    connectionName: null as string | null,
  },

  /* flags */
  chainLoading: true,

  /* Connected Contract Maps */
  contractMap: new Map<string, Contract>(),
  assetRootMap: new Map<string, IAssetRoot>(),
  seriesRootMap: new Map<string, ISeriesRoot>(),
  strategyRootMap: new Map<string, IStrategyRoot>(),
};

function chainReducer(state: IChainContextState, action: any) {
  /* Helper: only change the state if different from existing */
  const onlyIfChanged = (_action: any): IChainContextState =>
    state[action.type] === _action.payload ? state[action.type] : _action.payload;

  /* Reducer switch */
  switch (action.type) {
    case ChainState.CHAIN_LOADING:
      return { ...state, chainLoading: onlyIfChanged(action) };

    case ChainState.APP_VERSION:
      return { ...state, appVersion: onlyIfChanged(action) };

    case ChainState.CONNECTION:
      return { ...state, connection: onlyIfChanged(action) };

    case ChainState.CONTRACT_MAP:
      return { ...state, contractMap: onlyIfChanged(action) };

    case ChainState.ADD_SERIES:
      return {
        ...state,
        seriesRootMap: state.seriesRootMap.set(action.payload.id, action.payload),
      };

    case ChainState.ADD_ASSET:
      return {
        ...state,
        assetRootMap: state.assetRootMap.set(action.payload.id, action.payload),
      };

    case ChainState.ADD_STRATEGY:
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

  /* CACHED VARIABLES */
  const [lastAppVersion, setLastAppVersion] = useCachedState('lastAppVersion', '');

  const [lastAssetUpdate, setLastAssetUpdate] = useCachedState('lastAssetUpdate', 'earliest');
  const [lastSeriesUpdate, setLastSeriesUpdate] = useCachedState('lastSeriesUpdate', 'earliest');

  const [cachedAssets, setCachedAssets] = useCachedState('assets', []);
  const [cachedSeries, setCachedSeries] = useCachedState('series', []);
  const [cachedStrategies, setCachedStrategies] = useCachedState('strategies', []);

  /* Connection hook */
  const { connectionState, connectionActions } = useConnection();
  const { chainId, fallbackProvider, fallbackChainId } = connectionState;

  /**
   * Update on FALLBACK connection/state on network changes (id/library)
   */
  useEffect(() => {
    if (fallbackProvider && fallbackChainId) {
      console.log('Fallback ChainId: ', fallbackChainId);
      console.log('Primary ChainId: ', chainId);

      /* Get the instances of the Base contracts */
      const seasonColorMap = [1, 4, 5, 42].includes(chainId as number) ? ethereumColorMap : arbitrumColorMap;

      const contractMap = getContracts(fallbackProvider, fallbackChainId);
      updateState({ type: ChainState.CONTRACT_MAP, payload: contractMap });

      const Cauldron = contractMap.get('Cauldron');
      const Ladle = contractMap.get('Ladle');

      /* Get the hardcoded strategy addresses */
      const strategyAddresses = yieldEnv.strategies[fallbackChainId] as string[];

      /* Attach contract instance */

      const _chargeStrategy = (strategy: any) => {
        const Strategy = contracts.Strategy__factory.connect(strategy.address, fallbackProvider);
        return {
          ...strategy,
          strategyContract: Strategy,
        };
      };

      /* Iterate through the strategies list and update accordingly */
      const _getStrategies = async () => {
        const newStrategyList: any[] = [];
        try {
          await Promise.all(
            strategyAddresses.map(async (strategyAddr) => {
              /* if the strategy is NOT already in the cache : */
              if (cachedStrategies.findIndex((_s: any) => _s.address === strategyAddr) === -1) {
                console.log('updating constracrt ', strategyAddr);

                const Strategy = contracts.Strategy__factory.connect(strategyAddr, fallbackProvider);
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
                updateState({ type: ChainState.ADD_STRATEGY, payload: _chargeStrategy(newStrategy) });
                newStrategyList.push(newStrategy);
              }
            })
          );
        } catch (e) {
          console.log('Error fetching strategies', e);
        }

        const _filteredCachedStrategies = cachedStrategies.filter((s: any) => strategyAddresses.includes(s.address));

        setCachedStrategies([..._filteredCachedStrategies, ...newStrategyList]);
        console.log('Yield Protocol Strategy data updated.');
      };

      /**
       * LOAD the Series and Assets *
       * */
      if (cachedAssets.length === 0 || cachedSeries.length === 0) {
        console.log('FIRST LOAD: Loading Asset, Series and Strategies data ');
        (async () => {
          await Promise.all([
            getAssets(fallbackProvider, contractMap),
            getSeries(fallbackProvider, contractMap),
            _getStrategies(),
          ]);
          updateState({ type: ChainState.CHAIN_LOADING, payload: false });
        })();
      } else {
        cachedStrategies.forEach((st: IStrategyRoot) => {
          strategyAddresses.includes(st.address) &&
            updateState({ type: ChainState.ADD_STRATEGY, payload: _chargeStrategy(st) });
        });
        updateState({ type: ChainState.CHAIN_LOADING, payload: false });

        console.log('Checking for new Assets and Series, and Strategies ...');
        // then async check for any updates (they should automatically populate the map):
        (async () =>
          Promise.all([
            getAssets(fallbackProvider, contractMap),
            getSeries(fallbackProvider, contractMap),
            _getStrategies(),
          ]))();
      }
    }
  }, [fallbackChainId, fallbackProvider]);

  /**
   * Handle version updates on first load -> complete refresh if app is different to published version
   */
  useEffect(() => {
    updateState({ type: 'appVersion', payload: process.env.REACT_APP_VERSION });
    console.log('APP VERSION: ', process.env.REACT_APP_VERSION);
    if (lastAppVersion && process.env.REACT_APP_VERSION !== lastAppVersion) {
      clearCachedItems([
        'lastAppVersion',
        'lastChainId',
        'assets',
        'series',
        'lastAssetUpdate',
        'lastSeriesUpdate',
        'lastVaultUpdate',
        'strategies',
        'lastStrategiesUpdate',
        'connectionName',
      ]);
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    }
    setLastAppVersion(process.env.REACT_APP_VERSION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ignore to only happen once on init

  /**
   * Update on PRIMARY connection information on specific network changes (likely via metamask/walletConnect)
   */
  useEffect(() => {
    updateState({
      type: ChainState.CONNECTION,
      payload: connectionState,
    });
  }, [
    connectionState.fallbackChainId,
    connectionState.chainId,
    connectionState.account,
    connectionState.errorMessage,
    connectionState.fallbackErrorMessage,
    connectionState.active,
    connectionState.connectionName,
    connectionState.currentChainInfo,
  ]);

  /* simply Pass on the connection actions */
  const chainActions = connectionActions;

  return <ChainContext.Provider value={{ chainState, chainActions }}>{children}</ChainContext.Provider>;
};

export { ChainContext };

export default ChainProvider;
