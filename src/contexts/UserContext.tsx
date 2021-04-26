import React, { useState, useContext, useEffect, useReducer } from 'react';
import { ethers } from 'ethers';

import { IYieldAsset, IYieldSeries, IYieldVault } from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, genVaultImage } from '../utils/displayUtils';

const UserContext = React.createContext<any>({});

const initState = {

  activeAccount: null as string|null,

  vaultMap: new Map() as Map<string, IYieldVault>,
  activeVault: null as IYieldVault|null,

  /* Current User selections */
  selectedSeries: null as IYieldSeries|null,
  selectedIlk: null as IYieldAsset|null,
  selectedBase: null as IYieldAsset|null,

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
    case 'activeAccount': return { ...state, activeAccount: onlyIfChanged(action) };

    case 'selectedSeries': return { ...state, selectedSeries: onlyIfChanged(action) };
    case 'selectedIlk': return { ...state, selectedIlk: onlyIfChanged(action) };
    case 'selectedBase': return { ...state, selectedBase: onlyIfChanged(action) };

    default: return state;
  }
}

const UserProvider = ({ children }:any) => {
  // const [cachedVaults, setCachedVaults] = useCachedState('vaults', { data: [], lastBlock: Number(process.env.REACT_APP_DEPLOY_BLOCK) });
  const { chainState } = useContext(ChainContext);
  const {
    contractMap,
    account,
    chainLoading,
    seriesMap,
    assetMap,
  } = chainState;

  const [userState, updateState] = useReducer(userReducer, initState);

  useEffect(() => {
    /* when there is an account and the chainContext is finsihed loading get the vaults */
    account &&
    !chainLoading &&
    (async () => {
      const Cauldron = contractMap.get('Cauldron');
      const filter = Cauldron.filters.VaultBuilt(null, account, null);
      const eventList = await Cauldron.queryFilter(filter, 1);
      // const eventList = await Cauldron.queryFilter(filter, cachedVaults.lastBlock);

      const vaultList : IYieldVault[] = await Promise.all(eventList.map(async (x:any) : Promise<IYieldVault> => {
        const { vaultId: id, ilkId, seriesId } = Cauldron.interface.parseLog(x).args;
        /* Add in the extra variable vault data */
        const { ink, art } = await Cauldron.balances(id);
        const series = seriesMap.get(seriesId);

        return {
          id,
          series,
          ilk: assetMap.get(ilkId),
          base: assetMap.get(series.baseId),
          ink,
          art,
          ink_: cleanValue(ethers.utils.formatEther(ink), 2), // for display purposes only
          art_: cleanValue(ethers.utils.formatEther(art), 2), // for display purposes only
          image: genVaultImage(id),
        };
      }));

      // const _combined = [...cachedVaults.data, ...vaultList];
      const _combined: IYieldVault[] = [...vaultList];
      const newVaultMap = _combined.reduce((acc:any, item:any) => {
        const _map = acc;
        _map.set(item.id, item);
        return _map;
      }, userState.vaultMap) as Map<string, IYieldVault>;

      console.log('VAULTS: ', newVaultMap);
      updateState({ type: 'vaultMap', payload: newVaultMap });
      // updateState({ type: 'activeVault', payload: newVaultMap.get(_combined[0]?.id) });

      /* Update the local cache storage */
      // setCachedVaults({ data: Array.from(newVaultMap.values()), lastBlock: await fallbackProvider.getBlockNumber() });
    })();
  }, [account, chainLoading, contractMap, userState.vaultMap, assetMap, seriesMap]);

  /* subscribe to vault event listeners */
  useEffect(() => {
    updateState({ type: 'activeAccount', payload: account });
  }, [account]);

  /* set initial state */
  useEffect(() => {
    !chainLoading && updateState({ type: 'selectedBase', payload: assetMap.get('0x444149000000') });
    !chainLoading && updateState({ type: 'selectedIlk', payload: assetMap.get('0x455448000000') });
  }, [chainLoading, assetMap]);

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
