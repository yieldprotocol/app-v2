import { IAssetRoot, ISeriesRoot, IStrategyRoot } from '../../types';

export enum ChainState {
  CHAIN_LOADED = 'chainLoaded',
  ADD_ASSET = 'addAsset',
  ADD_STRATEGY = 'addStrategy',
  CLEAR_MAPS = 'clearMaps',
}

export interface IChainContext {
  chainState: IChainContextState;
  chainActions: IChainContextActions;
}

export interface IChainContextState {
  chainLoaded: number;
  assetRootMap: Map<string, IAssetRoot>;
  strategyRootMap: Map<string, IStrategyRoot>;
}

export interface IChainContextActions {
  exportContractAddresses: () => void;
}

type ChainLoadedAction = {
  type: ChainState.CHAIN_LOADED;
  payload: number;
};

type AddAssetAction = {
  type: ChainState.ADD_ASSET;
  payload: IAssetRoot;
};

type AddStrategyAction = {
  type: ChainState.ADD_STRATEGY;
  payload: IStrategyRoot;
};

type ClearMapsAction = {
  type: ChainState.CLEAR_MAPS;
};

export type ChainContextActions = ChainLoadedAction | AddAssetAction | AddStrategyAction | ClearMapsAction;
