import React, { useState, useContext, useEffect, useReducer, useCallback } from 'react';
import { BigNumber, ethers } from 'ethers';

import { IAsset, ISeries, IVault, ISeriesData, IAssetData, IVaultData } from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, genVaultImage } from '../utils/displayUtils';
import { calculateAPR, floorDecimal, secondsToFrom, sellFYToken } from '../utils/yieldMath';

const UserContext = React.createContext<any>({});

const initState = {

  activeAccount: null as string|null,

  assetData: new Map<string, IAssetData>(),
  seriesData: new Map<string, ISeriesData>(),
  vaultData: new Map<string, IVaultData>(),

  vaultMap: new Map<string, IVault>(),
  // activeVault: null as IVaultData|null,

  /* Current User selections */
  // selectedSeries: null as ISeriesData|null,
  // selectedIlk: null as IAssetData|null,
  // selectedBase: null as IAssetData|null,

  selectedSeriesId: null as string|null,
  selectedIlkId: null as string|null,
  selectedBaseId: null as string|null,
  selectedVaultId: null as string|null,

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
    case 'activeAccount': return { ...state, activeAccount: onlyIfChanged(action) };

      // case 'activeVault': return { ...state, activeVault: onlyIfChanged(action) };
      // case 'selectedSeries': return { ...state, selectedSeries: onlyIfChanged(action) };
      // case 'selectedIlk': return { ...state, selectedIlk: onlyIfChanged(action) };
      // case 'selectedBase': return { ...state, selectedBase: onlyIfChanged(action) };

    case 'selectedVault': return { ...state, selectedVaultId: onlyIfChanged(action) };
    case 'selectedSeries': return { ...state, selectedSeriesId: onlyIfChanged(action) };
    case 'selectedIlk': return { ...state, selectedIlkId: onlyIfChanged(action) };
    case 'selectedBase': return { ...state, selectedBaseId: onlyIfChanged(action) };

    case 'assetData': return { ...state, assetData: action.payload };
    case 'seriesData': return { ...state, seriesData: action.payload };
    case 'vaultData': return { ...state, vaultData: action.payload };

    case 'vaultMap': return { ...state, vaultMap: onlyIfChanged(action) };

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

  /* internal function for getting the users vaults */
  const _getVaults = useCallback(async () => {
    const Cauldron = contractMap.get('Cauldron');
    const filter = Cauldron.filters.VaultBuilt(null, account, null);
    const eventList = await Cauldron.queryFilter(filter, 1);
    // const eventList = await Cauldron.queryFilter(filter, cachedVaults.lastBlock);
    const vaultList : IVault[] = await Promise.all(eventList.map(async (x:any) : Promise<IVault> => {
      const { vaultId: id, ilkId, seriesId } = Cauldron.interface.parseLog(x).args;
      const series = seriesMap.get(seriesId);
      // const baseId = assetMap.get(series.baseId);
      return {
        id,
        seriesId,
        baseId: series.baseId,
        ilkId,
        image: genVaultImage(id),
        // getBase: () => userState.seriesMap.get(seriesId),
        // getSeries: () => userState.assetMap.get(baseId),
        // getIlk: () => userState.assetMap.get(ilkId),
      };
    }));

    // TODO const _combined: IVault[] = [...vaultList, ...cachedVaults];
    const newVaultMap = vaultList.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.vaultMap) as Map<string, IVault>;

    updateState({ type: 'vaultMap', payload: newVaultMap });
    return newVaultMap;
    /* Update the local cache storage */
    // TODO setCachedVaults({ data: Array.from(newVaultMap.values()), lastBlock: await fallbackProvider.getBlockNumber() });
  }, [account, contractMap, userState.vaultMap, seriesMap]);

  /* Updates the series with relevant *user* data */
  const updateSeries = useCallback(async (seriesList: ISeries[]) => {
    let _publicData : ISeries[] = [];
    let _accountData : ISeries[] = [];

    /* Add in the dynamic series data of the series in the list */
    _publicData = await Promise.all(
      seriesList.map(async (series:ISeries) : Promise<ISeriesData> => {
        /* Get all the data simultanenously in a promise.all */
        const [baseReserves, fyTokenReserves] = await Promise.all([
          series.poolContract.getBaseTokenReserves(),
          series.poolContract.getFYTokenReserves(),
        ]);

        const _rate = sellFYToken(
          baseReserves,
          fyTokenReserves,
          ethers.utils.parseEther('1'),
          secondsToFrom(series.maturity.toString()),
        );
        const APR = calculateAPR(floorDecimal(_rate), ethers.utils.parseEther('1'), series.maturity) || '0';

        return {
          ...series,
          baseReserves,
          fyTokenReserves,
          APR: `${Number(APR).toFixed(2)}`,
        };
      }),
    );

    if (account) {
      _accountData = await Promise.all(
        _publicData.map(async (series:ISeries) : Promise<any> => {
          /* Get all the data simultanenously in a promise.all */
          const [poolTokens, fyTokenBalance] = await Promise.all([
            series.poolContract.balanceOf(account),
            series.fyTokenContract.balanceOf(account),
          ]);
          return {
            ...series,
            poolTokens,
            fyTokenBalance,
            poolTokens_: ethers.utils.formatEther(poolTokens),
            fyTokenBalance_: ethers.utils.formatEther(fyTokenBalance),
          };
        }),
      );
    }

    const _data = _accountData.length ? _accountData : _publicData;

    /* combined account and public series data */
    const newSeriesMap = new Map(_data.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.seriesData));

    updateState({ type: 'seriesData', payload: newSeriesMap });
    console.log('Series with user data: ', newSeriesMap);
    return newSeriesMap;
  }, [account]);

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
    const newAssetMap = new Map(assetListMod.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.assetData));

    updateState({ type: 'assetData', payload: newAssetMap });
    console.log('Assets with user data: ', newAssetMap);
  }, []);

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
    const newVaultMap = new Map(vaultListMod.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.vaultData));

    updateState({ type: 'vaultData', payload: newVaultMap });
    console.log('VAULTS: ', newVaultMap);
  }, [contractMap]);

  useEffect(() => {
    /* When the chainContext is finished loading get the dynamic series data */
    !chainLoading &&
    Array.from(seriesMap.values()).length &&
    updateSeries(Array.from(seriesMap.values()));
  }, [
    account,
    chainLoading,
    seriesMap, updateSeries,
  ]);

  useEffect(() => {
    /* When the chainContext is finished loading get the dynamic asset data and vaults */
    if (account && !chainLoading) {
      Array.from(assetMap.values()).length && updateAssets(Array.from(assetMap.values()));
      _getVaults().then((_vaults:any) => updateVaults(Array.from(_vaults.values())));
    }
  }, [
    account, chainLoading,
    assetMap, updateAssets,
    _getVaults, updateVaults,
  ]);

  /* Subscribe to vault event listeners */
  useEffect(() => {
    updateState({ type: 'activeAccount', payload: account });
  }, [account]);

  /* Watch the vault selector and chnage selected series/assets accordingly */
  useEffect(() => {
    if (userState.activeVault) {
      updateState({ type: 'selectedSeries', payload: userState.activeVault.series.id });
      updateState({ type: 'selectedBase', payload: userState.activeVault.base.id });
    }
  }, [userState.activeVault]);

  /* set initial state */
  useEffect(() => {
    !chainLoading && updateState({ type: 'selectedBase', payload: assetMap.get('0x444149000000').id });
    !chainLoading && updateState({ type: 'selectedIlk', payload: assetMap.get('0x455448000000').id });
  }, [chainLoading, assetMap]);

  /* Exposed userActions */
  const userActions = {
    updateSeries,
    updateAssets,
    updateVaults,
    setActiveVault: (vault:IVault|null) => updateState({ type: 'activeVault', payload: vault }),
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
