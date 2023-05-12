import { IAsset, IDummyVault, ISeries, IStrategy, IVault } from '../../types';

export interface IUserContext {
  userState: IUserContextState;
  userActions: IUserContextActions;
}

export interface IUserContextActions {
  updateSeries: (seriesList: ISeries[]) => void;
  updateAssets: (assetList: IAsset[]) => void;
  updateStrategies: (strategyList: IStrategy[]) => void;

  setSelectedSeries: (series: ISeries | null) => void;
  setSelectedIlk: (ilk: IAsset | null) => void;
  setSelectedBase: (base: IAsset | null) => void;
  setSelectedVault: (vault: IVault | IDummyVault | null) => void;
  setSelectedStrategy: (strategy: IStrategy | null) => void;
  setSelectedVR: (vr: boolean | null) => void;
}

export interface IUserContextState {
  userLoading: boolean;

  assetMap: Map<string, IAsset>;
  seriesMap: Map<string, ISeries>;
  strategyMap: Map<string, IStrategy>;

  seriesLoading: boolean;
  assetsLoading: boolean;
  strategiesLoading: boolean;

  selectedSeries: ISeries | null;
  selectedIlk: IAsset | null;
  selectedBase: IAsset | null;
  selectedVault: IVault | null;
  selectedStrategy: IStrategy | null;
  selectedVR: boolean;
}

export enum UserState {
  USER_LOADING = 'userLoading',

  ASSETS = 'assets',
  SERIES = 'series',
  STRATEGIES = 'strategies',

  CLEAR_VAULTS = 'clearVaults',

  VAULTS_LOADING = 'vaultsLoading',
  SERIES_LOADING = 'seriesLoading',
  ASSETS_LOADING = 'assetsLoading',
  STRATEGIES_LOADING = 'strategiesLoading',

  SELECTED_VAULT = 'selectedVault',
  SELECTED_SERIES = 'selectedSeries',
  SELECTED_ILK = 'selectedIlk',
  SELECTED_BASE = 'selectedBase',
  SELECTED_STRATEGY = 'selectedStrategy',
  SELECTED_VR = 'selectedVR',
}

export type UserLoadingAction = {
  type: UserState.USER_LOADING;
  payload: boolean;
};

export type SeriesLoadingAction = {
  type: UserState.SERIES_LOADING;
  payload: boolean;
};

export type AssetsLoadingAction = {
  type: UserState.ASSETS_LOADING;
  payload: boolean;
};

export type StrategiesLoadingAction = {
  type: UserState.STRATEGIES_LOADING;
  payload: boolean;
};

export type AssetsAction = {
  type: UserState.ASSETS;
  payload: Map<string, IAsset>;
};

export type SeriesAction = {
  type: UserState.SERIES;
  payload: Map<string, ISeries>;
};

export type StrategiesAction = {
  type: UserState.STRATEGIES;
  payload: Map<string, IStrategy>;
};

export type SelectedVaultAction = {
  type: UserState.SELECTED_VAULT;
  payload: IVault;
};

export type SelectedSeriesAction = {
  type: UserState.SELECTED_SERIES;
  payload: ISeries | null;
};

export type SelectedIlkAction = {
  type: UserState.SELECTED_ILK;
  payload: IAsset;
};

export type SelectedBaseAction = {
  type: UserState.SELECTED_BASE;
  payload: IAsset;
};

export type SelectedStrategyAction = {
  type: UserState.SELECTED_STRATEGY;
  payload: IStrategy;
};

export type SelectedVRAction = {
  type: UserState.SELECTED_VR;
  payload: boolean;
};

export type UserContextAction =
  | UserLoadingAction
  | SeriesLoadingAction
  | AssetsLoadingAction
  | StrategiesLoadingAction
  | AssetsAction
  | SeriesAction
  | StrategiesAction
  | SelectedVaultAction
  | SelectedSeriesAction
  | SelectedIlkAction
  | SelectedBaseAction
  | SelectedStrategyAction
  | SelectedVRAction;
