import React, { useEffect, useReducer } from 'react';
import { ApprovalType, ISettingsContextState } from '../types';

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
  USE_TENDERLY_FORK = 'useTenderlyFork',
  USE_FORK = 'useFork',
  FORK_RPC = 'forkUrl',
}

const SettingsContext = React.createContext<any>({});

const initState: ISettingsContextState = {
  /* Use token approval by individual tranasaction */
  approvalMethod: ApprovalType.SIG,

  /* Approve MAX amount, so only one approval transaction is required */
  approveMax: false,

  /* Set the slippage tolerance to a particular % */
  slippageTolerance: 0.001,

  /* Show diagnostic messages in the console */
  diagnostics: false,

  /* Color theme */
  darkMode: false,

  /* Set color theme based on system */
  autoTheme: true,

  /* Has the usage disclaimer been checked? */
  disclaimerChecked: false,

  /* Is the user a 'power user' - future access to advanced settings/features */
  powerUser: false,

  /* Always force transctions to the chain -> even if they will likely fail */
  forceTransactions: false,

  /* Show wrapped tokens */
  showWrappedTokens: true,

  /* Always Unwrap tokens when removing them */
  unwrapTokens: false,

  /* If using tenderly fork environment */
  useTenderlyFork: false,

  /* Dashboard settings */
  dashHideEmptyVaults: false,
  dashHideInactiveVaults: false,
  dashHideVaults: false,
  dashHideLendPositions: false,
  dashHidePoolPositions: false,
  dashCurrency: 'USDC',

  useFork: false,
  forkUrl: 'https://rpc.tenderly.co/fork/717ceb3b-f9a9-4fa0-b1ea-3eb0dd114ddf',
};

function settingsReducer(state: ISettingsContextState, action: any) {
  /* Helper: if different from existing , update the state and cache */
  const cacheAndUpdate = (_action: any) => {
    if (state[action.type] === _action.payload) {
      return state[action.type];
    }
    localStorage.setItem(_action.type, JSON.stringify(_action.payload));
    return _action.payload;
  };
  return { ...state, [action.type]: cacheAndUpdate(action) };
}

const SettingsProvider = ({ children }: any) => {
  /* LOCAL STATE */
  const [settingsState, updateState] = useReducer(settingsReducer, initState);

  /* watch & handle linked approval and effect appropriate settings */
  useEffect(() => {
    if (settingsState.approvalMethod === ApprovalType.SIG) {
      updateState({ type: Settings.APPROVAL_MAX, payload: false });
    }
  }, [settingsState.approvalMethod]);

  /* watch & handle connection changes and effect appropriate settings */
  // useEffect(() => {
  //   if ((connector?.id !== 'metaMask') || useTenderlyFork) {
  //     console.log('Using manual ERC20 approval transactions');
  //     updateState({ type: Settings.APPROVAL_METHOD, payload: ApprovalType.TX });
  //   } else if (connector?.id === 'metaMask') {
  //     /* On metamask default to SIG */
  //     console.log('Using ERC20Permit signing (EIP-2612) ');
  //     updateState({ type: Settings.APPROVAL_METHOD, payload: ApprovalType.SIG });
  //   }
  // }, [connector]);

  /* Exposed userActions */
  const settingsActions = {
    updateSetting: (setting: string, value: string) => updateState({ type: setting, payload: value }),
  };

  /* Update all settings in state based on localStorage */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Object.values(Settings).forEach((setting) => {
        if (JSON.parse(localStorage.getItem(setting)!) !== null) {
          updateState({ type: setting, payload: JSON.parse(localStorage.getItem(setting)!) });
        }
      });
    }
  }, []);

  /* switch to ALWAYS use approval by tx if using tenderly fork */
  useEffect(() => {
    if (settingsState.useTenderlyFork) {
      updateState({ type: Settings.APPROVAL_METHOD, payload: ApprovalType.TX });
    }
  }, [settingsState.useTenderlyFork]);

  return <SettingsContext.Provider value={{ settingsState, settingsActions }}>{children}</SettingsContext.Provider>;
};

export { SettingsContext };
export default SettingsProvider;
