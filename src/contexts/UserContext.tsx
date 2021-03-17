import React, { useState, useContext, useEffect, useReducer, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

import { IYieldAsset, IYieldSeries, IYieldVault, IYieldUser } from '../types';

import { ChainContext } from './ChainContext';

const UserContext = React.createContext<any>({});

const initState = {
  // vaultMap: new Map() as Map<string, IYieldVault>,
  vaultMap: null as Map<string, IYieldVault> | null, // for testing only
  activeVault: null as IYieldUser | null,

  activeSeries: null as IYieldSeries | null,
  activeAsset: null as IYieldAsset | null,
  activeUser: null as IYieldUser | null,

};

function userReducer(state:any, action:any) {
  switch (action.type) {
    case 'userLoading':
      return {
        ...state,
        seriesLoading: action.payload,
      };
    case 'activeVault':
      return {
        ...state,
        activeSeries: action.payload,
      };
    case 'vaultMap':
      return {
        ...state,
        vaultMap: action.payload,
      };
    default:
      return state;
  }
}

const UserProvider = ({ children }:any) => {
  const [vaultState, updateState] = useReducer(userReducer, initState);

  const { chainState: { account } } = useContext(ChainContext);

  useEffect(() => {
    account && console.log('okay, go!!!!');
  }, [account]);

  const vaultActions = {
    setActiveSeries: (series:IYieldSeries) => updateState({ type: 'activeSeries', payload: series }),
    // updateSeries: (seriesList: IYieldSeries[]) => updateSeries(seriesList),
  };

  return (
    <UserContext.Provider value={{ vaultState, vaultActions }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
