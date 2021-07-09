import React, { useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { format } from 'date-fns';

import {
  IAssetRoot,
  ISeriesRoot,
  IVaultRoot,
  ISeries,
  IAsset,
  IVault,
  IUserContextState,
  IUserContext,
  ApprovalType,
  IHistoryContextState,
} from '../types';

import { ChainContext } from './ChainContext';
import { bytesToBytes32, cleanValue, genVaultImage } from '../utils/appUtils';
import { calculateAPR, divDecimal, floorDecimal, mulDecimal, secondsToFrom, sellFYToken } from '../utils/yieldMath';
import { UserContext } from './UserContext';

const dateFormat = (dateInSecs: number) => format(new Date(dateInSecs * 1000), 'dd MMM yyyy');

const HistoryContext = React.createContext<any>({});

const initState: IHistoryContextState = {
  historyLoading: true,
  tradeHistory: {
    lastBlock: 11066942,
    items: [],
  },
  liquidityHistory: {
    lastBlock: 11066942,
    items: [],
  },
  vaultHistory: {
    lastBlock: 11066942,
    items: [],
  },
};

function historyReducer(state: any, action: any) {
  /* Helper: only change the state if different from existing */ // TODO if even reqd.?
  const onlyIfChanged = (_action: any) =>
    state[action.type] === _action.payload ? state[action.type] : _action.payload;

  /* Reducer switch */
  switch (action.type) {
    case 'historyLoading':
      return { ...state, historyLoading: onlyIfChanged(action) };
    case 'tradeHistory':
      return {
        ...state,
        tradeHistory: action.payload,
      };
    case 'liquidityHistory':
      return {
        ...state,
        poolHistory: action.payload,
      };
    case 'vaultHistory':
      return {
        ...state,
        vaultHistory: action.payload,
      };
    default:
      return state;
  }
}

// POOL :
// event Liquidity(uint32 maturity, address indexed from, address indexed to, int256 bases, int256 fyTokens, int256 poolTokens);
// event Trade(uint32 maturity, address indexed from, address indexed to, int256 bases, int256 fyTokens);

// FYTOKEN:
// event Redeemed(address indexed from, address indexed to, uint256 amount, uint256 redeemed);

// CAULDRON:
// event VaultBuilt(bytes12 indexed vaultId, address indexed owner, bytes6 indexed seriesId, bytes6 ilkId);
// event VaultTweaked(bytes12 indexed vaultId, bytes6 indexed seriesId, bytes6 indexed ilkId);
// event VaultDestroyed(bytes12 indexed vaultId);
// event VaultGiven(bytes12 indexed vaultId, address indexed receiver);
// event VaultLocked(bytes12 indexed vaultId, uint256 indexed timestamp);
// event VaultPoured(bytes12 indexed vaultId, bytes6 indexed seriesId, bytes6 indexed ilkId, int128 ink, int128 art);
// event VaultStirred(bytes12 indexed from, bytes12 indexed to, uint128 ink, uint128 art);
// event VaultRolled(bytes12 indexed vaultId, bytes6 indexed seriesId, uint128 art);

const HistoryProvider = ({ children }: any) => {
  /* STATE FROM CONTEXT */
  // TODO const [cachedVaults, setCachedVaults] = useCachedState('vaults', { data: [], lastBlock: Number(process.env.REACT_APP_DEPLOY_BLOCK) });
  const { chainState } = useContext(ChainContext);
  const { fallbackProvider, contractMap, account, seriesRootMap } = chainState;
  const { userState } = useContext(UserContext);
  const { userLoading, vaultMap } = userState;

  const [historyState, updateState] = useReducer(historyReducer, initState);

  /* update Pool Historical data */
  const updateLiquidityHistory = useCallback(
    async (seriesList: ISeries[]) => {
      // event Liquidity(uint32 maturity, address indexed from, address indexed to, int256 bases, int256 fyTokens, int256 poolTokens);
      const liqHistMap = new Map([]);
      /* Get all the Liquidity history transactions */
      await Promise.all(
        seriesList.map(async (series: ISeries) => {
          const { poolContract, id: seriesId } = series;
          const _liqFilter = poolContract.filters.Liquidity(null, null, account, null, null, null);
          const eventList = await poolContract.queryFilter(_liqFilter, 0);

          const liqLogs = await Promise.all(
            eventList.map(async (log: any) => {
              const { blockNumber, transactionHash } = log;
              const { maturity, bases, fyTokens, poolTokens } = poolContract.interface.parseLog(log).args;
              const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;

              return {
                blockNumber,
                date,
                transactionHash,
                maturity,
                bases,
                fyTokens,
                seriesId,
                poolTokens,

                /* Formatted values:  */
                poolTokens_: ethers.utils.formatEther(poolTokens),
                fyTokens_: ethers.utils.formatEther(fyTokens),
                bases_: ethers.utils.formatEther(bases),
                date_: dateFormat(date),
              };
            })
          );

          liqHistMap.set(seriesId, liqLogs);
        })
      );
      updateState({ type: 'liquidityHistory', payload: liqHistMap });
      console.log('Liquidity History updated: ', liqHistMap);
    },
    [account, fallbackProvider]
  );

  /* update Trading Historical data  */
  const updateTradeHistory = useCallback(
    async (seriesList: ISeries[]) => {
      // event Trade(uint32 maturity, address indexed from, address indexed to, int256 bases, int256 fyTokens);
      const tradeHistMap = new Map([]);
      /* get all the trade historical transactions */
      await Promise.all(
        seriesList.map(async (series: ISeries) => {
          const { poolContract, id: seriesId } = series;
          const _filter = poolContract.filters.Trade(null, null, account, null, null);
          const eventList = await poolContract.queryFilter(_filter, 0);

          const tradeLogs = await Promise.all(
            eventList.map(async (log: any) => {
              const { blockNumber, transactionHash } = log;
              const { maturity, bases, fyTokens } = poolContract.interface.parseLog(log).args;
              const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;

              return {
                blockNumber,
                date,
                transactionHash,
                maturity,
                bases,
                fyTokens,
                seriesId,
                /* Formatted values:  */
                date_: dateFormat(date),
                bases_: ethers.utils.formatEther(bases),
                fyTokens_: ethers.utils.formatEther(fyTokens),
              };
            })
          );

          tradeHistMap.set(seriesId, tradeLogs);
        })
      );
      updateState({ type: 'tradeHistory', payload: tradeHistMap });
      console.log('Trade history updated: ', tradeHistMap);
    },
    [account, fallbackProvider]
  );

  /* Updates the assets with relevant *user* data */
  const updateVaultHistory = useCallback(
    async (vaultList: IVault[]) => {
      // event VaultPoured(bytes12 indexed vaultId, bytes6 indexed seriesId, bytes6 indexed ilkId, int128 ink, int128 art);
      const vaultHistMap = new Map([]);
      const Cauldron = contractMap.get('Cauldron');
      /* Get all the Vault historical Pour transactions */
      await Promise.all(
        vaultList.map(async (vault: IVault) => {
          const { id: vaultId } = vault;
          const filter = Cauldron.filters.VaultPoured(bytesToBytes32(vaultId, 12));
          const eventList = await Cauldron.queryFilter(filter, 0);
          const vaultLogs = await Promise.all(
            eventList.map(async (log: any) => {
              const { blockNumber, transactionHash } = log;
              const { seriesId, ilkId, ink, art } = Cauldron.interface.parseLog(log).args;
              const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;
              return {
                blockNumber,
                date,
                transactionHash,
                vaultId,
                seriesId,
                ilkId,
                ink,
                art,
                /* Formatted values:  */
                date_: dateFormat(date),
                ink_: ethers.utils.formatEther(ink),
                art_: ethers.utils.formatEther(art),
              };
            })
          );
          vaultHistMap.set(vaultId, vaultLogs);
        })
      );
      updateState({ type: 'vaultHistory', payload: vaultHistMap });
      console.log('Vault history updated: ', vaultHistMap);
    },
    [contractMap, fallbackProvider]
  );

  useEffect(() => {
    /* When the chainContext is finished loading get the historical data */
    if (account && !userLoading) {
      seriesRootMap.size && updateLiquidityHistory(Array.from(seriesRootMap.values()) as ISeries[]);
      seriesRootMap.size && updateTradeHistory(Array.from(seriesRootMap.values()) as ISeries[]);
      vaultMap.size && updateVaultHistory(Array.from(vaultMap.values()) as IVault[]);
    }
  }, [account, seriesRootMap, updateLiquidityHistory, updateTradeHistory, updateVaultHistory, userLoading, vaultMap]);

  /* Exposed userActions */
  const historyActions = {
    updateLiquidityHistory,
    updateVaultHistory,
    updateTradeHistory,
  };

  return <HistoryContext.Provider value={{ historyState, historyActions }}>{children}</HistoryContext.Provider>;
};

export { HistoryContext, HistoryProvider };
