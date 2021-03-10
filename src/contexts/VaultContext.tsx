import React, { useState, useContext, useEffect, useReducer, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

import { IYieldAsset, IYieldSeries, IYieldVault } from '../types';

import { staticSeriesData } from './yieldEnv.json';

const testAssetMap = new Map([
  [1, { id: 1, displayName: 'Eth', symbol: 'ETH', address: null }],
  [2, { id: 2, displayName: 'Dai', symbol: 'DAI', address: null }],
  [3, { id: 3, displayName: 'USD Coin', symbol: 'USDC', address: null }],
  [4, { id: 4, displayName: 'Doge Coin', symbol: 'DOGE', address: null }],
]);

const testVaultMap = new Map([
  ['0x143a165a53968125b0e179b7', { id: '0x143a165a53968125b0e179b7', assetId: 2, collateralId: 1, collateralBalance: 234.12312, assetValue: 23.344 }],
  ['0x89480c92dfae8210f7616d2c', { id: '0x89480c92dfae8210f7616d2c', assetId: 3, collateralId: 1, collateralBalance: 1211.12312, assetValue: 6786.344 }],
  ['0x7b4c24b05f868ef47e3d8a49', { id: '0x7b4c24b05f868ef47e3d8a49', assetId: 4, collateralId: 1, collateralBalance: 34.12312, assetValue: 678.344 }],
]);

const VaultContext = React.createContext<any>({});

const initState = {
  seriesMap: new Map() as Map< string, IYieldSeries>,

  // assetMap: new Map() as Map<string, IYieldAsset>,
  assetMap: testAssetMap,

  // vaultMap: new Map() as Map<string, IYieldVault>,
  vaultMap: testVaultMap, // for testing only

  activeSeries: null as IYieldSeries | null,
  activeAsset: null as IYieldAsset | null,
  activeVault: null as IYieldVault | null,

  seriesLoading: false as boolean,
};

function seriesReducer(state:any, action:any) {
  switch (action.type) {
    case 'seriesLoading':
      return {
        ...state,
        seriesLoading: action.payload,
      };
    case 'activeSeries':
      return {
        ...state,
        activeSeries: action.payload,
      };
    case 'seriesMap':
      return {
        ...state,
        seriesMap: action.payload,
      };
    case 'assetMap':
      return {
        ...state,
        assetMap: action.payload,
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

const VaultProvider = ({ children }:any) => {
  const [vaultState, updateState] = useReducer(seriesReducer, initState);

  /* Populate the series data with any available the cached/static info */
  const _loadStaticSeriesData = useCallback((seriesArr:IYieldSeries[]) => {
    /* preMap is for faster loading - creates an initial map from the cached data */
    const staticDataMap = seriesArr.reduce((acc: Map<string, any>, x:any) => {
      const _x = { ...x, isMature: () => (x.maturity < Math.round(new Date().getTime() / 1000)) };
      return acc.set(x.maturity, { ..._x });
    }, new Map());
    updateState({ type: 'seriesMap', payload: staticDataMap });

    /* update first active series logic */
    updateState({ type: 'activeSeries', payload: staticDataMap.values().next().value });

    return staticDataMap;
  }, []);

  const updateSeries = (seriesList: IYieldSeries[]) => {
    /* Update all series if list.length === 0 */
    if (seriesList.length === 0) {
      // update all series
    } else {
      // update only the list provided
    }
  };

  /* firstLoad */
  useEffect(() => {
    _loadStaticSeriesData(staticSeriesData);
  }, [_loadStaticSeriesData]);

  const vaultActions = {
    setActiveSeries: (series:IYieldSeries) => updateState({ type: 'activeSeries', payload: series }),
    updateSeries: (seriesList: IYieldSeries[]) => updateSeries(seriesList),
  };

  return (
    <VaultContext.Provider value={{ vaultState, vaultActions }}>
      {children}
    </VaultContext.Provider>
  );
};

export { VaultContext, VaultProvider };
