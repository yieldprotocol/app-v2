import React, { useState, useContext, useEffect, useReducer, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

import { IYieldSeries } from '../types';

import { staticSeriesData } from './yieldEnv.json';

const SeriesContext = React.createContext<any>({});

const initState = {
  seriesMap: new Map() as Map< string, IYieldSeries>,
  activeSeries: null as IYieldSeries | null,
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
    case 'updateSeries':
      return {
        ...state,
        seriesMap: action.payload,
      };

    default:
      return state;
  }
}

const SeriesProvider = ({ children }:any) => {
  const [seriesState, updateState] = useReducer(seriesReducer, initState);

  /* Populate the series data with any available the cached/static info */
  const _loadStaticSeriesData = useCallback((seriesArr:IYieldSeries[]) => {
    /* preMap is for faster loading - creates an initial map from the cached data */
    const staticDataMap = seriesArr.reduce((acc: Map<string, any>, x:any) => {
      const _x = { ...x, isMature: () => (x.maturity < Math.round(new Date().getTime() / 1000)) };
      return acc.set(x.maturity, { ..._x });
    }, new Map());
    updateState({ type: 'updateSeries', payload: staticDataMap });

    console.log(staticDataMap);
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

  const seriesActions = {
    setActiveSeries: (series:IYieldSeries) => updateState({ type: 'activeSeries', payload: series }),
    updateSeries: (seriesList: IYieldSeries[]) => updateSeries(seriesList),
  };

  return (
    <SeriesContext.Provider value={{ seriesState, seriesActions }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
