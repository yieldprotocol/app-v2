import { IAsset, IDummyVault, ISeries, IStrategy, IVault } from '../../types';

export interface IUserContext {
  userState: IUserContextState;
  userActions: IUserContextActions;
}

export interface IUserContextActions {
  updateVaults: (vaultList?: IVault[]) => void;
  updateSeries: (seriesList: ISeries[]) => void;
  updateAssets: (assetList: IAsset[]) => void;
  updateStrategies: (strategyList: IStrategy[]) => void;

  setSelectedSeries: (series: ISeries | null) => void;
  setSelectedIlk: (ilk: IAsset | null) => void;
  setSelectedBase: (base: IAsset | null) => void;
  setSelectedVault: (vault: IVault | IDummyVault | null) => void;
  setSelectedStrategy: (strategy: IStrategy | null) => void;
}

export interface IUserContextState {
  userLoading: boolean;

  assetMap: Map<string, IAsset>;
  seriesMap: Map<string, ISeries>;
  vaultMap: Map<string, IVault>;
  strategyMap: Map<string, IStrategy>;

  vaultsLoading: boolean;
  seriesLoading: boolean;
  assetsLoading: boolean;
  strategiesLoading: boolean;

  selectedSeries: ISeries | null;
  selectedIlk: IAsset | null;
  selectedBase: IAsset | null;
  selectedVault: IVault | null;
  selectedStrategy: IStrategy | null;

  selectedBaseBalance: any,
  selectedIlkBalance: any,
}

export enum UserState {
  USER_LOADING = 'userLoading',

  ASSETS = 'assets',
  SERIES = 'series',
  VAULTS = 'vaults',
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

  SELECTED_ILK_BALANCE = 'selectedIlkBalance',
  SELECTED_BASE_BALANCE = 'selectedBaseBalance',
}

export type UserLoadingAction = {
  type: UserState.USER_LOADING;
  payload: boolean;
};

export type VaultsLoadingAction = {
  type: UserState.VAULTS_LOADING;
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
export type VaultsAction = {
  type: UserState.VAULTS;
  payload: Map<string, IVault>;
};

export type ClearVaultsAction = {
  type: UserState.CLEAR_VAULTS;
};

export type SelectedVaultAction = {
  type: UserState.SELECTED_VAULT;
  payload: IVault;
};

export type SelectedSeriesAction = {
  type: UserState.SELECTED_SERIES;
  payload: ISeries;
};

export type SelectedIlkAction = {
  type: UserState.SELECTED_ILK;
  payload: IAsset;
};
export type SelectedIlkBalanceAction = {
  type: UserState.SELECTED_ILK_BALANCE;
  payload: any; // TODO type this
};

export type SelectedBaseAction = {
  type: UserState.SELECTED_BASE;
  payload: IAsset;
};

export type SelectedBaseBalanceAction = {
  type: UserState.SELECTED_BASE_BALANCE;
  payload: any; // TODO type this
};

export type SelectedStrategyAction = {
  type: UserState.SELECTED_STRATEGY;
  payload: IStrategy;
};

export type UserContextAction =
  | UserLoadingAction
  | VaultsLoadingAction
  | SeriesLoadingAction
  | AssetsLoadingAction
  | StrategiesLoadingAction
  | AssetsAction
  | SeriesAction
  | StrategiesAction
  | VaultsAction
  | ClearVaultsAction
  | SelectedVaultAction
  | SelectedSeriesAction
  | SelectedIlkAction
  | SelectedBaseAction
  | SelectedBaseBalanceAction
  | SelectedIlkBalanceAction
  | SelectedStrategyAction;
