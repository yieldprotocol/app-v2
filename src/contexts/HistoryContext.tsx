import React, { useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ethers } from 'ethers';

import { IAssetRoot, ISeriesRoot, IVaultRoot, ISeries, IAsset, IVault, IUserContextState, IUserContext, ApprovalType, IHistoryContextState } from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, genVaultImage } from '../utils/displayUtils';
import { calculateAPR, divDecimal, floorDecimal, mulDecimal, secondsToFrom, sellFYToken } from '../utils/yieldMath';
import { UserContext } from './UserContext';

const HistoryContext = React.createContext<any>({});

const initState : IHistoryContextState = {
  historyLoading: true,
  txHistory: {
    lastBlock: 11066942,
    items: [],
  },
};

function historyReducer(state:any, action:any) {
  /* Helper: only change the state if different from existing */ // TODO if even reqd.?
  const onlyIfChanged = (_action: any) => (
    state[action.type] === _action.payload
      ? state[action.type]
      : _action.payload
  );

  /* Reducer switch */
  switch (action.type) {
    case 'historyLoading': return { ...state, historyLoading: onlyIfChanged(action) };
    case 'updateHistory':
      return {
        ...state,
        txHistory: action.payload,
      };
    default: return state;
  }
}

// POOL :
// event Trade(uint32 maturity, address indexed from, address indexed to, int256 bases, int256 fyTokens);
// event Liquidity(uint32 maturity, address indexed from, address indexed to, int256 bases, int256 fyTokens, int256 poolTokens);

// FYTOKEN:
// event Redeemed(address indexed from, address indexed to, uint256 amount, uint256 redeemed);

// CAULDRON:
// event VaultBuilt(bytes12 indexed vaultId, address indexed owner, bytes6 indexed seriesId, bytes6 ilkId);
// event VaultTweaked(bytes12 indexed vaultId, bytes6 indexed seriesId, bytes6 indexed ilkId);
// event VaultDestroyed(bytes12 indexed vaultId);
// event VaultGiven(bytes12 indexed vaultId, address indexed receiver);

// event VaultPoured(bytes12 indexed vaultId, bytes6 indexed seriesId, bytes6 indexed ilkId, int128 ink, int128 art);
// event VaultStirred(bytes12 indexed from, bytes12 indexed to, uint128 ink, uint128 art);
// event VaultRolled(bytes12 indexed vaultId, bytes6 indexed seriesId, uint128 art);
// event VaultLocked(bytes12 indexed vaultId, uint256 indexed timestamp);

const HistoryProvider = ({ children }:any) => {
  /* STATE FROM CONTEXT */
  // TODO const [cachedVaults, setCachedVaults] = useCachedState('vaults', { data: [], lastBlock: Number(process.env.REACT_APP_DEPLOY_BLOCK) });
  const { chainState } = useContext(ChainContext);
  const {
    contractMap,
    account,
    chainLoading,
    seriesRootMap,
    assetRootMap,
  } = chainState;
  const { userState } = useContext(UserContext);
  const { userLoading, vaultMap } = userState;

  const [historyState, updateState] = useReducer(historyReducer, initState);

  /* Updates the assets with relevant *user* data */
  const updateHistory = useCallback(async (vaultList: IVault) => {
    /* get both poolAdded events and series events at the same time */
    const [vaultCreatedEvents, vaultPouredEvents] = await Promise.all([
      // Cauldron.queryFilter('SeriesAdded' as any),
      // Ladle.queryFilter('PoolAdded' as any),
    ]);

    /* build a map from the poolAdded event data */
    const historyMap: Map<string, string> = new Map(
    );
  }, []);

  useEffect(() => {
    /* When the chainContext is finished loading get the dynamic series and asset data */
    // if (!userLoading) {
    //   Array.from(seriesRootMap.values()).length && updateSeries(Array.from(seriesRootMap.values()));
    //   Array.from(assetRootMap.values()).length && updateAssets(Array.from(assetRootMap.values()));
    // }
    vaultMap.size && console.log(Array.from(vaultMap.values()));
  }, [vaultMap]);

  /* Exposed userActions */
  const historyActions = {
    updateHistory,
  };

  return (
    <HistoryContext.Provider value={{ historyState, historyActions }}>
      {children}
    </HistoryContext.Provider>
  );
};

export { HistoryContext, HistoryProvider };
