import React, { useContext, useReducer, useCallback, useMemo } from 'react';
import { BigNumber, ethers } from 'ethers';
import { format } from 'date-fns';

import {
  ISeries,
  IVault,
  IHistItemPosition,
  ActionCodes,
  IBaseHistItem,
  IAsset,
  IStrategy,
  IUserContextState,
} from '../types';

import { ChainContext } from './ChainContext';
import { abbreviateHash, cleanValue } from '../utils/appUtils';
import { UserContext } from './UserContext';
import { ZERO_BN } from '../utils/constants';
import { Cauldron } from '../contracts';
import { calculateAPR, bytesToBytes32 } from '../utils/yieldMath';
import { SettingsContext } from './SettingsContext';
import { useCachedState } from '../hooks/generalHooks';

const dateFormat = (dateInSecs: number) => format(new Date(dateInSecs * 1000), 'dd MMM yyyy');

const _inferTransactionType = (art: BigNumber, ink: BigNumber) => {
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
  /* Helper: only change the state if different from existing */
  const onlyIfChanged = (_action: any) =>
    state[action.type] === _action.payload ? state[action.type] : _action.payload;

  /* Reducer switch */
  switch (action.type) {
    case 'historyLoading':
      return { ...state, historyLoading: onlyIfChanged(action) };
    case 'tradeHistory':
      return {
        ...state,
        tradeHistory: new Map([...state.tradeHistory, ...action.payload]),
      };
    case 'poolHistory':
      return {
        ...state,
        poolHistory: new Map([...state.poolHistory, ...action.payload]),
      };
    case 'strategyHistory':
      return {
        ...state,
        strategyHistory: new Map([...state.strategyHistory, ...action.payload]),
      };
    case 'vaultHistory':
      return {
        ...state,
        vaultHistory: new Map([...state.vaultHistory, ...action.payload]),
      };
    default:
      return state;
  }
}

const HistoryProvider = ({ children }: any) => {
  /* STATE FROM CONTEXT */
  const { chainState } = useContext(ChainContext);
  const {
    contractMap,
    connection: { fallbackProvider },
    seriesRootMap,
    assetRootMap,
  } = chainState;

  const { userState }: { userState: IUserContextState } = useContext(UserContext);
  const { activeAccount: account } = userState;
  const [historyState, updateState] = useReducer(historyReducer, initState);
  const [lastSeriesUpdate] = useCachedState('lastSeriesUpdate', 'earliest');
  const [lastVaultUpdate] = useCachedState('lastVaultUpdate', 'earliest');

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

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

          const inEventList = await strategyContract.queryFilter(_transferInFilter, lastSeriesUpdate); // originally 0
          const outEventList = await strategyContract.queryFilter(_transferOutFilter, lastSeriesUpdate); // originally 0

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

      updateState({ type: 'strategyHistory', payload: liqHistMap });
      diagnostics &&
        console.log(
          'Strategy History updated: ',
          strategyList.map((s) => s.id)
        );
    },

    [account, diagnostics, fallbackProvider, lastSeriesUpdate]
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
          const eventList = await poolContract.queryFilter(_liqFilter, lastSeriesUpdate);

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
      diagnostics && console.log('Pool History updated.');
    },
    [account, diagnostics, fallbackProvider, lastSeriesUpdate]
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
          const eventList = await poolContract.queryFilter(_filter, lastSeriesUpdate);

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

                  primaryInfo: `${cleanValue(ethers.utils.formatUnits(bases.abs(), decimals), 2)} ${
                    base.displaySymbol
                  }`,
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

      console.log(tradeHistMap);
      updateState({ type: 'tradeHistory', payload: tradeHistMap });
      diagnostics &&
        console.log(
          'Trade history updated: ',
          seriesList.map((s) => s.id)
        );
    },
    [account, assetRootMap, contractMap, diagnostics, fallbackProvider, lastSeriesUpdate]
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

          const actionCode = _inferTransactionType(art, ink);
          const tradeApr = calculateAPR(baseTraded.abs(), art.abs(), series?.maturity, date);

          let primaryInfo: string = '';
          if (actionCode === ActionCodes.BORROW)
            primaryInfo = `
          ${cleanValue(
            ethers.utils.formatUnits(baseTraded, base_.decimals),
            base_.digitFormat!
          )} ${base_?.displaySymbol!} @
          ${cleanValue(tradeApr, 2)}%`;
          else if (actionCode === ActionCodes.REPAY)
            primaryInfo = `${cleanValue(
              ethers.utils.formatUnits(baseTraded.abs(), base_.decimals),
              base_.digitFormat!
            )} ${base_?.displaySymbol!}`;
          else if (actionCode === ActionCodes.ADD_COLLATERAL || actionCode === ActionCodes.REMOVE_COLLATERAL)
            primaryInfo = `${cleanValue(ethers.utils.formatUnits(ink, ilk.decimals), ilk.digitFormat!)} ${
              ilk.displaySymbol
            }`;

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
              `added (${cleanValue(ethers.utils.formatUnits(ink, ilk.decimals), ilk.digitFormat!)} ${
                ilk.displaySymbol
              } collateral)`,

            /* args info */
            ilkId,
            ink,
            art,
            fyTokenTraded,
            baseTraded,

            /* Formatted values:  */
            date_: dateFormat(date),
            ink_: ethers.utils.formatUnits(ink, ilk.decimals),
            art_: ethers.utils.formatUnits(art, base_.decimals),
            baseTraded_: ethers.utils.formatUnits(baseTraded, base_.decimals),
            fyTokenTraded_: ethers.utils.formatUnits(fyTokenTraded, base_.decimals),
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
            cauldronContract.queryFilter(pourFilter, lastVaultUpdate),
            cauldronContract.queryFilter(givenFilter, lastVaultUpdate),
            cauldronContract.queryFilter(rolledFilter, lastVaultUpdate),
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
      diagnostics &&
        console.log(
          'Vault history updated: ',
          vaultList.map((v) => v.id)
        );
    },
    [_parseGivenLogs, _parsePourLogs, _parseRolledLogs, contractMap, diagnostics, lastVaultUpdate, seriesRootMap]
  );

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
