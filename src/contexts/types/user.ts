import { IAsset, IDummyVault, ISeries, IStrategy, IVault } from '../../types';

export interface IUserContextActions {
  updateVaults: (vaultList?: IVault[]) => void;
  updateSeries: (seriesList: ISeries[]) => void;

  setSelectedSeries: (series: ISeries | null) => void;
  setSelectedIlk: (ilk: IAsset | null) => void;
  setSelectedBase: (base: IAsset | null) => void;
  setSelectedVault: (vault: IVault | IDummyVault | null) => void;
  setSelectedStrategy: (strategy: IStrategy | null) => void;
}

export interface IUserContextState {
  userLoading: boolean;

  seriesMap: Map<string, ISeries>;
  vaultMap: Map<string, IVault>;

  vaultsLoading: boolean;
  seriesLoading: boolean;
  assetsLoading: boolean;

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

  SERIES = 'series',
  VAULTS = 'vaults',

  CLEAR_VAULTS = 'clearVaults',

  VAULTS_LOADING = 'vaultsLoading',
  SERIES_LOADING = 'seriesLoading',

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

export type SeriesAction = {
  type: UserState.SERIES;
  payload: Map<string, ISeries>;
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
  | SeriesAction
  | VaultsAction
  | ClearVaultsAction
  | SelectedVaultAction
  | SelectedSeriesAction
  | SelectedIlkAction
  | SelectedBaseAction
  | SelectedBaseBalanceAction
  | SelectedIlkBalanceAction
  | SelectedStrategyAction;
