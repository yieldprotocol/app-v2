import React, { useState, useContext, useEffect, useReducer, useCallback } from 'react';
import { BigNumber, ethers } from 'ethers';

import { IAssetRoot, ISeriesRoot, IVaultRoot, ISeries, IAsset, IVault } from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, genVaultImage } from '../utils/displayUtils';
import { calculateAPR, floorDecimal, secondsToFrom, sellFYToken } from '../utils/yieldMath';

const UserContext = React.createContext<any>({});

const initState = {

  activeAccount: null as string|null,

  assetMap: new Map<string, IAsset>(),
  seriesMap: new Map<string, ISeries>(),
  vaultMap: new Map<string, IVault>(),

  /* Current User selections */
  selectedSeriesId: null as string|null,
  selectedIlkId: null as string|null,
  selectedBaseId: null as string|null,
  selectedVaultId: null as string|null,

};

function userReducer(state:any, action:any) {
  /* Helper: only change the state if different from existing */ // TODO if even reqd.?
  const onlyIfChanged = (_action: any) => (
    state[action.type] === _action.payload
      ? state[action.type]
      : _action.payload
  );

  /* Reducer switch */
  switch (action.type) {
    case 'userLoading': return { ...state, seriesLoading: onlyIfChanged(action) };
    case 'activeAccount': return { ...state, activeAccount: onlyIfChanged(action) };

    case 'selectedVaultId': return { ...state, selectedVaultId: onlyIfChanged(action) };
    case 'selectedSeriesId': return { ...state, selectedSeriesId: onlyIfChanged(action) };
    case 'selectedIlkId': return { ...state, selectedIlkId: onlyIfChanged(action) };
    case 'selectedBaseId': return { ...state, selectedBaseId: onlyIfChanged(action) };

    case 'assetMap': return { ...state, assetMap: onlyIfChanged(action) };
    case 'seriesMap': return { ...state, seriesMap: onlyIfChanged(action) };
    case 'vaultMap': return { ...state, vaultMap: onlyIfChanged(action) };

    default: return state;
  }
}

const UserProvider = ({ children }:any) => {
  // TODO const [cachedVaults, setCachedVaults] = useCachedState('vaults', { data: [], lastBlock: Number(process.env.REACT_APP_DEPLOY_BLOCK) });
  const { chainState } = useContext(ChainContext);
  const {
    contractMap,
    account,
    chainLoading,
    seriesRootMap,
    assetRootMap,
  } = chainState;

  const [userState, updateState] = useReducer(userReducer, initState);

  /* internal function for getting the users vaults */
  const _getVaults = useCallback(async (fromBlock:number = 1) => {
    const Cauldron = contractMap.get('Cauldron');
    const filter = Cauldron.filters.VaultBuilt(null, account, null);
    const eventList = await Cauldron.queryFilter(filter, fromBlock);
    // const eventList = await Cauldron.queryFilter(filter, cachedVaults.lastBlock);
    const vaultList : IVaultRoot[] = await Promise.all(eventList.map(async (x:any) : Promise<IVaultRoot> => {
      const { vaultId: id, ilkId, seriesId } = Cauldron.interface.parseLog(x).args;
      const series = seriesRootMap.get(seriesId);
      // const baseId = assetRootMap.get(series.baseId);
      return {
        id,
        seriesId,
        baseId: series.baseId,
        ilkId,
        image: genVaultImage(id),
      };
    }));

    // TODO const _combined: IVaultRoot[] = [...vaultList, ...cachedVaults];
    const newVaultMap = vaultList.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, new Map()) as Map<string, IVaultRoot>;

    return newVaultMap;
    /* Update the local cache storage */
    // TODO setCachedVaults({ data: Array.from(newVaultMap.values()), lastBlock: await fallbackProvider.getBlockNumber() });
  }, [account, contractMap, seriesRootMap]);

  /* Updates the series with relevant *user* data */
  const updateSeries = useCallback(async (seriesList: ISeriesRoot[]) => {
    let _publicData : ISeriesRoot[] = [];
    let _accountData : ISeriesRoot[] = [];

    /* Add in the dynamic series data of the series in the list */
    _publicData = await Promise.all(
      seriesList.map(async (series:ISeriesRoot) : Promise<ISeries> => {
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
        _publicData.map(async (series:ISeriesRoot) : Promise<any> => {
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

    const _combinedData = _accountData.length ? _accountData : _publicData;

    /* combined account and public series data  reduced into a single Map */
    const newseriesRootMap = new Map(_combinedData.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.seriesMap));

    updateState({ type: 'seriesMap', payload: newseriesRootMap });
    console.log('Series with user data: ', newseriesRootMap);
    return newseriesRootMap;
  }, [account]);

  /* Updates the assets with relevant *user* data */
  const updateAssets = useCallback(async (assetList: IAssetRoot[]) => {
    /* add in the dynamic asset data of the assets in the list */
    const assetListMod = await Promise.all(
      assetList.map(async (asset:IAssetRoot) : Promise<IAsset> => {
        const balance = asset.getBalance();
        return {
          ...asset,
          balance: balance || ethers.constants.Zero,
          balance_: cleanValue(ethers.utils.formatEther(ethers.constants.Zero), 2), // for display purposes only
        };
      }),
    );
      /* get the previous version (Map) of the vaultMap and update it */
    const newassetRootMap = new Map(assetListMod.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.assetMap));

    updateState({ type: 'assetMap', payload: newassetRootMap });
    console.log('Assets with user data: ', newassetRootMap);
  }, []);

  /* Updates the vaults with *user* data */
  const updateVaults = useCallback(async (vaultList: IVaultRoot[]) => {
    const Cauldron = contractMap.get('Cauldron');
    /* add in the dynamic vault data by mapping the vaults list */
    const vaultListMod = await Promise.all(
      vaultList.map(async (vault:IVaultRoot) : Promise<IVault> => {
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
      /* get the previous version (Map) of the vaultMap and update it */
    const newVaultMap = new Map(vaultListMod.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.vaultMap));

    updateState({ type: 'vaultMap', payload: newVaultMap });
    console.log('VAULTS: ', newVaultMap);
  }, [contractMap]);

  useEffect(() => {
    /* When the chainContext is finished loading get the dynamic series data */
    !chainLoading &&
    Array.from(seriesRootMap.values()).length &&
    updateSeries(Array.from(seriesRootMap.values()));
  }, [
    account,
    chainLoading,
    seriesRootMap, updateSeries,
  ]);

  useEffect(() => {
    /* When the chainContext is finished loading get the dynamic asset data and vaults */
    if (account && !chainLoading) {
      Array.from(assetRootMap.values()).length && updateAssets(Array.from(assetRootMap.values()));
      _getVaults().then((_vaults:any) => updateVaults(Array.from(_vaults.values())));
    }
  }, [
    account, chainLoading,
    assetRootMap, updateAssets,
    _getVaults, updateVaults,
  ]);

  /* Subscribe to vault event listeners */
  useEffect(() => {
    updateState({ type: 'activeAccount', payload: account });
  }, [account]);

  /* Watch the vault selector and chnage selected series/assets accordingly */
  useEffect(() => {
    if (userState.activeVault) {
      updateState({ type: 'selectedSeriesId', payload: userState.activeVault.series.id });
      updateState({ type: 'selectedBaseId', payload: userState.activeVault.base.id });
    }
  }, [userState.activeVault]);

  /* set initial state */
  useEffect(() => {
    !chainLoading && updateState({ type: 'selectedBaseId', payload: assetRootMap.get('0x444149000000').id });
    !chainLoading && updateState({ type: 'selectedIlkId', payload: assetRootMap.get('0x455448000000').id });
  }, [chainLoading, assetRootMap]);

  /* Exposed userActions */
  const userActions = {
    updateSeries,
    updateAssets,
    updateVaults,
    setActiveVault: (vaultId:string|null) => updateState({ type: 'selectedVaultId', payload: vaultId }),
    setSelectedIlk: (assetId:string) => updateState({ type: 'selectedIlkId', payload: assetId }),
    setSelectedSeries: (seriesId:string) => updateState({ type: 'selectedSeriesId', payload: seriesId }),
    setSelectedBase: (assetId:string) => updateState({ type: 'selectedBaseId', payload: assetId }),
  };

  return (
    <UserContext.Provider value={{ userState, userActions }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
