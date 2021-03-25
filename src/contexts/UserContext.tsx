import React, { useState, useContext, useEffect, useReducer, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

import { IYieldAsset, IYieldSeries, IYieldVault } from '../types';

import { ChainContext } from './ChainContext';
import { useCachedState } from '../hooks';
import { cleanValue, genVaultImage } from '../utils/displayUtils';

const UserContext = React.createContext<any>({});

const initState = {
  vaultMap: new Map() as Map<string, IYieldVault>,
  activeVault: null as IYieldVault | null,

  /* user selections */
  selectedSeries: null as IYieldSeries | null,
  selectedIlk: null as IYieldAsset| null,
  selectedBase: null as IYieldAsset| null,

};

function userReducer(state:any, action:any) {
  /* Helper: only change the state if different from existing */
  const onlyIfChanged = (_action: any) => (
    state[action.type] === _action.payload
      ? state[action.type]
      : _action.payload
  );

  /* Reducer switch */
  switch (action.type) {
    case 'userLoading': return { ...state, seriesLoading: onlyIfChanged(action) };

    case 'vaultMap': return { ...state, vaultMap: onlyIfChanged(action) };
    case 'activeVault': return { ...state, activeVault: onlyIfChanged(action) };

    case 'selectedSeries': return { ...state, selectedSeries: onlyIfChanged(action) };
    case 'selectedIlk': return { ...state, selectedIlk: onlyIfChanged(action) };
    case 'selectedBase': return { ...state, selectedBase: onlyIfChanged(action) };

    default: return state;
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
          image: genVaultImage(id),
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
  }, [account, chainLoading, contractMap, userState.vaultMap, assetMap, seriesMap]);

  /* subscribe to vault event listeners */
  useEffect(() => {

  }, []);

  /* set initial state */
  useEffect(() => {
    account && !chainLoading && updateState({ type: 'selectedBase', payload: assetMap.values().next().value });
    account && !chainLoading && updateState({ type: 'selectedIlk', payload: assetMap.values().next().value });
  }, [account, chainLoading, assetMap]);

  const userActions = {
    setActiveVault: (vault:IYieldVault) => updateState({ type: 'activeVault', payload: vault }),
    setSelectedIlk: (asset:IYieldAsset) => updateState({ type: 'selectedIlk', payload: asset }),
    setSelectedSeries: (series:IYieldSeries) => updateState({ type: 'selectedSeries', payload: series }),
    setSelectedBase: (asset:IYieldAsset) => updateState({ type: 'selectedBase', payload: asset }),

  };

  return (
    <UserContext.Provider value={{ userState, userActions }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
