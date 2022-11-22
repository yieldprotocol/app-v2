import React, { createContext, Dispatch, ReactNode, useCallback, useEffect, useReducer, useContext } from 'react';
import { BigNumber, Contract } from 'ethers';

import { useCachedState } from '../hooks/generalHooks';

import * as contractTypes from '../contracts';
import { IAssetRoot, IStrategyRoot, TokenType } from '../types';
import { ASSETS_1, ASSETS_42161 } from '../config/assets';

import markMap from '../config/marks';

import { toast } from 'react-toastify';
import useChainId from '../hooks/useChainId';
import useContracts from '../hooks/useContracts';
import { ChainContextActions, ChainState, IChainContextActions, IChainContextState } from './types/chain';
import useDefaultProvider from '../hooks/useDefaultProvider';
import { MulticallService } from '@yield-protocol/ui-multicall';
import { JsonRpcProvider } from '@ethersproject/providers';

const initState: IChainContextState = {
  /* flags */
  chainLoaded: 0,
  assetRootMap: new Map<string, IAssetRoot>(),
  multicall: null,
};

const initActions: IChainContextActions = {
  exportContractAddresses: () => null,
};

/* Build the context */
const ChainContext = createContext<{
  chainState: IChainContextState;
  updateState: Dispatch<ChainContextActions>;
  chainActions: IChainContextActions;
}>({
  chainState: initState,
  chainActions: initActions,
  updateState: () => undefined,
});

function chainReducer(state: IChainContextState, action: ChainContextActions): IChainContextState {
  /* Reducer switch */
  switch (action.type) {
    case ChainState.CHAIN_LOADED:
      return { ...state, chainLoaded: action.payload };

    case ChainState.MULTICALL:
      return { ...state, multicall: action.payload };

    case ChainState.ASSETS:
      return {
        ...state,
        assetRootMap: action.payload,
      };

    case ChainState.CLEAR_MAPS:
      return initState;

    default: {
      return state;
    }
  }
}

const ChainProvider = ({ children }: { children: ReactNode }) => {
  const [chainState, updateState] = useReducer(chainReducer, initState);

  /* HOOKS */
  const provider = useDefaultProvider();
  const chainId = useChainId();
  const contracts = useContracts();

  const multicallService = new MulticallService(provider as JsonRpcProvider);
  const multicall = multicallService.getMulticall(chainId);

  /* SIMPLE CACHED VARIABLES */
  const [lastAppVersion, setLastAppVersion] = useCachedState('lastAppVersion', '');

  const _getProtocolData = useCallback(async () => {
    /* Clear maps in local app memory  ( note: this is not the cache ) and set chainLoaded false */
    updateState({ type: ChainState.CLEAR_MAPS });

    console.log(
      'Fetching Protocol contract addresses and checking for new Assets and Series, and Strategies : ',
      chainId
    );
  }, [chainId]);

  /**
   * Handle version updates on first load -> complete refresh if app is different to published version
   */
  useEffect(() => {
    console.log('APP VERSION: ', process.env.REACT_APP_VERSION);
    if (lastAppVersion && process.env.REACT_APP_VERSION !== lastAppVersion) {
      window.localStorage.clear();
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    }
    setLastAppVersion(process.env.REACT_APP_VERSION);
  }, [lastAppVersion, setLastAppVersion]);

  /* Hande getting protocol data on first load */
  useEffect(() => {
    _getProtocolData();
  }, [_getProtocolData]);

  /**
   * functionality to export protocol addresses
   */
  const exportContractAddresses = () => {
    const contractList = [...contracts].map(([v, k]) => [v, k.address]);
    // const seriesList = [...chainState.seriesRootMap].map(([v, k]) => [v, k.address]);
    const assetList = [...chainState.assetRootMap].map(([v, k]) => [v, k.address]);
    // const strategyList = [...chainState.strategyRootMap].map(([v, k]) => [k.symbol, v]);
    const joinList = [...chainState.assetRootMap].map(([v, k]) => [v, k.joinAddress]);

    const res = JSON.stringify({
      contracts: contractList,
      // series: seriesList,
      assets: assetList,
      // strategies: strategyList,
      joins: joinList,
    });

    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(res)}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'contracts' + '.json');
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const chainActions = { exportContractAddresses };

  return (
    <ChainContext.Provider value={{ chainState: { ...chainState, multicall }, chainActions, updateState }}>
      {children}
    </ChainContext.Provider>
  );
};

export { ChainContext };

export default ChainProvider;
