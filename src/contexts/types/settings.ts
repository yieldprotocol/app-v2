import { ApprovalType } from '../../types';

export enum Settings {
  APPROVAL_METHOD = 'approvalMethod',
  APPROVAL_MAX = 'approveMax',
  SLIPPAGE_TOLERANCE = 'slippageTolerance',
  DIAGNOSTICS = 'diagnostics',
  DARK_MODE = 'darkMode',
  AUTO_THEME = 'autoTheme',
  DISCLAIMER_CHECKED = 'disclaimerChecked',
  POWER_USER = 'powerUser',
  FORCE_TRANSACTIONS = 'forceTransactions',
  SHOW_WRAPPED_TOKENS = 'showWrappedTokens',
  UNWRAP_TOKENS = 'unwrapTokens',
  DASH_HIDE_EMPTY_VAULTS = 'dashHideEmptyVaults',
  DASH_HIDE_INACTIVE_VAULTS = 'dashHideInactiveVaults',
  DASH_HIDE_VAULTS = 'dashHideVaults',
  DASH_HIDE_LEND_POSITIONS = 'dashHideLendPositions',
  DASH_HIDE_POOL_POSITIONS = 'dashHidePoolPositions',
  DASH_CURRENCY = 'dashCurrency',

  USE_FORKED_ENV = 'useForkedEnv',
  FORK_ENV_URL = 'forkEnvUrl',

  USE_MOCKED_USER = 'useMockedUser',
  MOCK_USER_ADDRESS = 'mockUserAddress',
}

export interface ISettingsContext {
  settingsState: ISettingsContextState;
  settingsActions: ISettingsContextActions;
}

export interface ISettingsContextActions {
  updateSetting: (setting: Settings, value: string | number | boolean ) => void;
}
export type SettingsContextAction = { type: Settings; payload: string | number | boolean };

export interface ISettingsContextState {
  /* User Settings ( getting from the cache first ) */
  slippageTolerance: number;
  darkMode: boolean;
  autoTheme: boolean;

  approvalMethod: ApprovalType;
  approveMax: boolean;
  disclaimerChecked: boolean;
  powerUser: boolean;

  /* Token wrapping */
  showWrappedTokens: boolean;
  unwrapTokens: boolean;

  /* DashSettings */
  dashHideEmptyVaults: boolean;
  dashHideInactiveVaults: boolean;
  dashHideVaults: boolean;
  dashHideLendPositions: boolean;
  dashHidePoolPositions: boolean;
  dashCurrency: string;

  /* developer setttings */
  forceTransactions: boolean;
  diagnostics: boolean;

  useForkedEnv: boolean;
  forkEnvUrl: string;

  useMockedUser: boolean;
  mockUserAddress: `0x${string}`;

}

