import { useRouter } from 'next/router';
import React, { useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { BigNumber, ethers } from 'ethers';

import {
  calculateAPR,
  divDecimal,
  bytesToBytes32,
  floorDecimal,
  mulDecimal,
  sellFYToken,
  calcAccruedDebt,
  toBn,
} from '@yield-protocol/ui-math';

import Decimal from 'decimal.js';
import request from 'graphql-request';
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
  IChainContext,
} from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, generateVaultName } from '../utils/appUtils';

import { EULER_SUPGRAPH_ENDPOINT, ZERO_BN } from '../utils/constants';
import { SettingsContext } from './SettingsContext';
import { ETH_BASED_ASSETS, FRAX } from '../config/assets';
import { VaultBuiltEvent, VaultGivenEvent } from '../contracts/Cauldron';
import { ORACLE_INFO } from '../config/oracles';
import useTimeTillMaturity from '../hooks/useTimeTillMaturity';
import useTenderly from '../hooks/useTenderly';
import { useAccount, useNetwork, useProvider } from 'wagmi';
import { PoolType } from '../config/series';

enum UserState {
  USER_LOADING = 'userLoading',

  UPDATE_ASSET = 'updateAsset',
  UPDATE_SERIES = 'updateSeries',
  UPDATE_VAULT = 'updateVault',
  UPDATE_STRATEGY = 'updateStrategy',

  CLEAR_VAULTS = 'clearVaults',

  VAULTS_LOADING = 'vaultsLoading',
  SERIES_LOADING = 'seriesLoading',
  ASSETS_LOADING = 'assetsLoading',
  STRATEGIES_LOADING = 'strategiesLoading',

  SELECTED_VAULT = 'selectedVault',
  SELECTED_SERIES = 'selectedSeries',
  SELECTED_ILK = 'selectedIlk',
  SELECTED_BASE = 'selectedBase',
  SELECTED_STRATEGY = 'selectedStrategy',
}

const UserContext = React.createContext<any>({});

const initState: IUserContextState = {
  userLoading: false,
  /* Item maps */
  assetMap: new Map<string, IAsset>(),
  seriesMap: new Map<string, ISeries>(),
  vaultMap: new Map<string, IVault>(),
  strategyMap: new Map<string, IStrategy>(),

  vaultsLoading: true as boolean,
  seriesLoading: true as boolean,
  assetsLoading: true as boolean,
  strategiesLoading: true as boolean,

  /* Current User selections */
  selectedSeries: null,
  selectedIlk: null, // initial ilk
  selectedBase: null, // initial base
  selectedVault: null,
  selectedStrategy: null,
};

function userReducer(state: IUserContextState, action: any) {
  /* Helper: only change the state if different from existing */ // TODO if even reqd.?
  const onlyIfChanged = (_action: any) =>
    state[action.type] === _action.payload ? state[action.type] : _action.payload;

  /* Reducer switch */
  switch (action.type) {
    case UserState.USER_LOADING:
      return { ...state, userLoading: onlyIfChanged(action) };

    case UserState.VAULTS_LOADING:
      return { ...state, vaultsLoading: onlyIfChanged(action) };
    case UserState.SERIES_LOADING:
      return { ...state, seriesLoading: onlyIfChanged(action) };
    case UserState.ASSETS_LOADING:
      return { ...state, assetsLoading: onlyIfChanged(action) };
    case UserState.STRATEGIES_LOADING:
      return { ...state, strategiesLoading: onlyIfChanged(action) };

    case UserState.UPDATE_ASSET:
      return { ...state, assetMap: new Map(state.assetMap.set(action.payload.id, action.payload)) };
    case UserState.UPDATE_SERIES:
      return { ...state, seriesMap: new Map(state.seriesMap.set(action.payload.id, action.payload)) };
    case UserState.UPDATE_VAULT:
      return { ...state, vaultMap: new Map(state.vaultMap.set(action.payload.id, action.payload)) };
    case UserState.UPDATE_STRATEGY:
      return { ...state, strategyMap: new Map(state.strategyMap.set(action.payload.id, action.payload)) };

    case UserState.CLEAR_VAULTS:
      return { ...state, vaultMap: new Map() };

    case UserState.SELECTED_VAULT:
      return { ...state, selectedVault: action.payload };
    case UserState.SELECTED_SERIES:
      return { ...state, selectedSeries: action.payload };
    case UserState.SELECTED_ILK:
      return { ...state, selectedIlk: action.payload };
    case UserState.SELECTED_BASE:
      return { ...state, selectedBase: action.payload };
    case UserState.SELECTED_STRATEGY:
      return { ...state, selectedStrategy: action.payload };

    default:
      return state;
  }
}

const UserProvider = ({ children }: any) => {
  /* STATE FROM CONTEXT */
  const { chainState } = useContext(ChainContext) as IChainContext;
  const { contractMap, chainLoaded, seriesRootMap, assetRootMap, strategyRootMap } = chainState;
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const useTenderlyFork = false;

  /* LOCAL STATE */
  const [userState, updateState] = useReducer(userReducer, initState);
  const [vaultFromUrl, setVaultFromUrl] = useState<string | null>(null);

  /* HOOKS */
  const { address: account } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();

  const { pathname } = useRouter();
  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();
  const { tenderlyStartBlock } = useTenderly();

  /* internal function for getting the users vaults */
  const _getVaults = async () => {

    const Cauldron = contractMap.get('Cauldron');

    const cacheKey = `vaults_${account}_${chain.id}`;
    const cachedVaults = JSON.parse(localStorage.getItem(cacheKey));
    const cachedVaultList = cachedVaults ? cachedVaults : [];

    const lastVaultUpdateKey = `lastVaultUpdate_${account}_${chain.id}`;
    const lastVaultUpdate = JSON.parse(localStorage.getItem(lastVaultUpdateKey)) || 'earliest';

    /* Get a list of the vaults that were BUILT */
    const vaultsBuiltFilter = Cauldron.filters.VaultBuilt(null, account, null);
    const vaultsBuilt = await Cauldron.queryFilter(vaultsBuiltFilter, lastVaultUpdate);
    const buildEventList = vaultsBuilt.map((x: VaultBuiltEvent): IVaultRoot => {
      const { vaultId: id, ilkId, seriesId } = x.args;
      const series = seriesRootMap.get(seriesId);
      return {
        id,
        seriesId,
        baseId: series?.baseId,
        ilkId,
        displayName: generateVaultName(id),
        decimals: series?.decimals,
      };
    });

    /* Get a list of the vaults that were RECEIVED */
    const vaultsReceivedFilter = Cauldron.filters.VaultGiven(null, account);
    const vaultsReceived = await Cauldron.queryFilter(vaultsReceivedFilter, lastVaultUpdate);
    const receivedEventsList = await Promise.all(
      vaultsReceived.map(async (x: VaultGivenEvent): Promise<IVaultRoot> => {
        const { vaultId: id } = x.args;
        const { ilkId, seriesId } = await Cauldron.vaults(id);
        const series = seriesRootMap.get(seriesId);
        return {
          id,
          seriesId,
          baseId: series.baseId,
          ilkId,
          displayName: generateVaultName(id),
          decimals: series.decimals,
        };
      })
    );

    /* all vaults */
    const allVaultList = [...buildEventList, ...receivedEventsList, ...cachedVaultList];

    /* Cache results */
    const latestBlock = (await provider.getBlockNumber()).toString();
    
    allVaultList.length && localStorage.setItem(cacheKey, JSON.stringify(allVaultList));
    allVaultList.length && localStorage.setItem(lastVaultUpdateKey, latestBlock ); 

    const newVaultMap = allVaultList.reduce((acc: Map<string, IVaultRoot>, item) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, new Map()) as Map<string, IVaultRoot>;

    // newVaultList.length && localStorage.setItem(cacheKey, JSON.stringify(newSeriesList));
    return newVaultMap;
  };

  /* Updates the assets with relevant *user* data */
  const updateAssets = async (assetList: IAssetRoot[]) => {
    console.log('Updating assets...');
    updateState({ type: UserState.ASSETS_LOADING, payload: true });

    const updatedAssets = await Promise.all(
      assetList.map(async (asset) => {
        const balance = account ? await asset.getBalance(account) : ZERO_BN;
        const newAsset = {
          /* public data */
          ...asset,
          displaySymbol: asset?.displaySymbol,
          /* account data */
          balance: balance || ethers.constants.Zero,
          balance_: balance
            ? cleanValue(ethers.utils.formatUnits(balance, asset.decimals), 2)
            : cleanValue(ethers.utils.formatUnits(ethers.constants.Zero, asset.decimals)), // for display purposes only
        };
        updateState({ type: UserState.UPDATE_ASSET, payload: newAsset });
        return newAsset;
      })
    );

    diagnostics && console.log('ASSETS updated (with dynamic data):');
    console.table(updatedAssets, ['id', 'symbol', 'address', 'balance_']);
    updateState({ type: UserState.ASSETS_LOADING, payload: false });
  };

  /* Updates the series with relevant *user* data */
  const updateSeries = async (seriesList: ISeriesRoot[], accountInfoOnly: boolean = false) => {
    console.log('Updating series...');
    updateState({ type: UserState.SERIES_LOADING, payload: true });

    const updatedSeries = await Promise.all(
      seriesList.map(async (series) => {
        const seriesIsMature = isMature(series.maturity);

        /* Get all the data simultanenously in a promise.all */
        const [baseReserves, fyTokenReserves, totalSupply, fyTokenRealReserves] = await Promise.all([
          series.poolContract.getBaseBalance(),
          series.poolContract.getFYTokenBalance(),
          series.poolContract.totalSupply(),
          series.fyTokenContract.balanceOf(series.poolAddress),
        ]);

        let sharesReserves: BigNumber | undefined;
        let c: BigNumber | undefined;
        let mu: BigNumber | undefined;
        let currentSharePrice: BigNumber | undefined;
        let sharesToken: string | undefined;

        if (series.poolType === PoolType.TV) {
          [sharesReserves, c, mu, currentSharePrice, sharesToken] = await Promise.all([
            series.poolContract.getSharesBalance(),
            series.poolContract.getC(),
            series.poolContract.mu(),
            series.poolContract.getCurrentSharePrice(),
            series.poolContract.sharesToken(),
          ]);
        } else {
          sharesReserves = baseReserves;
          currentSharePrice = ethers.utils.parseUnits('1', series.decimals);
          diagnostics && console.log('Using non-TV pool contract that does not include c, mu, and shares');
        }

        // convert base amounts to shares amounts (baseAmount is wad)
        const getShares = (baseAmount: BigNumber) =>
          toBn(
            new Decimal(baseAmount.toString()).mul(10 ** series.decimals).div(new Decimal(currentSharePrice.toString()))
          );

        // convert shares amounts to base amounts
        const getBase = (sharesAmount: BigNumber) =>
          toBn(
            new Decimal(sharesAmount.toString())
              .mul(new Decimal(currentSharePrice.toString()))
              .div(10 ** series.decimals)
          );

        const rateCheckAmount = ethers.utils.parseUnits(
          ETH_BASED_ASSETS.includes(series.baseId) ? '.001' : '1',
          series.decimals
        );

        /* Calculates the base/fyToken unit selling price */
        const _sellRate = sellFYToken(
          sharesReserves,
          fyTokenReserves,
          rateCheckAmount,
          getTimeTillMaturity(series.maturity),
          series.ts,
          series.g2,
          series.decimals,
          c,
          mu
        );

        const apr = calculateAPR(floorDecimal(_sellRate), rateCheckAmount, series.maturity) || '0';
        // fetch the euler eToken supply APY from their subgraph
        const poolAPY = sharesToken ? await getPoolAPY(sharesToken) : undefined;

        // some logic to decide if the series is shown or not :
        // const showSeries = chain?.id === 1 && series.baseId !== FRAX ? true : series.maturity !== 1672412400;
        const showSeries = true; // Show all series

        /* Get all the account data simultanenously in a promise.all */
        const [poolTokens, fyTokenBalance] = account
          ? await Promise.all([series.poolContract.balanceOf(account), series.fyTokenContract.balanceOf(account)])
          : [ZERO_BN, ZERO_BN];
        const poolPercent = poolTokens.gt(ZERO_BN) ? mulDecimal(divDecimal(poolTokens, totalSupply), '100') : 0;

        /* lay out the new series */
        const newSeries = {
          /* public data */
          ...series,
          sharesReserves,
          sharesReserves_: ethers.utils.formatUnits(sharesReserves, series.decimals),
          fyTokenReserves,
          fyTokenRealReserves,
          totalSupply,
          totalSupply_: ethers.utils.formatUnits(totalSupply, series.decimals),
          apr: `${Number(apr).toFixed(2)}`,
          seriesIsMature,
          c,
          mu,
          poolAPY,
          getShares,
          getBase,
          showSeries,

          /* Account data */
          poolTokens,
          fyTokenBalance,
          poolTokens_: ethers.utils.formatUnits(poolTokens, series.decimals),
          fyTokenBalance_: ethers.utils.formatUnits(fyTokenBalance, series.decimals),
          poolPercent,
        };

        updateState({ type: UserState.UPDATE_SERIES, payload: newSeries });
        return newSeries;
      })
    );

    diagnostics && console.log('SERIES updated (with dynamic data): ');
    console.table(updatedSeries, ['id', 'displayName', 'baseId', 'poolType', 'seriesIsMature', 'showSeries']);
    updateState({ type: UserState.SERIES_LOADING, payload: false });

    return updatedSeries;
  };

  /* Updates the assets with relevant *user* data */
  const updateStrategies = async (strategyList: IStrategyRoot[]) => {
    console.log('Updating Strategies...');
    updateState({ type: UserState.STRATEGIES_LOADING, payload: true });

    const updatedStrategies = await Promise.all(
      strategyList.map(async (_strategy) => {
        /* Get all the data simultanenously in a */
        const [strategyTotalSupply, currentSeriesId, currentPoolAddr, nextSeriesId] = await Promise.all([
          _strategy.strategyContract.totalSupply(),
          _strategy.strategyContract.seriesId(),
          _strategy.strategyContract.pool(),
          _strategy.strategyContract.nextSeriesId(),
        ]);

        const currentSeries = userState.seriesMap.get(currentSeriesId) as ISeries;
        const nextSeries = userState.seriesMap.get(nextSeriesId) as ISeries;

        let newStrategy: IStrategy;

        if (currentSeries) {
          const [poolTotalSupply, strategyPoolBalance] = await Promise.all([
            currentSeries.poolContract.totalSupply(),
            currentSeries.poolContract.balanceOf(_strategy.address),
          ]);

          const [currentInvariant, initInvariant] = currentSeries.seriesIsMature
            ? [ZERO_BN, ZERO_BN]
            : [ZERO_BN, ZERO_BN];

          const strategyPoolPercent = mulDecimal(divDecimal(strategyPoolBalance, poolTotalSupply), '100');
          const returnRate = currentInvariant && currentInvariant.sub(initInvariant)!;

          const [accountBalance, accountPoolBalance] = account
            ? await Promise.all([
                _strategy.strategyContract.balanceOf(account),
                currentSeries.poolContract.balanceOf(account),
              ])
            : [ZERO_BN, ZERO_BN];

          const accountStrategyPercent = account
            ? mulDecimal(divDecimal(accountBalance, strategyTotalSupply || '0'), '100')
            : '0';

          newStrategy = {
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

            /* Account info */
            accountBalance,
            accountBalance_: ethers.utils.formatUnits(accountBalance, _strategy.decimals),
            accountPoolBalance,
            accountStrategyPercent,
          };
        } else {
          /* else return an 'EMPTY' strategy */
          newStrategy = {
            ..._strategy,
            currentSeriesId,
            currentPoolAddr,
            nextSeriesId,
            currentSeries: undefined,
            nextSeries: undefined,
            active: false,
          };
        }

        updateState({ type: UserState.UPDATE_STRATEGY, payload: newStrategy });
        return newStrategy;
      })
    );

    diagnostics && console.log('STRATEGIES updated (with dynamic data): ');
    console.table(updatedStrategies, ['id', 'currentSeriesId', 'active']);
    updateState({ type: UserState.STRATEGIES_LOADING, payload: false });

    return updatedStrategies;
  };

  /* Updates the vaults with *user* data */
  const updateVaults = async (vaultList: IVaultRoot[]) => {
    console.log('Updating vaults...');
    updateState({ type: UserState.VAULTS_LOADING, payload: true });

    let _vaults: IVaultRoot[] = vaultList;
    const Cauldron = contractMap.get('Cauldron');
    const Witch = contractMap.get('Witch');

    /**
     * if vaultList is empty, clear local app memory and fetch complete Vaultlist from chain via _getVaults */
    if (vaultList.length === 0) {
      updateState({ type: UserState.CLEAR_VAULTS });
      const vaults = await _getVaults();
      _vaults = Array.from(vaults.values());
    }

    const updatedVaults = await Promise.all(
      _vaults.map(async (vault) => {
        const [
          { ink, art },
          { owner, seriesId, ilkId }, // update balance and series (series - because a vault can have been rolled to another series) */
        ] = await Promise.all([Cauldron?.balances(vault.id), Cauldron?.vaults(vault.id)]);

        const series = seriesRootMap.get(seriesId);
        const isVaultMature = isMature(series.maturity);

        /* If art 0, check for liquidation event */
        const hasBeenLiquidated =
          art === ZERO_BN
            ? (
                await Witch.queryFilter(
                  Witch.filters.Auctioned(bytesToBytes32(vault.id, 12), null),
                  useTenderlyFork && tenderlyStartBlock ? tenderlyStartBlock : 'earliest',
                  'latest'
                )
              ).length > 0
            : false;

        let accruedArt: BigNumber;
        let rateAtMaturity: BigNumber;
        let rate: BigNumber;

        if (isVaultMature) {
          const RATE = '0x5241544500000000000000000000000000000000000000000000000000000000'; // bytes for 'RATE'
          const oracleName = ORACLE_INFO.get(chain.id)?.get(vault.baseId)?.get(RATE);

          const RateOracle = contractMap.get(oracleName);
          rateAtMaturity = await Cauldron.ratesAtMaturity(seriesId);
          [rate] = await RateOracle.peek(bytesToBytes32(vault.baseId, 6), RATE, '0');

          [accruedArt] = rateAtMaturity.gt(ZERO_BN)
            ? calcAccruedDebt(rate, rateAtMaturity, art)
            : calcAccruedDebt(rate, rate, art);
        } else {
          rate = BigNumber.from('1');
          rateAtMaturity = BigNumber.from('1');
          accruedArt = art;
        }

        const baseRoot = assetRootMap.get(vault.baseId);
        const ilkRoot = assetRootMap.get(ilkId);

        const newVault: IVault = {
          ...vault,
          owner, // refreshed in case owner has been updated
          isWitchOwner: Witch.address === owner, // check if witch is the owner (in liquidation process)
          hasBeenLiquidated,
          isActive: owner === account, // refreshed in case owner has been updated
          seriesId, // refreshed in case seriesId has been updated
          ilkId, // refreshed in case ilkId has been updated
          ink,
          art,
          accruedArt,
          isVaultMature,
          rateAtMaturity,
          rate,

          rate_: cleanValue(ethers.utils.formatUnits(rate, 18), 2), // always 18 decimals when getting rate from rate oracle,
          ink_: cleanValue(ethers.utils.formatUnits(ink, ilkRoot.decimals), ilkRoot.digitFormat), // for display purposes only
          art_: cleanValue(ethers.utils.formatUnits(art, baseRoot.decimals), baseRoot.digitFormat), // for display purposes only
          accruedArt_: cleanValue(ethers.utils.formatUnits(accruedArt, baseRoot.decimals), baseRoot.digitFormat), // display purposes
        };

        updateState({ type: UserState.UPDATE_VAULT, payload: newVault });
        return newVault;
      })
    );

    diagnostics && console.log('Vaults updated successfully.');
    console.table(updatedVaults, ['displayName', 'id', 'accruedArt_', 'ink_', 'baseId', 'ilkId', 'hasBeenLiquidated']);
    updateState({ type: UserState.VAULTS_LOADING, payload: false });
  };

  /**
   *
   * When the chainContext is finished loading get the dynamic series, asset and strategies data.
   * (also on account change )
   *
   * */
  useEffect(() => {
    chainLoaded && updateAssets(Array.from(assetRootMap.values()));
    chainLoaded &&
      updateSeries(Array.from(seriesRootMap.values()))
        /*  when series has finished loading,...load/reload strategy data */
        .finally(() => updateStrategies(Array.from(strategyRootMap.values())));
    chainLoaded && account && updateVaults([]);
  }, [chainLoaded, account]);

  /**
   * If series has finished loading,...load/reload strategy data
   * */
  // useEffect(()=> {
  //   !userState.seriesLoading && updateStrategies(Array.from(strategyRootMap.values()));
  // },[userState.seriesLoading])

  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    const vaultId = pathname.split('/')[2];
    pathname && userState.vaultMap.has(vaultId) && setVaultFromUrl(vaultId);
  }, [pathname, userState.vaultMap]);

  /**
   * Explicitly update selected series on series map changes
   * */
  useEffect(() => {
    if (userState.selectedSeries) {
      updateState({
        type: UserState.SELECTED_SERIES,
        payload: userState.seriesMap.get(userState.selectedSeries.id),
      });
    }
  }, [userState.selectedSeries, userState.seriesMap]);

  /* TODO consider moving out of here ? */
  const getPoolAPY = async (sharesTokenAddr: string) => {
    const query = `
    query ($address: Bytes!) {
      eulerMarketStore(id: "euler-market-store") {
        markets(where:{eTokenAddress:$address}) {
          supplyAPY
         } 
      }
    }
  `;

    interface EulerRes {
      eulerMarketStore: {
        markets: {
          supplyAPY: string;
        }[];
      };
    }

    try {
      const {
        eulerMarketStore: { markets },
      } = await request<EulerRes>(EULER_SUPGRAPH_ENDPOINT, query, { address: sharesTokenAddr });
      return ((+markets[0].supplyAPY * 100) / 1e27).toString();
    } catch (error) {
      diagnostics && console.log(`could not get pool apy for pool with shares token: ${sharesTokenAddr}`, error);
      return undefined;
    }
  };

  /* Exposed userActions */
  const userActions = {
    updateSeries,
    updateAssets,
    updateVaults,
    updateStrategies,

    setSelectedVault: useCallback(
      (vault: IVault | null) => updateState({ type: UserState.SELECTED_VAULT, payload: vault }),
      []
    ),
    setSelectedIlk: useCallback(
      (asset: IAsset | null) => updateState({ type: UserState.SELECTED_ILK, payload: asset }),
      []
    ),
    setSelectedSeries: useCallback(
      (series: ISeries | null) => updateState({ type: UserState.SELECTED_SERIES, payload: series }),
      []
    ),
    setSelectedBase: useCallback(
      (asset: IAsset | null) => updateState({ type: UserState.SELECTED_BASE, payload: asset }),
      []
    ),
    setSelectedStrategy: useCallback(
      (strategy: IStrategy | null) => updateState({ type: UserState.SELECTED_STRATEGY, payload: strategy }),
      []
    ),
  };
  return <UserContext.Provider value={{ userState, userActions } as IUserContext}>{children}</UserContext.Provider>;
};

export { UserContext };
export default UserProvider;
