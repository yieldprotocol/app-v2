import React, { useContext, useEffect, useReducer } from 'react';
import { ApprovalType, ISettingsContextState } from '../types';
import { ChainContext } from './ChainContext';

const SettingsContext = React.createContext<any>({});

const initState: ISettingsContextState = {
  /* User Settings ( getting from the cache first ) */
  approvalMethod: (JSON.parse(localStorage.getItem('approvalMethod')!) as ApprovalType) || ApprovalType.SIG,
  approveMax: (JSON.parse(localStorage.getItem('approveMax')!) as boolean) || (false as boolean),

  slippageTolerance: (JSON.parse(localStorage.getItem('slippageTolerance')!) as number) || (0.005 as number),
  dudeSalt: 21, // (JSON.parse(localStorage.getItem('dudeSalt')!) as number) || (21 as number),
  diagnostics: (JSON.parse(localStorage.getItem('diagnostics')!) as boolean) || (false as boolean),

  darkMode: (JSON.parse(localStorage.getItem('darkMode')!) as boolean) || (false as boolean),
  autoTheme: (JSON.parse(localStorage.getItem('autoTheme')!) as boolean) || (false as boolean),

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
  return { ...state, [action.type]: cacheAndUpdate(action) };
}

const SettingsProvider = ({ children }: any) => {
  /* LOCAL STATE */
  const [settingsState, updateState] = useReducer(settingsReducer, initState);

  /* STATE FROM CONTEXT */
  const {
    chainState: { connection },
  } = useContext(ChainContext);

  /* handle linked approval settings */
  useEffect(() => { 
    if (settingsState.approvalMethod === ApprovalType.SIG) {
      updateState({ type: 'approveMax', payload: false });
    }
  }, [ settingsState.approvalMethod  ]);

  useEffect(() => {
    if (connection.connectionName && connection.connectionName !== 'metamask') {
      console.log('Using manual ERC20 approval transactions');
      updateState( { type: 'approvalMethod', payload: ApprovalType.TX } )
    } else if (connection.connectionName === 'metamask' ) {
      /* On metamask default to SIG */ 
      console.log('Using ERC20Permit signing (EIP-2612) ');
      updateState( { type: 'approvalMethod', payload: ApprovalType.SIG } )
    }

  }, [connection.connectionName]);

  /* Exposed userActions */
  const settingsActions = {
    updateSetting: (setting: string, value: string) => updateState({ type: setting, payload: value }),
  };

  return <SettingsContext.Provider value={{ settingsState, settingsActions }}>{children}</SettingsContext.Provider>;
};

export { SettingsContext, SettingsProvider };
