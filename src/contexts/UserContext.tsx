import React, { useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BigNumber, ethers } from 'ethers';

import {
  IAssetRoot,
  ISeriesRoot,
  IVaultRoot,
  ISeries,
  IAsset,
  IVault,
  IUserContextState,
  IUserContext,
  IStrategyRoot,
  IStrategy,
  IAssetPair,
} from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, generateVaultName } from '../utils/appUtils';
import {
  calculateAPR,
  divDecimal,
  bytesToBytes32,
  floorDecimal,
  mulDecimal,
  secondsToFrom,
  sellFYToken,
  decimal18ToDecimalN,
} from '../utils/yieldMath';

import { WAD_BN, ZERO_BN } from '../utils/constants';
import { SettingsContext } from './SettingsContext';
import { ORACLE_INFO } from '../config/oracles';

const UserContext = React.createContext<any>({});

const initState: IUserContextState = {
  userLoading: false,
  /* activeAccount */
  activeAccount: null,

  /* Item maps */
  assetMap: new Map<string, IAsset>(),
  seriesMap: new Map<string, ISeries>(),
  vaultMap: new Map<string, IVault>(),
  strategyMap: new Map<string, IStrategy>(),

  /* map of asset prices/limits  */
  assetPairMap: new Map<string, IAssetPair>(),

  vaultsLoading: true as boolean,
  seriesLoading: true as boolean,
  assetsLoading: true as boolean,
  strategiesLoading: true as boolean,
  assetPairLoading: true as boolean,

  /* Current User selections */
  selectedSeries: null,
  selectedIlk: null, // initial ilk
  selectedBase: null, // initial base
  selectedVault: null,
  selectedStrategy: null,
};

function userReducer(state: any, action: any) {
  /* Helper: only change the state if different from existing */ // TODO if even reqd.?
  const onlyIfChanged = (_action: any) =>
    state[action.type] === _action.payload ? state[action.type] : _action.payload;

  /* Reducer switch */
  switch (action.type) {
    case 'userLoading':
      return { ...state, userLoading: onlyIfChanged(action) };

    case 'activeAccount':
      return { ...state, activeAccount: onlyIfChanged(action) };

    case 'assetMap':
      return { ...state, assetMap: onlyIfChanged(action) };
    case 'seriesMap':
      return { ...state, seriesMap: onlyIfChanged(action) };
    case 'vaultMap':
      return { ...state, vaultMap: onlyIfChanged(action) };
    case 'strategyMap':
      return { ...state, strategyMap: onlyIfChanged(action) };

    case 'priceMap':
      return { ...state, priceMap: onlyIfChanged(action) };

    case 'assetPairMap':
      return { ...state, assetPairMap: action.payload };

    case 'vaultsLoading':
      return { ...state, vaultsLoading: onlyIfChanged(action) };
    case 'seriesLoading':
      return { ...state, seriesLoading: onlyIfChanged(action) };
    case 'assetsLoading':
      return { ...state, assetsLoading: onlyIfChanged(action) };
    case 'strategiesLoading':
      return { ...state, strategiesLoading: onlyIfChanged(action) };
    case 'assetPairLoading':
      return { ...state, assetPairLoading: onlyIfChanged(action) };

    case 'selectedVault':
      return { ...state, selectedVault: action.payload };
    case 'selectedSeries':
      return { ...state, selectedSeries: action.payload };
    case 'selectedIlk':
      return { ...state, selectedIlk: action.payload };
    case 'selectedBase':
      return { ...state, selectedBase: action.payload };
    case 'selectedStrategy':
      return { ...state, selectedStrategy: action.payload };

    default:
      return state;
  }
}

const UserProvider = ({ children }: any) => {
  /* STATE FROM CONTEXT */
  const { chainState } = useContext(ChainContext);
  const {
    contractMap,
    connection: { account, fallbackChainId },
    chainLoading,
    seriesRootMap,
    assetRootMap,
    strategyRootMap,
  } = chainState;

  const {
    settingsState: { showWrappedTokens, diagnostics },
  } = useContext(SettingsContext);

  /* LOCAL STATE */
  const [userState, updateState] = useReducer(userReducer, initState);
  const [vaultFromUrl, setVaultFromUrl] = useState<string | null>(null);

  /* HOOKS */
  const { pathname } = useLocation();

  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    pathname && setVaultFromUrl(userState.vaultMap.get(pathname.split('/')[2]));
  }, [pathname, userState.vaultMap]);

  /* internal function for getting the users vaults */
  const _getVaults = useCallback(
    // async (fromBlock: number = 27096000) => {
    async (fromBlock: number = 1) => {
      const Cauldron = contractMap.get('Cauldron');
      const vaultsBuiltFilter = Cauldron.filters.VaultBuilt(null, account);
      const vaultsReceivedfilter = Cauldron.filters.VaultGiven(null, account);
      const vaultsDestroyedfilter = Cauldron.filters.VaultDestroyed(null);

      const [vaultsBuilt, vaultsReceived, vaultsDestroyed] = await Promise.all([
        Cauldron.queryFilter(vaultsBuiltFilter, fromBlock),
        Cauldron.queryFilter(vaultsReceivedfilter, fromBlock),
        Cauldron.queryFilter(vaultsDestroyedfilter, fromBlock),
      ]);

      const buildEventList: IVaultRoot[] = vaultsBuilt.map((x: any): IVaultRoot => {
        const { vaultId: id, ilkId, seriesId } = Cauldron.interface.parseLog(x).args;
        const series = seriesRootMap.get(seriesId);
        return {
          id,
          seriesId,
          baseId: series?.baseId!,
          ilkId,
          displayName: generateVaultName(id),
          decimals: series?.decimals!,
        };
      });

      const recievedEventsList: IVaultRoot[] = await Promise.all(
        vaultsReceived.map(async (x: any): Promise<IVaultRoot> => {
          const { vaultId: id } = Cauldron.interface.parseLog(x).args;
          const { ilkId, seriesId } = await Cauldron.vaults(id);
          const series = seriesRootMap.get(seriesId);
          return {
            id,
            seriesId,
            baseId: series?.baseId!,
            ilkId,
            displayName: generateVaultName(id),
            decimals: series?.decimals!,
          };
        })
      );

      const destroyedEventsList: string[] = vaultsDestroyed.map((x: any) => Cauldron.interface.parseLog(x).args[0]);
      console.log('DESTROYED VAULTS: ', destroyedEventsList);

      /* all vault excluing deleted vaults */
      const vaultList: IVaultRoot[] = [...buildEventList, ...recievedEventsList].filter(
        (x: IVaultRoot) => !destroyedEventsList.includes(x.id)
      );

      const newVaultMap = vaultList.reduce((acc: any, item: any) => {
        const _map = acc;
        _map.set(item.id, item);
        return _map;
      }, new Map()) as Map<string, IVaultRoot>;

      return newVaultMap;
      /* Update the local cache storage */
      // TODO setCachedVaults({ data: Array.from(newVaultMap.values()), lastBlock: await fallbackProvider.getBlockNumber() });
    },
    [account, contractMap, seriesRootMap]
  );

  /* Updates the assets with relevant *user* data */
  const updateAssets = useCallback(
    async (assetList: IAssetRoot[]) => {
      updateState({ type: 'assetsLoading', payload: true });
      let _publicData: IAssetRoot[] = [];
      let _accountData: IAsset[] = [];

      _publicData = await Promise.all(
        assetList.map(async (asset: IAssetRoot): Promise<IAssetRoot> => {
          const isYieldBase = !!Array.from(seriesRootMap.values()).find((x: any) => x.baseId === asset.idToUse);
          return {
            ...asset,
            isYieldBase,
            displaySymbol: showWrappedTokens ? asset.symbol : asset.displaySymbol, // if showing wrapped tokens, show the true token names
          };
        })
      );

      /* add in the dynamic asset data of the assets in the list */
      if (account) {
        try {
          _accountData = await Promise.all(
            _publicData.map(async (asset: IAssetRoot): Promise<IAsset> => {
              const balance = await asset.getBalance(account);
              return {
                ...asset,
                balance: balance || ethers.constants.Zero,
                balance_: balance
                  ? cleanValue(ethers.utils.formatUnits(balance, asset.decimals), 2)
                  : cleanValue(ethers.utils.formatUnits(ethers.constants.Zero, asset.decimals)), // for display purposes only
              };
            })
          );
        } catch (e) {
          console.log(e);
        }
      }
      const _combinedData = _accountData.length ? _accountData : _publicData;

      /* get the previous version (Map) of the vaultMap and update it */
      const newAssetMap = new Map(
        _combinedData.reduce((acc: any, item: any) => {
          const _map = acc;
          _map.set(item.id, item);
          return _map;
        }, assetRootMap)
      );

      updateState({ type: 'assetMap', payload: newAssetMap });

      console.log('ASSETS updated (with dynamic data): ', newAssetMap);
      updateState({ type: 'assetsLoading', payload: false });
    },
    [account, assetRootMap, seriesRootMap, showWrappedTokens]
  );

  

  const updateAssetPair = useCallback( async (baseId: string, ilkId: string): Promise<IAssetPair> => {
    updateState({ type: 'assetPairLoading', payload: true });

    const Cauldron = contractMap.get('Cauldron');
    const oracleName = ORACLE_INFO.get(fallbackChainId||1)
      ?.get(baseId)
      ?.get(ilkId);
    const Oracle = contractMap.get(oracleName);
    const base: IAssetRoot = assetRootMap.get(baseId);

    diagnostics && console.log('Getting Asset Pair Info: ', baseId, ilkId);

    // /* Get debt params and spot ratios */
    const [{ max, min, sum, dec }, { ratio }] = await Promise.all([
      await Cauldron.debt(baseId, ilkId),
      await Cauldron.spotOracles(baseId, ilkId),
    ]);

    /* get pricing if available */
    let price: BigNumber;
    try {
      [price] = await Oracle.peek(
        bytesToBytes32(ilkId, 6),
        bytesToBytes32(baseId, 6),
        decimal18ToDecimalN(WAD_BN, dec)
      );
      diagnostics && console.log('Price fetched: ', baseId, ilkId, '>', price.toString());
    } catch (error) {
      diagnostics && console.log('Error getting pricing for: ', bytesToBytes32(baseId, 6), bytesToBytes32(ilkId, 6));
      diagnostics && console.log(error);
      price = ethers.constants.Zero;
    }

    const newPair = {
      baseId,
      ilkId,
      minDebtLimit: BigNumber.from(min).mul(BigNumber.from('10').pow(dec)),
      maxDebtLimit: max.mul(BigNumber.from('10').pow(dec)),
      limitDecimals: dec,
      pairTotalDebt: sum,
      pairPrice: price,
      minRatio: ratio,
      baseDecimals: base.decimals,
    };

    updateState({ type: 'assetPairMap', payload: userState.assetPairMap.set(baseId + ilkId, newPair) });
    updateState({ type: 'assetPairLoading', payload: false });

    return newPair;
  }
  ,[assetRootMap, contractMap, diagnostics, fallbackChainId, userState.assetPairMap]
  )

  /* Updates the series with relevant *user* data */
  const updateSeries = useCallback(
    async (seriesList: ISeriesRoot[]): Promise<Map<string, ISeries>> => {
      updateState({ type: 'seriesLoading', payload: true });
      let _publicData: ISeries[] = [];
      let _accountData: ISeries[] = [];

      /* Add in the dynamic series data of the series in the list */
      _publicData = await Promise.all(
        seriesList.map(async (series: ISeriesRoot): Promise<ISeries> => {
          /* Get all the data simultanenously in a promise.all */
          const [baseReserves, fyTokenReserves, totalSupply, fyTokenRealReserves, mature] = await Promise.all([
            series.poolContract.getBaseBalance(),
            series.poolContract.getFYTokenBalance(),
            series.poolContract.totalSupply(),
            series.fyTokenContract.balanceOf(series.poolAddress),
            series.isMature(),
          ]);

          /* Calculates the base/fyToken unit selling price */
          const _sellRate = sellFYToken(
            baseReserves,
            fyTokenReserves,
            ethers.utils.parseUnits('1', series.decimals),
            secondsToFrom(series.maturity.toString()),
            series.decimals
          );

          const apr =
            calculateAPR(floorDecimal(_sellRate), ethers.utils.parseUnits('1', series.decimals), series.maturity) ||
            '0';

          return {
            ...series,
            baseReserves,
            baseReserves_: ethers.utils.formatUnits(baseReserves, series.decimals),
            fyTokenReserves,
            fyTokenRealReserves,
            totalSupply,
            totalSupply_: ethers.utils.formatUnits(totalSupply, series.decimals),
            apr: `${Number(apr).toFixed(2)}`,
            seriesIsMature: mature,
          };
        })
      );

      if (account) {
        _accountData = await Promise.all(
          _publicData.map(async (series: ISeries): Promise<ISeries> => {
            /* Get all the data simultanenously in a promise.all */
            const [poolTokens, fyTokenBalance] = await Promise.all([
              series.poolContract.balanceOf(account),
              series.fyTokenContract.balanceOf(account),
            ]);
            const poolPercent = mulDecimal(divDecimal(poolTokens, series.totalSupply), '100');
            return {
              ...series,
              poolTokens,
              fyTokenBalance,
              poolTokens_: ethers.utils.formatUnits(poolTokens, series.decimals),
              fyTokenBalance_: ethers.utils.formatUnits(fyTokenBalance, series.decimals),
              poolPercent,
            };
          })
        );
      }

      const _combinedData = _accountData.length ? _accountData : _publicData;

      /* combined account and public series data reduced into a single Map */
      const newSeriesMap = new Map(
        _combinedData.reduce((acc: any, item: any) => {
          const _map = acc;
          _map.set(item.id, item);
          return _map;
        }, userState.seriesMap)
      ) as Map<string, ISeries>;

      // const combinedSeriesMap = new Map([...userState.seriesMap, ...newSeriesMap ])

      updateState({ type: 'seriesMap', payload: newSeriesMap });
      console.log('SERIES updated (with dynamic data): ', newSeriesMap);
      updateState({ type: 'seriesLoading', payload: false });

      return newSeriesMap;
    },
    [account]
  );

  /* Updates the vaults with *user* data */
  const updateVaults = useCallback(
    async (vaultList: IVaultRoot[]) => {
      updateState({ type: 'vaultsLoading', payload: true });
      let _vaultList: IVaultRoot[] = vaultList;
      const Cauldron = contractMap.get('Cauldron');
      const Witch = contractMap.get('Witch');

      /* if vaultList is empty, fetch complete Vaultlist from chain via _getVaults */
      if (vaultList.length === 0) _vaultList = Array.from((await _getVaults()).values());

      /* Add in the dynamic vault data by mapping the vaults list */
      const vaultListMod = await Promise.all(
        _vaultList.map(async (vault: IVaultRoot): Promise<IVault> => {
          /* get the asset Pair info */
          if (!userState.assetPairMap.has(vault.baseId + vault.ilkId)) {
            userState.assetPairMap.set(vault.baseId + vault.ilkId, updateAssetPair(vault.baseId, vault.ilkId));
            diagnostics && console.log('AssetPairInfo queued for fetching from network');
          } else {
            diagnostics && console.log('AssetPairInfo exists in assetPairMap');
          }

          /* Get dynamic vault data */
          const [
            { ink, art },
            { owner, seriesId, ilkId }, // update balance and series (series - because a vault can have been rolled to another series) */
            { minDebtLimit, maxDebtLimit, minRatio, pairTotalDebt, pairPrice, limitDecimals },
          ] = await Promise.all([
            await Cauldron.balances(vault.id),
            await Cauldron.vaults(vault.id),
            await userState.assetPairMap.get(vault.baseId + vault.ilkId), // this handles fetching the assetPAir data if required ( either from the map, or network)
          ]);

          const baseRoot: IAssetRoot = assetRootMap.get(vault.baseId);
          const ilkRoot: IAssetRoot = assetRootMap.get(ilkId);

          diagnostics &&
            console.log(vault.id, minDebtLimit, maxDebtLimit, minRatio, pairTotalDebt, pairPrice, limitDecimals);

          return {
            ...vault,
            owner, // refreshed in case owner has been updated
            isWitchOwner: Witch.address === owner, // check if witch is the owner (in liquidation process)
            isActive: owner === account, // refreshed in case owner has been updated
            seriesId, // refreshed in case seriesId has been updated
            ilkId, // refreshed in case ilkId has been updated
            ink,
            art,

            ink_: cleanValue(ethers.utils.formatUnits(ink, ilkRoot?.decimals), ilkRoot?.digitFormat), // for display purposes only
            art_: cleanValue(ethers.utils.formatUnits(art, baseRoot?.decimals), baseRoot?.digitFormat), // for display purposes only

            /* attach extra pairwaise data for convenience */
            minDebtLimit,
            maxDebtLimit,
            minRatio,
            pairPrice,
            pairTotalDebt,

            baseDecimals: baseRoot?.decimals,
            limitDecimals,
          };
        })
      );

      /* Get the previous version (Map) of the vaultMap and update it */
      const newVaultMap = new Map(
        vaultListMod.reduce((acc: any, item: any) => {
          const _map = acc;
          _map.set(item.id, item);
          return _map;
        }, new Map())
      );

      /* if there are no vaults provided - assume a forced refresh of all vaults : */
      const combinedVaultMap = vaultList.length > 0 ? new Map([...userState.vaultMap, ...newVaultMap]) : newVaultMap;

      /* update state */
      updateState({ type: 'vaultMap', payload: combinedVaultMap });
      vaultFromUrl && updateState({ type: 'selectedVault', payload: vaultFromUrl });
      updateState({ type: 'vaultsLoading', payload: false });

      console.log('VAULTS: ', combinedVaultMap);
    },
    [contractMap, _getVaults, userState.vaultMap, vaultFromUrl, assetRootMap, account]
  );

  /* Updates the assets with relevant *user* data */
  const updateStrategies = useCallback(
    async (strategyList: IStrategyRoot[]) => {
      updateState({ type: 'strategiesLoading', payload: true });
      let _publicData: IStrategy[] = [];
      let _accountData: IStrategy[] = [];

      _publicData = await Promise.all(
        strategyList.map(async (_strategy: IStrategyRoot): Promise<IStrategy> => {
          /* Get all the data simultanenously in a promise.all */
          const [strategyTotalSupply, currentSeriesId, currentPoolAddr, nextSeriesId] = await Promise.all([
            _strategy.strategyContract.totalSupply(),
            _strategy.strategyContract.seriesId(),
            _strategy.strategyContract.pool(),
            _strategy.strategyContract.nextSeriesId(),
          ]);
          const currentSeries: ISeries = userState.seriesMap.get(currentSeriesId);
          const nextSeries: ISeries = userState.seriesMap.get(nextSeriesId);

          if (currentSeries) {
            const [poolTotalSupply, strategyPoolBalance] = await Promise.all([
              currentSeries.poolContract.totalSupply(),
              currentSeries.poolContract.balanceOf(_strategy.address),
            ]);

            const [currentInvariant, initInvariant] = currentSeries.seriesIsMature
              ? [ZERO_BN, ZERO_BN]
              : [ZERO_BN, ZERO_BN];
            // TODO Re-include invariant
            // : await Promise.all([
            //     currentSeries.poolContract.invariant(),
            //     _strategy.strategyContract.invariants(currentPoolAddr),
            //   ]);

            const strategyPoolPercent = mulDecimal(divDecimal(strategyPoolBalance, poolTotalSupply), '100');
            const returnRate = currentInvariant && currentInvariant.sub(initInvariant)!;

            return {
              ..._strategy,
              strategyTotalSupply,
              strategyTotalSupply_: ethers.utils.formatUnits(strategyTotalSupply, _strategy.decimals),
              poolTotalSupply,
              poolTotalSupply_: ethers.utils.formatUnits(poolTotalSupply, _strategy.decimals),
              strategyPoolBalance,
              strategyPoolBalance_: ethers.utils.formatUnits(strategyPoolBalance, _strategy.decimals),
              strategyPoolPercent,
              currentSeriesId,
              currentPoolAddr,
              nextSeriesId,
              currentSeries,
              nextSeries,
              initInvariant: initInvariant || BigNumber.from('0'),
              currentInvariant: currentInvariant || BigNumber.from('0'),
              returnRate,
              returnRate_: returnRate.toString(),
              active: true,
            };
          }

          /* else return an 'EMPTY' strategy */
          return {
            ..._strategy,
            currentSeriesId,
            currentPoolAddr,
            nextSeriesId,
            currentSeries: undefined,
            nextSeries: undefined,
            active: false,
          };
        })
      );

      /* add in account specific data */
      if (account) {
        _accountData = await Promise.all(
          _publicData
            // .filter( (s:IStrategy) => s.active) // filter out strategies with no current series
            .map(async (_strategy: IStrategy): Promise<IStrategy> => {
              const [accountBalance, accountPoolBalance] = await Promise.all([
                _strategy.strategyContract.balanceOf(account),
                _strategy.currentSeries?.poolContract.balanceOf(account),
              ]);

              const accountStrategyPercent = mulDecimal(
                divDecimal(accountBalance, _strategy.strategyTotalSupply || '0'),
                '100'
              );

              return {
                ..._strategy,
                accountBalance,
                accountBalance_: ethers.utils.formatUnits(accountBalance, _strategy.decimals),
                accountPoolBalance,
                accountStrategyPercent,
              };
            })
        );
      }

      const _combinedData = _accountData.length ? _accountData : _publicData; // .filter( (s:IStrategy) => s.active) ; // filter out strategies with no current series

      /* combined account and public series data reduced into a single Map */
      const newStrategyMap = new Map(
        _combinedData.reduce((acc: any, item: any) => {
          const _map = acc;
          _map.set(item.address, item);
          return _map;
        }, userState.strategyMap)
      );

      const combinedMap = newStrategyMap;

      updateState({ type: 'strategyMap', payload: combinedMap });
      updateState({ type: 'strategiesLoading', payload: false });

      console.log('STRATEGIES updated (with dynamic data): ', combinedMap);

      return combinedMap;
    },
    [account, userState.seriesMap] // userState.strategyMap excluded on purpose
  );

  /* When the chainContext is finished loading get the dynamic series, asset and strategies data */
  useEffect(() => {
    if (!chainLoading) {
      seriesRootMap.size && updateSeries(Array.from(seriesRootMap.values()));
      assetRootMap.size && updateAssets(Array.from(assetRootMap.values()));
    }
  }, [account, chainLoading, assetRootMap, seriesRootMap, updateSeries, updateAssets]);

  /* Only When seriesContext is finished loading get the strategies data */
  useEffect(() => {
    !userState.seriesLoading && strategyRootMap.size && updateStrategies(Array.from(strategyRootMap.values()));
  }, [strategyRootMap, updateStrategies, userState.seriesLoading]);

  /* When the chainContext is finished loading get the users vault data */
  useEffect(() => {
    if (!chainLoading && account !== null) {
      console.log('Checking User Vaults');
      /* trigger update of update all vaults by passing empty array */
      updateVaults([]);
    }
    /* keep checking the active account when it changes/ chainloading */
    updateState({ type: 'activeAccount', payload: account });
  }, [account, chainLoading]); // updateVaults ignored here on purpose

  /* Exposed userActions */
  const userActions = {
    updateSeries,
    updateAssets,
    updateVaults,
    updateStrategies,

    updateAssetPair,

    setSelectedVault: useCallback((vault: IVault | null) => updateState({ type: 'selectedVault', payload: vault }), []),
    setSelectedIlk: useCallback((asset: IAsset | null) => updateState({ type: 'selectedIlk', payload: asset }), []),
    setSelectedSeries: useCallback(
      (series: ISeries | null) => updateState({ type: 'selectedSeries', payload: series }),
      []
    ),
    setSelectedBase: useCallback((asset: IAsset | null) => updateState({ type: 'selectedBase', payload: asset }), []),
    setSelectedStrategy: useCallback(
      (strategy: IStrategy | null) => updateState({ type: 'selectedStrategy', payload: strategy }),
      []
    ),
  };

  return <UserContext.Provider value={{ userState, userActions } as IUserContext}>{children}</UserContext.Provider>;
};

export { UserContext, UserProvider };
