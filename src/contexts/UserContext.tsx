import React, { useState, useContext, useEffect, useReducer } from 'react';
import { ethers } from 'ethers';

import { IAsset, ISeries, IVault, ISeriesData, IAssetData } from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, genVaultImage } from '../utils/displayUtils';

const UserContext = React.createContext<any>({});

const initState = {

  activeAccount: null as string|null,

  seriesData: new Map() as Map<string, ISeriesData>,
  assetData: new Map() as Map<string, IAssetData>,

  vaultMap: new Map() as Map<string, IVault>,
  activeVault: null as IVault|null,

  /* Current User selections */
  selectedSeries: null as ISeries|null,
  selectedIlk: null as IAsset|null,
  selectedBase: null as IAsset|null,

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

  const updateVaults = async () => {
    const Cauldron = contractMap.get('Cauldron');
    const filter = Cauldron.filters.VaultBuilt(null, account, null);
    const eventList = await Cauldron.queryFilter(filter, 1);
    // const eventList = await Cauldron.queryFilter(filter, cachedVaults.lastBlock);
    const vaultList : IVault[] = await Promise.all(eventList.map(async (x:any) : Promise<IVault> => {
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
    const _combined: IVault[] = [...vaultList];
    const newVaultMap = _combined.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.vaultMap) as Map<string, IVault>;

    console.log('VAULTS: ', newVaultMap);
    updateState({ type: 'vaultMap', payload: newVaultMap });
    /* Update the local cache storage */
    // setCachedVaults({ data: Array.from(newVaultMap.values()), lastBlock: await fallbackProvider.getBlockNumber() });
  };

  const updateSeriesPosition = async () => {

  };

  const updateAssetPosition = async () => {

  };

  useEffect(() => {
    /* when there is an account and the chainContext is finsihed loading get the vaults */
    account &&
    !chainLoading &&
    (async () => {
      const Cauldron = contractMap.get('Cauldron');
      const filter = Cauldron.filters.VaultBuilt(null, account, null);
      const eventList = await Cauldron.queryFilter(filter, 1);
      // const eventList = await Cauldron.queryFilter(filter, cachedVaults.lastBlock);
      const vaultList : IVault[] = await Promise.all(eventList.map(async (x:any) : Promise<IVault> => {
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
      const _combined: IVault[] = [...vaultList];
      const newVaultMap = _combined.reduce((acc:any, item:any) => {
        const _map = acc;
        _map.set(item.id, item);
        return _map;
      }, userState.vaultMap) as Map<string, IVault>;

      console.log('VAULTS: ', newVaultMap);
      updateState({ type: 'vaultMap', payload: newVaultMap });
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
    setActiveVault: (vault:IVault) => updateState({ type: 'activeVault', payload: vault }),
    setSelectedIlk: (asset:IAsset) => updateState({ type: 'selectedIlk', payload: asset }),
    setSelectedSeries: (series:ISeries) => updateState({ type: 'selectedSeries', payload: series }),
    setSelectedBase: (asset:IAsset) => updateState({ type: 'selectedBase', payload: asset }),
  };

  return (
    <UserContext.Provider value={{ userState, userActions }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
