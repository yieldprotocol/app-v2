import React, { useState, useContext, useEffect, useReducer, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

import { IYieldAsset, IYieldSeries, IYieldVault } from '../types';

import { ChainContext } from './ChainContext';

const UserContext = React.createContext<any>({});

const initState = {
  vaultMap: new Map() as Map<string, IYieldVault>,

  activeVault: null as IYieldVault | null,
  activeSeries: null as IYieldSeries | null,
  activeAsset: null as IYieldAsset | null,

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
  const [userState, updateState] = useReducer(userReducer, initState);

  const { chainState: { contractMap, account, chainLoading } } = useContext(ChainContext);

  useEffect(() => {
    /* when chainContext is finsihed Loading get the vaults */
    account && !chainLoading && (async () => {
      const Cauldron = contractMap.get('Cauldron');
      const events = await Cauldron.filters.VaultBuilt(null, account, null);
      const eventList = await Cauldron.queryFilter(events);
      const vaultList = await Promise.all(eventList.map(async (x:any) => {
        const { vaultId: id, ilkId, seriesId } = Cauldron.interface.parseLog(x).args;
        /* Add in any extra static asset Data */
        return {
          id,
          seriesId,
          ilkId,
        };
      }));
      const newVaultMap = vaultList.reduce((acc:any, item:any) => {
        const _map = acc;
        _map.set(item.id, item);
        return _map;
      }, userState.vaultMap);
      updateState({ type: 'vaultMap', payload: newVaultMap });
    })();
  }, [account, chainLoading, contractMap, userState.vaultMap]);

  /* subscribe to vault event listeners */
  useEffect(() => {

  }, []);

  const vaultActions = {
    setActiveSeries: (series:IYieldSeries) => updateState({ type: 'activeSeries', payload: series }),
    // updateSeries: (seriesList: IYieldSeries[]) => updateSeries(seriesList),
  };

  return (
    <UserContext.Provider value={{ userState, vaultActions }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
