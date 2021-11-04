import React, { useReducer } from 'react';
import { ApprovalType, ISettingsContextState } from '../types';

const SettingsContext = React.createContext<any>({});

const initState: ISettingsContextState = {
  /* User Settings ( getting from the cache first ) */
  approvalMethod: (JSON.parse(localStorage.getItem('approvalMethod')!) as ApprovalType) || ApprovalType.SIG,
  approveMax: (JSON.parse(localStorage.getItem('approveMax')!) as boolean) || (false as boolean),

  slippageTolerance: (JSON.parse(localStorage.getItem('slippageTolerance')!) as number) || (0.005 as number),
  dudeSalt: 21, // (JSON.parse(localStorage.getItem('dudeSalt')!) as number) || (21 as number),
  diagnostics: (JSON.parse(localStorage.getItem('diagnostics')!) as boolean) || (false as boolean),
  
  darkMode: (JSON.parse(localStorage.getItem('darkMode')!) as boolean) || (false as boolean),
  autoTheme: (JSON.parse(localStorage.getItem('autoTheme')!) as boolean) || (true as boolean),

  
  disclaimerChecked: (JSON.parse(localStorage.getItem('disclaimerChecked')!) as boolean) || (false as boolean), 
  powerUser: (JSON.parse(localStorage.getItem('powerUser')!) as boolean) || (false as boolean),

  dashHideEmptyVaults: (JSON.parse(localStorage.getItem('dashHideEmptyVaults')!) as boolean) || false,
  dashHideInactiveVaults: (JSON.parse(localStorage.getItem('dashHideInactiveVaults')!) as boolean) || false,
  dashHideVaults: (JSON.parse(localStorage.getItem('dashHideVaults')!) as boolean) || false,
  dashHideLendPositions: (JSON.parse(localStorage.getItem('dashHideLendPostions')!) as boolean) || false,
  dashHidePoolPositions: (JSON.parse(localStorage.getItem('dashHidePoolPositions')!) as boolean) || false,
  dashCurrency: (JSON.parse(localStorage.getItem('dashCurrency')!) as string) || 'DAI',

};

function settingsReducer(state: any, action: any) {
  /* Helper: if different from existing , update the state and cache */
  const cacheAndUpdate = (_action: any) => {
    if (state[action.type] === _action.payload) {
      return state[action.type];
    }
    localStorage.setItem(_action.type, JSON.stringify(_action.payload));
    return _action.payload;
  };
  return { ...state, [action.type]: cacheAndUpdate(action) }
}

const SettingsProvider = ({ children }: any) => {
  /* LOCAL STATE */
  const [settingsState, updateState] = useReducer(settingsReducer, initState);

  /* action that is always performed on component load */
  // useEffect(() => {
  // }, [chainLoading]);

  /* Exposed userActions */
  const settingsActions = {
    updateSetting: (setting: string, value: string) => updateState({ type: setting, payload: value }),
  };

  return <SettingsContext.Provider value={{ settingsState, settingsActions }}>{children}</SettingsContext.Provider>;
};

export { SettingsContext, SettingsProvider };
