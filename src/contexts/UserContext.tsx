import React, { useState, useContext, useEffect, useReducer, useCallback } from 'react';
import { BigNumber, ethers } from 'ethers';

import { IAsset, ISeries, IVault, ISeriesData, IAssetData, IVaultData } from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, genVaultImage } from '../utils/displayUtils';

const UserContext = React.createContext<any>({});

const initState = {

  activeAccount: null as string|null,

  seriesData: new Map() as Map<string, ISeriesData>,
  assetData: new Map() as Map<string, IAssetData>,
  vaultData: new Map() as Map<string, IVaultData>,

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

    case 'assetData': return { ...state, assetData: onlyIfChanged(action) };
    case 'seriesData': return { ...state, seriesData: onlyIfChanged(action) };
    case 'vaultData': return { ...state, vaultData: onlyIfChanged(action) };

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

  const getVaults = useCallback(async () => {
    const Cauldron = contractMap.get('Cauldron');
    const filter = Cauldron.filters.VaultBuilt(null, account, null);
    const eventList = await Cauldron.queryFilter(filter, 1);
    // const eventList = await Cauldron.queryFilter(filter, cachedVaults.lastBlock);
    const vaultList : IVault[] = await Promise.all(eventList.map(async (x:any) : Promise<IVault> => {
      const { vaultId: id, ilkId, seriesId } = Cauldron.interface.parseLog(x).args;
      const series = seriesMap.get(seriesId);
      return {
        id,
        series,
        ilk: assetMap.get(ilkId),
        base: assetMap.get(series.baseId),
        image: genVaultImage(id),
      };
    }));

    // TODO const _combined: IVault[] = [...vaultList, ...cachedVaults];

    const newVaultMap = vaultList.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.vaultMap) as Map<string, IVault>;

    console.log('VAULTS: ', newVaultMap);
    updateState({ type: 'vaultMap', payload: newVaultMap });
    return newVaultMap;
    /* Update the local cache storage */
    // TODO setCachedVaults({ data: Array.from(newVaultMap.values()), lastBlock: await fallbackProvider.getBlockNumber() });
  }, [account, contractMap, userState.vaultMap, assetMap, seriesMap]);

  /* Updates the series with relevant *user* data */
  const updateSeries = useCallback(async (seriesList: ISeries[]) => {
    /* Add in the dynamic series data of the series in the list */
    const seriesListMod = await Promise.all(
      seriesList.map(async (series:ISeries) : Promise<ISeriesData> => {
        const x = 'y';
        return {
          ...series,
          apr: '3.23%',
        };
      }),
    );

    const newSeriesMap = seriesListMod.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.seriesData) as Map<string, ISeriesData>;

    updateState({ type: 'seriesData', payload: newSeriesMap });
    console.log('Series with user data: ', newSeriesMap);
  }, [userState.seriesData]);

  /* Updates the assets with relevant *user* data */
  const updateAssets = useCallback(async (assetList: IAsset[]) => {
    /* add in the dynamic asset data of the assets in the list */
    const assetListMod = await Promise.all(
      assetList.map(async (asset:IAsset) : Promise<IAssetData> => {
        const balance = asset.getBalance();
        return {
          ...asset,
          balance: balance || ethers.constants.Zero,
          balance_: cleanValue(ethers.utils.formatEther(ethers.constants.Zero), 2), // for display purposes only
        };
      }),
    );
    /* get the previous version (Map) of the vaultData and update it */
    const newAssetMap = assetListMod.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.assetData) as Map<string, IAssetData>;

    updateState({ type: 'assetData', payload: newAssetMap });
    console.log('Assets with user data: ', newAssetMap);
  }, [userState.assetData]);

  /* Updates the vaults with *user* data */
  const updateVaults = useCallback(async (vaultList: IVault[]) => {
    const Cauldron = contractMap.get('Cauldron');
    /* add in the dynamic vault data by mapping the vaults list */
    const vaultListMod = await Promise.all(
      vaultList.map(async (vault:IVault) : Promise<IVaultData> => {
        const { ink, art } = await Cauldron.balances(vault.id);
        return {
          ...vault,
          ink,
          art,
          ink_: cleanValue(ethers.utils.formatEther(ink), 2), // for display purposes only
          art_: cleanValue(ethers.utils.formatEther(art), 2), // for display purposes only
        };
      }),
    );
    /* get the previous version (Map) of the vaultData and update it */
    const newVaultMap = vaultListMod.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.vaultData) as Map<string, IVaultData>;

    updateState({ type: 'vaultData', payload: newVaultMap });
    console.log('VAULTS with user data: ', newVaultMap);
  }, [userState.vaultData, contractMap]);

  useEffect(() => {
    /* when there is an account and the chainContext is finsihed loading get the vaults */
    account &&
    !chainLoading &&
    getVaults().then((_vaults:any) => updateVaults(Array.from(_vaults.values())));
    Array.from(seriesMap.values()).length && updateSeries(Array.from(seriesMap.values()));
    Array.from(assetMap.values()).length && updateAssets(Array.from(assetMap.values()));
  }, [
    account,
    chainLoading,
    assetMap,
    seriesMap,
    getVaults,
    updateVaults,
    updateSeries,
    updateAssets,
  ]);

  /* Subscribe to vault event listeners */
  useEffect(() => {
    updateState({ type: 'activeAccount', payload: account });
  }, [account]);

  /* set initial state */
  useEffect(() => {
    !chainLoading && updateState({ type: 'selectedBase', payload: assetMap.get('0x444149000000') });
    !chainLoading && updateState({ type: 'selectedIlk', payload: assetMap.get('0x455448000000') });
  }, [chainLoading, assetMap]);

  /* Exposed userActions */
  const userActions = {
    updateSeries,
    updateAssets,
    updateVaults,
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
