import { createContext, Dispatch, ReactNode, useEffect, useReducer } from 'react';
import { USDC } from '../config/assets';
import { ApprovalType } from '../types';
import { ISettingsContextActions, ISettingsContextState, Settings, SettingsContextAction } from './types/settings';

const initState: ISettingsContextState = {
  /* Use token approval by individual tranasaction */
  approvalMethod: ApprovalType.SIG,

  /* Approve MAX amount, so only one approval transaction is required */
  approveMax: false,

  /* Set the slippage tolerance to a particular % */
  slippageTolerance: 0.001,

  /* Color theme */
  darkMode: false,

  /* Has the usage disclaimer been checked? */
  disclaimerChecked: false,

  /* Is the user a 'power user' - future access to advanced settings/features */
  powerUser: false,

  /* Show wrapped tokens */
  showWrappedTokens: true,

  /* Always Unwrap tokens when removing them */
  unwrapTokens: false,

  /* Dashboard settings */
  dashHideEmptyVaults: false,
  dashHideInactiveVaults: false,
  dashHideVaults: false,
  dashHideLendPositions: false,
  dashHidePoolPositions: false,
  dashCurrency: USDC,

  /* Development settings */

  /* Always force transctions to the chain -> even if they will likely fail */
  forceTransactions: false,

  /* Show diagnostic messages in the console */
  diagnostics: false,
  
  /* use a forked network */
  useForkedEnv: false,
  forkEnvUrl:
    process.env.REACT_APP_DEFAULT_FORK_RPC_URL || process.env.REACT_APP_LOCALHOST_RPC_URL || 'http://127.0.0.1:8545',

  /* Mock a particular user */
  useMockedUser: false,
  mockUserAddress: undefined,
};

const initActions: ISettingsContextActions = {
  updateSetting: () => null,
};

const SettingsContext = createContext<{
  settingsState: ISettingsContextState;
  updateState: Dispatch<SettingsContextAction>;
  settingsActions: ISettingsContextActions;
}>({
  settingsState: initState,
  settingsActions: initActions,
  updateState: () => undefined,
});

function settingsReducer(state: ISettingsContextState, action: SettingsContextAction): ISettingsContextState {
  
  /* Helper: if different from existing , update the state and cache */
  const cacheAndUpdate = (_action: SettingsContextAction) => {
    if (state[action.type] === _action.payload) {
      return state[action.type];
    }
    localStorage.setItem(_action.type, JSON.stringify(_action.payload));
    return _action.payload;
  };
  return { ...state, [action.type]: cacheAndUpdate(action) };
}

const SettingsProvider = ({ children }: { children: ReactNode }) => {
  
  /* LOCAL STATE */
  const [settingsState, updateState] = useReducer(settingsReducer, initState);

  /* Pre - Update all settings in state based on localStorage */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Object.values(Settings).forEach((setting) => {
        if (JSON.parse(localStorage.getItem(setting)!) !== null) {
          updateState({ type: setting, payload: JSON.parse(localStorage.getItem(setting)!) });
        }
      });
    }
  }, []);

  /* ALWAYS use approval by tx if using forked env */
  useEffect(() => {
    if (settingsState.useForkedEnv) {
      updateState({ type: Settings.APPROVAL_METHOD, payload: ApprovalType.TX });
    }
  }, [settingsState.useForkedEnv]);

  /* Watch & handle linked approval and effect appropriate settings */
  useEffect(() => {
    if (settingsState.approvalMethod === ApprovalType.SIG) {
      updateState({ type: Settings.APPROVAL_MAX, payload: false });
    }
  }, [settingsState.approvalMethod]);

  /* Exposed settings Actions for updating */
  const settingsActions: ISettingsContextActions = {
    updateSetting: (setting: Settings, value: string | number | boolean | undefined) =>
      updateState({ type: setting, payload: value }),
  };

  return (
    <SettingsContext.Provider value={{ settingsState, settingsActions, updateState }}>
      {children}
    </SettingsContext.Provider>
  );
};

export { SettingsContext };
export default SettingsProvider;
