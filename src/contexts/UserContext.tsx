import React, { useState, useContext, useEffect, useReducer, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

import { IYieldAsset, IYieldSeries, IYieldVault } from '../types';

import { ChainContext } from './ChainContext';
import { useCachedState } from '../hooks';
import { cleanValue } from '../utils/displayUtils';

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
        activeVault: action.payload,
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
  // const [cachedVaults, setCachedVaults] = useCachedState('vaults', { data: [], lastBlock: Number(process.env.REACT_APP_DEPLOY_BLOCK) });
  const { chainState } = useContext(ChainContext);
  const {
    contractMap,
    account,
    chainLoading,
    fallbackProvider,
    seriesMap,
    assetMap,
  } = chainState;

  useEffect(() => {
    /* when chainContext is finsihed Loading get the vaults */
    account && !chainLoading && (async () => {
      const Cauldron = contractMap.get('Cauldron');
      const filter = Cauldron.filters.VaultBuilt(null, account, null);
      const eventList = await Cauldron.queryFilter(filter, 1);
      // const eventList = await Cauldron.queryFilter(filter, cachedVaults.lastBlock);

      const vaultList = await Promise.all(eventList.map(async (x:any) => {
        const { vaultId: id, ilkId, seriesId } = Cauldron.interface.parseLog(x).args;
        /* Add in the extra variable vault data */
        const { ink, art } = await Cauldron.balances(id);
        return {
          id,
          ink,
          art,
          series: seriesMap.get(seriesId),
          asset: assetMap.get(ilkId),
          assetBalance: ethers.BigNumber.from('0'),
          ink_: cleanValue(ethers.utils.formatEther(ink), 2), // for display purposes only
          art_: cleanValue(ethers.utils.formatEther(art), 2), // for display purposes only
        };
      }));

      // const _combined = [...cachedVaults.data, ...vaultList];
      const _combined = [...vaultList] as IYieldVault[];
      const newVaultMap = _combined.reduce((acc:any, item:any) => {
        const _map = acc;
        _map.set(item.id, item);
        return _map;
      }, userState.vaultMap) as Map<string, IYieldVault>;

      console.log('VAULTS: ', newVaultMap);
      updateState({ type: 'vaultMap', payload: newVaultMap });
      updateState({ type: 'activeVault', payload: newVaultMap.get(_combined[0]?.id) });

      /* Update the local cache storage */
      // setCachedVaults({ data: Array.from(newVaultMap.values()), lastBlock: await fallbackProvider.getBlockNumber() });
    })();
  }, [account, chainLoading, contractMap, userState.vaultMap]);

  /* subscribe to vault event listeners */
  useEffect(() => {

  }, []);

  const userActions = {
    setActiveVault: (vault:IYieldVault) => updateState({ type: 'activeVault', payload: vault }),
    // updateSeries: (seriesList: IYieldSeries[]) => updateSeries(seriesList),
  };

  return (
    <UserContext.Provider value={{ userState, userActions }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
