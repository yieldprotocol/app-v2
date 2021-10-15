import React, { useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import { format } from 'date-fns';

import { ISeries, IVault, IHistItemPosition, ActionCodes, IBaseHistItem, IAsset, IStrategy } from '../types';

import * as contracts from '../contracts';

import { ChainContext } from './ChainContext';
import { abbreviateHash, cleanValue } from '../utils/appUtils';
import { UserContext } from './UserContext';
import { ZERO_BN } from '../utils/constants';
import { Cauldron } from '../contracts';
import { calculateAPR, bytesToBytes32 } from '../utils/yieldMath';

const dateFormat = (dateInSecs: number) => format(new Date(dateInSecs * 1000), 'dd MMM yyyy');

const _inferType = (art: BigNumber, ink: BigNumber) => {
  if (art.eq(ZERO_BN)) return ink.gt(ZERO_BN) ? ActionCodes.ADD_COLLATERAL : ActionCodes.REMOVE_COLLATERAL;
  if (art.lt(ZERO_BN)) return ActionCodes.REPAY;
  return ActionCodes.BORROW;
};

const HistoryContext = React.createContext<any>({});

const initState = {
  historyLoading: true,
  vaultHistory: new Map([]),
  tradeHistory: new Map([]),
  strategyHistory: new Map([]),
  poolHistory: new Map([]),
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
    case 'strategyHistory':
      return {
        ...state,
        strategyHistory: action.payload,
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

const HistoryProvider = ({ children }: any) => {
  /* STATE FROM CONTEXT */
  // TODO const [cachedVaults, setCachedVaults] = useCachedState('vaults', { data: [], lastBlock: Number(process.env.REACT_APP_DEPLOY_BLOCK) });
  const { chainState } = useContext(ChainContext);

  const {
    chainLoading,
    contractMap,
    connection: { fallbackProvider },
    seriesRootMap,
    assetRootMap,
  } = chainState;

  const { userState } = useContext(UserContext);
  const { activeAccount: account, vaultMap, seriesMap, strategyMap } = userState;

  const [historyState, updateState] = useReducer(historyReducer, initState);

  /* parse individual pool log data: */
  const _parsePoolLogs = useCallback(
    async (strategyAddress: string, poolAddress: string, decimals: number) => {
      const poolContract = contracts.Pool__factory.connect(poolAddress, fallbackProvider);
      // event Liquidity(uint32 maturity, address indexed from, address indexed to, int256 bases, int256 fyTokens, int256 poolTokens);
      const _liqFilter = poolContract.filters.Liquidity(null, null, account, null, null, null);
      const eventList = await poolContract.queryFilter(_liqFilter, 0);
      const poolLogs = await Promise.all(
        eventList.map(async (log: any) => {
          const { blockNumber, transactionHash } = log;
          const { maturity, bases, fyTokens, poolTokens } = poolContract.interface.parseLog(log).args;
          const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;
          const type_ = poolTokens.gt(ZERO_BN) ? ActionCodes.ADD_LIQUIDITY : ActionCodes.REMOVE_LIQUIDITY;

          return {
            initiator: account,
            blockNumber,
            date,
            transactionHash,
            maturity,
            bases,
            fyTokens,
            poolTokens,
            poolAddress,

            /* inferred trade type */
            actionCode: type_,
            primaryInfo: `${cleanValue(ethers.utils.formatUnits(poolTokens, decimals), 2)} Pool tokens`,

            /* Formatted values:  */
            poolTokens_: ethers.utils.formatUnits(poolTokens, decimals),
            fyTokens_: ethers.utils.formatUnits(fyTokens, decimals),
            bases_: ethers.utils.formatUnits(bases, decimals),
            date_: dateFormat(date),
          };
        })
      );
      return poolLogs;
    },
    [account, fallbackProvider]
  );

  /* update Pool Historical data */
  const updateStrategyHistory = useCallback(
    async (strategyList: IStrategy[]) => {
      const liqHistMap = new Map<string, any[]>([]);

      /* Get all the Liquidity history transactions */
      await Promise.all(
        strategyList.map(async (strategy: IStrategy) => {
          const { strategyContract, id, decimals } = strategy;
          const _transferInFilter = strategyContract.filters.Transfer(null, account);
          const _transferOutFilter = strategyContract.filters.Transfer(account);

          // TODO add in start and end events if required
          // const _startedFilter = strategyContract.filters.PoolStarted(null);
          // const _endedFilter = strategyContract.filters.PoolEnded(null);
          // const startEventList = await strategyContract.queryFilter(_startedFilter, 0);
          // const endEventList = await strategyContract.queryFilter(_endedFilter, 0);

          const inEventList = await strategyContract.queryFilter(_transferInFilter, 0);
          const outEventList = await strategyContract.queryFilter(_transferOutFilter, 0);

          const events = await Promise.all([
            ...inEventList.map(async (log: any) => {
              const { blockNumber, transactionHash } = log;
              const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;
              const { value } = strategyContract.interface.parseLog(log).args;
              return {
                blockNumber,
                transactionHash,
                date,
                poolTokens: value,
                actionCode: ActionCodes.ADD_LIQUIDITY,
                primaryInfo: `${cleanValue(ethers.utils.formatUnits(value, decimals), 2)} Pool tokens`,
                /* Formatted values:  */
                poolTokens_: ethers.utils.formatUnits(value, decimals),
                date_: dateFormat(date),
              };
            }),

            ...outEventList.map(async (log: any) => {
              const { blockNumber, transactionHash } = log;
              const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;
              const { value } = strategyContract.interface.parseLog(log).args;
              return {
                id,
                blockNumber,
                transactionHash,
                date,
                poolTokens: value,
                actionCode: ActionCodes.REMOVE_LIQUIDITY,
                primaryInfo: `${cleanValue(ethers.utils.formatUnits(value, decimals), 2)} Pool tokens`,
                /* Formatted values:  */
                poolTokens_: ethers.utils.formatUnits(value, decimals),
                date_: dateFormat(date),
              };
            }),
          ]);

          const existing = liqHistMap.get(id) || [];
          liqHistMap.set(id, [...existing, ...events]);
        })
      );

      const combinedStrategyMap = new Map([...historyState.strategyHistory, ...liqHistMap]);
      updateState({ type: 'strategyHistory', payload: combinedStrategyMap });
      console.log('Strategy History updated: ', combinedStrategyMap);
    },

    [account, fallbackProvider]
  );

  /* update Pool Historical data */
  const updatePoolHistory = useCallback(
    async (seriesList: ISeries[]) => {
      const liqHistMap = new Map<string, IHistItemPosition[]>([]);
      /* Get all the Liquidity history transactions */
      await Promise.all(
        seriesList.map(async (series: ISeries) => {
          const { poolContract, id: seriesId, decimals } = series;
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
                actionCode: type_,
                primaryInfo: `${cleanValue(ethers.utils.formatUnits(poolTokens, decimals), 2)} Pool tokens`,

                /* Formatted values:  */
                poolTokens_: ethers.utils.formatUnits(poolTokens, decimals),
                fyTokens_: ethers.utils.formatUnits(fyTokens, decimals),
                bases_: ethers.utils.formatUnits(bases, decimals),
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
          const { poolContract, id: seriesId, baseId, decimals } = series;
          const base: IAsset = assetRootMap.get(baseId);
          // event Trade(uint32 maturity, address indexed from, address indexed to, int256 bases, int256 fyTokens);
          const _filter = poolContract.filters.Trade(null, null, account, null, null);
          const eventList = await poolContract.queryFilter(_filter, 0);

          const tradeLogs = await Promise.all(
            eventList
              .filter((log: any) => poolContract.interface.parseLog(log).args.from !== contractMap.get('Ladle')) // TODO make this for any ladle (Past/future)
              .map(async (log: any) => {
                const { blockNumber, transactionHash } = log;
                const { maturity, bases, fyTokens } = poolContract.interface.parseLog(log).args;
                const date = (await fallbackProvider.getBlock(blockNumber)).timestamp;
                const type_ = fyTokens.gt(ZERO_BN) ? ActionCodes.LEND : ActionCodes.CLOSE_POSITION;
                const tradeApr = calculateAPR(bases.abs(), fyTokens.abs(), series?.maturity, date);

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
                  actionCode: type_,

                  primaryInfo: `${cleanValue(ethers.utils.formatUnits(bases.abs(), decimals), 2)} ${base.symbol}`,
                  secondaryInfo: `${cleanValue(tradeApr, 2)}% APY`,

                  /* Formatted values:  */
                  date_: dateFormat(date),
                  bases_: ethers.utils.formatUnits(bases, decimals),
                  fyTokens_: ethers.utils.formatUnits(fyTokens, decimals),
                };
              })
          );
          tradeHistMap.set(seriesId, tradeLogs);
        })
      );

      const combinedTradeMap = new Map([...historyState.tradeHistory, ...tradeHistMap]);
      updateState({ type: 'tradeHistory', payload: combinedTradeMap });
      console.log('Trade history updated: ', combinedTradeMap);
    },
    [account, assetRootMap, fallbackProvider, historyState.tradeHistory]
  );

  /*  Updates VAULT history */
  // event VaultBuilt(bytes12 indexed vaultId, address indexed owner, bytes6 indexed seriesId, bytes6 ilkId);
  // event VaultTweaked(bytes12 indexed vaultId, bytes6 indexed seriesId, bytes6 indexed ilkId);
  // event VaultDestroyed(bytes12 indexed vaultId);
  // event VaultGiven(bytes12 indexed vaultId, address indexed receiver);
  // event VaultLocked(bytes12 indexed vaultId, uint256 indexed timestamp);
  // event VaultStirred(bytes12 indexed from, bytes12 indexed to, uint128 ink, uint128 art);
  // event VaultRolled(bytes12 indexed vaultId, bytes6 indexed seriesId, uint128 art);

  const _parsePourLogs = useCallback(
    (eventList: ethers.Event[], contract: Cauldron, series: ISeries) => {
      const base_ = assetRootMap.get(series?.baseId!);

      return Promise.all(
        eventList.map(async (log: any) => {
          const { blockNumber, transactionHash } = log;
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

          const actionCode = _inferType(art, ink);

          const tradeApr = calculateAPR(baseTraded.abs(), art.abs(), series?.maturity, date);

          let primaryInfo: string = '';
          if (actionCode === ActionCodes.BORROW)
            primaryInfo = `
          ${cleanValue(ethers.utils.formatUnits(baseTraded.abs(), base_.decimals), 2)} ${base_?.symbol!} @
          ${cleanValue(tradeApr, 2)}%`;
          else if (actionCode === ActionCodes.REPAY)
            primaryInfo = `${cleanValue(ethers.utils.formatUnits(baseTraded.abs(), base_.decimals), 2)} ${base_?.symbol!}`;
          else if (actionCode === ActionCodes.ADD_COLLATERAL || actionCode === ActionCodes.REMOVE_COLLATERAL)
            primaryInfo = `${cleanValue(ethers.utils.formatUnits(ink, ilk.decimals), 2)} ${ilk.symbol}`;

          return {
            /* histItem base */
            blockNumber,
            date,
            transactionHash,
            series,
            actionCode,
            primaryInfo,
            secondaryInfo:
              ink.gt(ethers.constants.Zero) &&
              actionCode === ActionCodes.BORROW &&
              `added (${cleanValue(ethers.utils.formatUnits(ink, ilk.decimals), 2)} ${ilk.symbol} collateral)`,

            /* args info */
            ilkId,
            ink,
            art,
            fyTokenTraded,
            baseTraded,

            /* Formatted values:  */
            date_: dateFormat(date),
            ink_: ethers.utils.formatUnits(ink, ilk.decimals),
            art_: ethers.utils.formatUnits(art, ilk.decimals),
            baseTraded_: ethers.utils.formatUnits(baseTraded, ilk.decimals),
            fyTokenTraded_: ethers.utils.formatUnits(fyTokenTraded, ilk.decimals),
          } as IBaseHistItem;
        })
      );
    },
    [assetRootMap, fallbackProvider]
  );

  const _parseGivenLogs = useCallback(
    (eventList: ethers.Event[], contract: Cauldron, series: ISeries) =>
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
            actionCode: ActionCodes.TRANSFER_VAULT,
            primaryInfo: `Transferred to ${abbreviateHash(receiver)}`,

            /* arg info */
            receiver,
            date_: dateFormat(date),
          } as IBaseHistItem;
        })
      ),
    [fallbackProvider]
  );

  const _parseRolledLogs = useCallback(
    (eventList: ethers.Event[], contract: Cauldron, series: ISeries) =>
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
            actionCode: ActionCodes.ROLL_DEBT,
            primaryInfo: `Rolled ${cleanValue(ethers.utils.formatUnits(art, toSeries_.decimals), 2)} debt to ${
              toSeries_.displayNameMobile
            }`,
            /* args info */
            toSeries,
            art,

            /* Formatted values:  */
            date_: dateFormat(date),
            art_: ethers.utils.formatUnits(art, toSeries_.decimals),
          } as IBaseHistItem;
        })
      ),
    [fallbackProvider, seriesRootMap]
  );

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

      updateState({ type: 'vaultHistory', payload: new Map([...historyState.vaultHistory, ...vaultHistMap]) });
      console.log('Vault history updated: ', vaultHistMap);
    },
    [_parseGivenLogs, _parsePourLogs, _parseRolledLogs, contractMap, historyState.vaultHistory, seriesRootMap]
  );

  useEffect(() => {
    /* When the chainContext is finished loading get the Pool and Trade historical  data */
    if (account && !chainLoading) {
      seriesMap.size && updateTradeHistory(Array.from(seriesMap.values()) as ISeries[]);
    }
  }, [account, seriesMap, chainLoading]); // updateXHistory omiteed on purpose

  useEffect(() => {
    /* When the chainContext is finished loading get the Pool and Trade historical  data */
    if (account && !chainLoading) {
      strategyMap.size && updateStrategyHistory(Array.from(strategyMap.values()) as IStrategy[]);
    }
  }, [account, strategyMap, chainLoading]); // updateXHistory omiteed on purpose

  useEffect(() => {
    /* When the chainContext is finished loading get the historical data */
    if (account && !chainLoading) {
      vaultMap.size && updateVaultHistory(Array.from(vaultMap.values()) as IVault[]);
    }
  }, [account, chainLoading, vaultMap]); // updateVaultHisotry omittted on purpose

  /* Exposed userActions */
  const historyActions = {
    updatePoolHistory,
    updateStrategyHistory,
    updateVaultHistory,
    updateTradeHistory,
  };

  return <HistoryContext.Provider value={{ historyState, historyActions }}>{children}</HistoryContext.Provider>;
};

export { HistoryContext, HistoryProvider };
