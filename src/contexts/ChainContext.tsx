import React, { useEffect } from 'react';
import { Contract, ethers } from 'ethers';

import { useCachedState } from '../hooks/generalHooks';
import { useConnection } from '../hooks/useConnection';

import { IAssetRoot, IChainContextState, ISeriesRoot, IStrategyRoot } from '../types';

import { clearCachedItems } from '../utils/appUtils';

import { getContracts } from '../lib/chain/contracts';
import { getAssets } from '../lib/chain/assets';
import { getSeries } from '../lib/chain/series';
import { getStrategies } from '../lib/chain/strategies';

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

      const contractMap = getContracts(fallbackProvider, fallbackChainId);
      updateState({ type: ChainState.CONTRACT_MAP, payload: contractMap });

      (async () =>
        Promise.all([
          getAssets(fallbackProvider, contractMap),
          getSeries(fallbackProvider, contractMap),
          getStrategies(fallbackProvider),
        ]))();
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
