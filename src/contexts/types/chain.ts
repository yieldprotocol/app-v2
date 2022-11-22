import { IAssetRoot, IStrategyRoot } from '../../types';

export enum ChainState {
  CHAIN_LOADED = 'chainLoaded',
  ADD_ASSET = 'addAsset',
  CLEAR_MAPS = 'clearMaps',
}

export interface IChainContext {
  chainState: IChainContextState;
  chainActions: IChainContextActions;
}

export interface IChainContextState {
  chainLoaded: number;
  assetRootMap: Map<string, IAssetRoot>;
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

type ClearMapsAction = {
  type: ChainState.CLEAR_MAPS;
};

export type ChainContextActions = ChainLoadedAction | AddAssetAction | ClearMapsAction;
