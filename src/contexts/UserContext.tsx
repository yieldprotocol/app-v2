import { useReducer, useCallback, Dispatch, createContext, ReactNode } from 'react';
import { ISeries, IAsset, IVault, IStrategy } from '../types';
import { IUserContextActions, IUserContextState, UserContextAction, UserState } from './types/user';

const initState: IUserContextState = {
  /* Current User selections */
  selectedSeries: null,
  selectedIlk: null, // initial ilk
  selectedBase: null, // initial base
  selectedVault: null,
  selectedStrategy: null,
};

const initActions: IUserContextActions = {
  setSelectedVault: () => null,
  setSelectedIlk: () => null,
  setSelectedSeries: () => null,
  setSelectedBase: () => null,
  setSelectedStrategy: () => null,
};

const UserContext = createContext<{
  userState: IUserContextState;
  updateState: Dispatch<UserContextAction>;
  userActions: IUserContextActions;
}>({
  userState: initState,
  userActions: initActions,
  updateState: () => undefined,
});

function userReducer(state: IUserContextState, action: UserContextAction): IUserContextState {
  switch (action.type) {
    case UserState.SELECTED_VAULT:
      return { ...state, selectedVault: action.payload };
    case UserState.SELECTED_SERIES:
      return { ...state, selectedSeries: action.payload };
    case UserState.SELECTED_ILK:
      return { ...state, selectedIlk: action.payload };
    case UserState.SELECTED_BASE:
      return { ...state, selectedBase: action.payload };
    case UserState.SELECTED_STRATEGY:
      return { ...state, selectedStrategy: action.payload };
    default:
      return state;
  }
}

const UserProvider = ({ children }: { children: ReactNode }) => {
  /* LOCAL STATE */
  const [userState, updateState] = useReducer(userReducer, initState);

  /* Exposed userActions */
  const userActions = {
    setSelectedVault: useCallback(
      (vault: IVault | null) => updateState({ type: UserState.SELECTED_VAULT, payload: vault! }),
      []
    ),
    setSelectedIlk: useCallback(
      (asset: IAsset | null) => updateState({ type: UserState.SELECTED_ILK, payload: asset! }),
      []
    ),
    setSelectedSeries: useCallback(
      (series: ISeries | null) => updateState({ type: UserState.SELECTED_SERIES, payload: series! }),
      []
    ),
    setSelectedBase: useCallback(
      (asset: IAsset | null) => updateState({ type: UserState.SELECTED_BASE, payload: asset! }),
      []
    ),
    setSelectedStrategy: useCallback(
      (strategy: IStrategy | null) => updateState({ type: UserState.SELECTED_STRATEGY, payload: strategy! }),
      []
    ),
  } as IUserContextActions;

  return <UserContext.Provider value={{ userState, userActions, updateState }}>{children}</UserContext.Provider>;
};

export { UserContext };
export default UserProvider;
