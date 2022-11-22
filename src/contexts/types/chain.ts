import { EthersMulticall, MulticallService } from '@yield-protocol/ui-multicall';
import { IAssetRoot } from '../../types';

export enum ChainState {
  CHAIN_LOADED = 'chainLoaded',
  ASSETS = 'assets',
  CLEAR_MAPS = 'clearMaps',
  MULTICALL = 'multicall',
}

export interface IChainContext {
  chainState: IChainContextState;
  chainActions: IChainContextActions;
}

export interface IChainContextState {
  chainLoaded: number;
  assetRootMap: Map<string, IAssetRoot>;
  multicall: EthersMulticall | null;
}

export interface IChainContextActions {
  exportContractAddresses: () => void;
}

type ChainLoadedAction = {
  type: ChainState.CHAIN_LOADED;
  payload: number;
};

type AssetsAction = {
  type: ChainState.ASSETS;
  payload: Map<string, IAssetRoot>;
};

type ClearMapsAction = {
  type: ChainState.CLEAR_MAPS;
};

type MulticallAction = {
  type: ChainState.MULTICALL;
  payload: EthersMulticall;
};

export type ChainContextActions = ChainLoadedAction | AssetsAction | ClearMapsAction | MulticallAction;
