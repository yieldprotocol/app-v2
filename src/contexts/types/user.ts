import { IAsset, IDummyVault, ISeries, IStrategy, IVault } from '../../types';

export interface IUserContextActions {
  setSelectedSeries: (series: ISeries | null) => void;
  setSelectedIlk: (ilk: IAsset | null) => void;
  setSelectedBase: (base: IAsset | null) => void;
  setSelectedVault: (vault: IVault | IDummyVault | null) => void;
  setSelectedStrategy: (strategy: IStrategy | null) => void;
}

export interface IUserContextState {
  selectedSeries: ISeries | null;
  selectedIlk: IAsset | null;
  selectedBase: IAsset | null;
  selectedVault: IVault | null;
  selectedStrategy: IStrategy | null;
}

export enum UserState {
  SELECTED_VAULT = 'selectedVault',
  SELECTED_SERIES = 'selectedSeries',
  SELECTED_ILK = 'selectedIlk',
  SELECTED_BASE = 'selectedBase',
  SELECTED_STRATEGY = 'selectedStrategy',
}

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

export type SelectedBaseAction = {
  type: UserState.SELECTED_BASE;
  payload: IAsset;
};

export type SelectedStrategyAction = {
  type: UserState.SELECTED_STRATEGY;
  payload: IStrategy;
};

export type UserContextAction =
  | SelectedVaultAction
  | SelectedSeriesAction
  | SelectedIlkAction
  | SelectedBaseAction
  | SelectedStrategyAction;
