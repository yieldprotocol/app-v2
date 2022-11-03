import { Contract } from 'ethers';
import { IAssetRoot, ISeriesRoot, IStrategyRoot } from '../../types';

export enum ChainState {
  CHAIN_LOADED = 'chainLoaded',
  ADD_SERIES = 'addSeries',
  ADD_ASSET = 'addAsset',
  ADD_STRATEGY = 'addStrategy',
  CLEAR_MAPS = 'clearMaps',
}

export interface IChainContext {
  chainState: IChainContextState;
  chainActions: IChainContextActions;
}

export interface IChainContextState {
  chainLoaded: boolean;
  contractMap: Map<string, Contract>;
  assetRootMap: Map<string, IAssetRoot>;
  seriesRootMap: Map<string, ISeriesRoot>;
  strategyRootMap: Map<string, IStrategyRoot>;
}

export interface IChainContextActions {
  exportContractAddresses: () => void;
}

type ChainLoadedAction = {
  type: ChainState.CHAIN_LOADED;
  payload: boolean;
};

type AddAssetAction = {
  type: ChainState.ADD_ASSET;
  payload: IAssetRoot;
};

type AddSeriesAction = {
  type: ChainState.ADD_SERIES;
  payload: ISeriesRoot;
};

type AddStrategyAction = {
  type: ChainState.ADD_STRATEGY;
  payload: IStrategyRoot;
};

type ClearMapsAction = {
  type: ChainState.CLEAR_MAPS;
};

export type ChainContextActions =
  | ChainLoadedAction
  | AddAssetAction
  | AddSeriesAction
  | AddStrategyAction
  | ClearMapsAction;
