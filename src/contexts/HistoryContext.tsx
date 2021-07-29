import React, { useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import { format } from 'date-fns';

import {
  ISeries,
  IVault,
  IHistoryContextState,
  IHistItemPosition,
  ActionCodes,
  IHistItemVault,
  IBaseHistItem,
  IAsset,
} from '../types';

import { ChainContext } from './ChainContext';
import { abbreviateHash, bytesToBytes32, cleanValue } from '../utils/appUtils';
import { UserContext } from './UserContext';
import { ZERO_BN } from '../utils/constants';
import { Cauldron } from '../contracts';

const dateFormat = (dateInSecs: number) => format(new Date(dateInSecs * 1000), 'dd MMM yyyy');

const _inferType = (art: BigNumber, ink: BigNumber) => {
  if (art.eq(ZERO_BN)) return ink.gt(ZERO_BN) ? ActionCodes.ADD_COLLATERAL : ActionCodes.REMOVE_COLLATERAL;
  if (art.lt(ZERO_BN)) return ActionCodes.REPAY;
  return ActionCodes.BORROW;
};

const HistoryContext = React.createContext<any>({});

const initState: IHistoryContextState = {
  historyLoading: true,
  tradeHistory: {
    lastBlock: 0,
    items: [] as IBaseHistItem[],
  },
  poolHistory: {
    lastBlock: 0,
    items: [] as IBaseHistItem[],
  },
  vaultHistory: {
    lastBlock: 0,
    items: [] as IBaseHistItem[],
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
    case 'poolHistory':
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
  const { fallbackProvider, contractMap, account, seriesRootMap, assetRootMap } = chainState;
  const { userState } = useContext(UserContext);
  const { userLoading, vaultMap } = userState;

  const [historyState, updateState] = useReducer(historyReducer, initState);

  /* update Pool Historical data */
  const updatePoolHistory = useCallback(
    async (seriesList: ISeries[]) => {
      const liqHistMap = new Map<string, IHistItemPosition[]>([]);
      /* Get all the Liquidity history transactions */
      await Promise.all(
        seriesList.map(async (series: ISeries) => {
          const { poolContract, id: seriesId } = series;
          // event Liquidity(uint32 maturity, address indexed from, address indexed to, int256 bases, int256 fyTokens, int256 poolTokens);
          const _liqFilter = poolContract.filters.Liquidity(null, null, account, null, null, null);
          const eventList = await poolContract.queryFilter(_liqFilter, 0);

          const liqLogs = await Promise.all(
            eventList.map(async (log: any) => {
              const { blockNumber, transactionHash } = log;
              const { maturity, bases, fyTokens, poolTokens } = poolContract.interface.parseLog(log).args;
              const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;
              const type_ = poolTokens.gt(ZERO_BN) ? ActionCodes.ADD_LIQUIDITY : ActionCodes.REMOVE_LIQUIDITY;

              return {
                blockNumber,
                date,
                transactionHash,
                maturity,
                bases,
                fyTokens,
                series,
                poolTokens,

                /* inferred trade type */
                histType: type_,
                primaryInfo: `${cleanValue(ethers.utils.formatEther(poolTokens), 2)} Pool tokens`,

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
      updateState({ type: 'poolHistory', payload: liqHistMap });
      console.log('Pool History updated: ', liqHistMap);
    },
    [account, fallbackProvider]
  );

  /* update Trading Historical data  */
  const updateTradeHistory = useCallback(
    async (seriesList: ISeries[]) => {
      const tradeHistMap = new Map<string, IHistItemPosition[]>([]);
      /* get all the trade historical transactions */
      await Promise.all(
        seriesList.map(async (series: ISeries) => {
          const { poolContract, id: seriesId, baseId } = series;
          const base: IAsset = assetRootMap.get(baseId);
          // event Trade(uint32 maturity, address indexed from, address indexed to, int256 bases, int256 fyTokens);
          const _filter = poolContract.filters.Trade(null, null, account, null, null);
          const eventList = await poolContract.queryFilter(_filter, 0);

          const tradeLogs = await Promise.all(
            eventList.map(async (log: any) => {
              const { blockNumber, transactionHash } = log;
              const { maturity, bases, fyTokens } = poolContract.interface.parseLog(log).args;
              const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;

              const type_ = fyTokens.gt(ZERO_BN) ? ActionCodes.LEND : ActionCodes.CLOSE_POSITION;

              return {
                blockNumber,
                date,
                transactionHash,
                maturity,
                bases,
                fyTokens,
                poolTokens: ZERO_BN,
                series,
                vaultId: null,

                /* inferred trade type */
                histType: type_,

                primaryInfo: `${cleanValue(ethers.utils.formatEther(bases), 2)} ${base.symbol}`,
                secondaryInfo: `x.x% APR`,

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
    [account, assetRootMap, fallbackProvider]
  );

  const _parsePourLogs = (eventList: ethers.Event[], contract: Cauldron, series: ISeries) => {
    const base_ = assetRootMap.get(series?.baseId!);

    return Promise.all(
      eventList.map(async (log: any) => {
        const { blockNumber, transactionHash } = log;

        console.log('sereis in question : ', series);
        // event VaultPoured(bytes12 indexed vaultId, bytes6 indexed seriesId, bytes6 indexed ilkId, int128 ink, int128 art)
        const { ilkId, ink, art } = contract.interface.parseLog(log).args;
        const tradeIface = new ethers.utils.Interface([
          'event Trade(uint32 maturity, address indexed from, address indexed to, int256 bases, int256 fyTokens)',
        ]);
        const topic = tradeIface.getEventTopic('Trade');
        const { logs: receiptLogs } = await fallbackProvider.getTransactionReceipt(transactionHash);
        const tradelog = receiptLogs.find((_log: any) => _log.topics.includes(topic));
        const { bases: baseTraded, fyTokens: fyTokenTraded } = tradelog
          ? tradeIface.parseLog(tradelog).args
          : { bases: ZERO_BN, fyTokens: ZERO_BN };

        const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;
        const ilk = assetRootMap.get(ilkId);

        const histType = _inferType(art, ink);
        return {
          /* histItem base */
          blockNumber,
          date,
          transactionHash,
          series,
          histType,

          primaryInfo:
            ( histType === ActionCodes.ADD_COLLATERAL || histType === ActionCodes.REMOVE_COLLATERAL )  // if only moving collateral
              ? `${cleanValue(ethers.utils.formatEther(ink), 2)} ${ilk.symbol}`
              : `${cleanValue(ethers.utils.formatEther(art), 2)} ${base_?.symbol!} `,

          /* args info */
          ilkId,
          ink,
          art,
          fyTokenTraded,
          baseTraded,

          /* Formatted values:  */
          date_: dateFormat(date),
          ink_: ethers.utils.formatEther(ink),
          art_: ethers.utils.formatEther(art),
          baseTraded_: ethers.utils.formatEther(baseTraded),
          fyTokenTraded_: ethers.utils.formatEther(fyTokenTraded),
        } as IBaseHistItem;
      })
    );
  };

  const _parseGivenLogs = (eventList: ethers.Event[], contract: Cauldron, series: ISeries) =>
    Promise.all(
      eventList.map(async (log: any) => {
        const { blockNumber, transactionHash } = log;
        // event VaultGiven(bytes12 indexed vaultId, address indexed receiver);
        const { receiver } = contract.interface.parseLog(log).args;
        const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;
        return {
          /* histItem base */
          series,
          blockNumber,
          date,
          transactionHash,
          histType: ActionCodes.TRANSFER_VAULT,
          primaryInfo: `Transferred to ${abbreviateHash(receiver)}`,

          /* arg info */
          receiver,
          date_: dateFormat(date),
        } as IBaseHistItem;
      })
    );

  const _parseRolledLogs = (eventList: ethers.Event[], contract: Cauldron, series: ISeries) =>
    Promise.all(
      eventList.map(async (log: any) => {
        const { blockNumber, transactionHash } = log;
        // event VaultRolled(bytes12 indexed vaultId, bytes6 indexed seriesId, uint128 art);
        const { seriesId: toSeries, art } = contract.interface.parseLog(log).args;
        const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;
        const toSeries_: ISeries = seriesRootMap.get(toSeries);
        return {
          /* histItem base */
          blockNumber,
          date,
          transactionHash,
          series,
          histType: ActionCodes.ROLL_DEBT,
          primaryInfo: `Rolled ${cleanValue(ethers.utils.formatEther(art), 2)} debt to ${toSeries_.displayNameMobile}`,
          /* args info */
          toSeries,
          art,

          /* Formatted values:  */
          date_: dateFormat(date),
          art_: ethers.utils.formatEther(art),
        } as IBaseHistItem;
      })
    );

  /*  Updates VAULT history */
  // event VaultBuilt(bytes12 indexed vaultId, address indexed owner, bytes6 indexed seriesId, bytes6 ilkId);
  // event VaultTweaked(bytes12 indexed vaultId, bytes6 indexed seriesId, bytes6 indexed ilkId);
  // event VaultDestroyed(bytes12 indexed vaultId);
  // event VaultGiven(bytes12 indexed vaultId, address indexed receiver);
  // event VaultLocked(bytes12 indexed vaultId, uint256 indexed timestamp);
  // event VaultStirred(bytes12 indexed from, bytes12 indexed to, uint128 ink, uint128 art);
  // event VaultRolled(bytes12 indexed vaultId, bytes6 indexed seriesId, uint128 art);

  const updateVaultHistory = useCallback(
    async (vaultList: IVault[]) => {
      const vaultHistMap = new Map<string, IBaseHistItem[]>([]);
      const cauldronContract = contractMap.get('Cauldron') as Cauldron;
      /* Get all the Vault historical Pour transactions */
      await Promise.all(
        vaultList.map(async (vault: IVault) => {
          const { id: vaultId, seriesId } = vault;
          const vaultId32 = bytesToBytes32(vaultId, 12);
          const series = seriesRootMap.get(seriesId);

          const givenFilter = cauldronContract.filters.VaultGiven(vaultId32, null);
          const pourFilter = cauldronContract.filters.VaultPoured(vaultId32);
          const rolledFilter = cauldronContract.filters.VaultRolled(vaultId32);
          // const destroyedFilter = cauldronContract.filters.VaultDestroyed(vaultId32);
          // const stirredFilter = cauldronContract.filters.VaultStirred(vaultId32);

          /* get all the logs available */
          const [pourEventList, givenEventList, rolledEventList]: // destroyedEventList,
          // stirredEventList,
          ethers.Event[][] = await Promise.all([
            cauldronContract.queryFilter(pourFilter, 0),
            cauldronContract.queryFilter(givenFilter, 0),
            cauldronContract.queryFilter(rolledFilter, 0),
            // cauldronContract.queryFilter(destroyedFilter, 0),
            // cauldronContract.queryFilter(stirredFilter, 0),
          ]);

          /* parse/process the log information  */
          const [pourLogs, givenLogs, rolledLogs]: // destroyedLogs,
          // strirredLogs,
          IBaseHistItem[][] = await Promise.all([
            _parsePourLogs(pourEventList, cauldronContract, series),
            _parseGivenLogs(givenEventList, cauldronContract, series),
            _parseRolledLogs(rolledEventList, cauldronContract, series),
            // _parseDestroyedLogs(destroyedEventList, cauldronContract),
            // _parseStirredLogs(stirredEventList, cauldronContract),
          ]);

          const combinedLogs: IBaseHistItem[] = [...pourLogs, ...givenLogs, ...rolledLogs].sort(
            (a: IBaseHistItem, b: IBaseHistItem) => a.blockNumber - b.blockNumber
          );
          vaultHistMap.set(vaultId, combinedLogs);
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
      seriesRootMap.size && updatePoolHistory(Array.from(seriesRootMap.values()) as ISeries[]);
      seriesRootMap.size && updateTradeHistory(Array.from(seriesRootMap.values()) as ISeries[]);
      vaultMap.size && updateVaultHistory(Array.from(vaultMap.values()) as IVault[]);
    }
  }, [account, seriesRootMap, updatePoolHistory, updateTradeHistory, updateVaultHistory, userLoading, vaultMap]);

  /* Exposed userActions */
  const historyActions = {
    updatePoolHistory,
    updateVaultHistory,
    updateTradeHistory,
  };

  return <HistoryContext.Provider value={{ historyState, historyActions }}>{children}</HistoryContext.Provider>;
};

export { HistoryContext, HistoryProvider };
