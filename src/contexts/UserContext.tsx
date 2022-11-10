import { useRouter } from 'next/router';
import { useContext, useEffect, useReducer, useCallback, useState, Dispatch, createContext, ReactNode } from 'react';
import { BigNumber, ethers } from 'ethers';
import * as contractTypes from '../contracts';

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
import { IAssetRoot, ISeriesRoot, IVaultRoot, ISeries, IAsset, IVault, IStrategyRoot, IStrategy } from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, generateVaultName } from '../utils/appUtils';

import { EULER_SUPGRAPH_ENDPOINT, ZERO_BN } from '../utils/constants';
import { SettingsContext } from './SettingsContext';
import { ETH_BASED_ASSETS } from '../config/assets';
import { ORACLE_INFO } from '../config/oracles';
import useTimeTillMaturity from '../hooks/useTimeTillMaturity';
import useTenderly from '../hooks/useTenderly';
import { useAccount, useBalance } from 'wagmi';
import request from 'graphql-request';
import { Block } from '@ethersproject/providers';
import useChainId from '../hooks/useChainId';
import useDefaulProvider from '../hooks/useDefaultProvider';
import useContracts, { ContractNames } from '../hooks/useContracts';
import { IUserContextActions, IUserContextState, UserContextAction, UserState } from './types/user';

const initState: IUserContextState = {
  userLoading: false,
  /* Item maps */
  assetMap: new Map<string, IAsset>(),
  seriesMap: new Map<string, ISeries>(),
  vaultMap: new Map<string, IVault>(),
  strategyMap: new Map<string, IStrategy>(),

  vaultsLoading: true,
  seriesLoading: true,
  assetsLoading: true,
  strategiesLoading: true,

  /* Current User selections */
  selectedSeries: null,
  selectedIlk: null, // initial ilk
  selectedBase: null, // initial base
  selectedVault: null,
  selectedStrategy: null,

  selectedIlkBalance: null,
  selectedBaseBalance: null,
};

const initActions: IUserContextActions = {
  updateSeries: () => null,
  updateAssets: () => null,
  updateVaults: () => null,
  updateStrategies: () => null,
  setSelectedVault: () => null,
  setSelectedIlk: () => null,
  setSelectedSeries: () => null,
  setSelectedBase: () => null,
  setSelectedStrategy: () => null,
};

const UserContext = createContext<{
  userState: IUserContextState;
  updateState: Dispatch<UserContextAction>;
  userActions: IUserContextActions;
}>({
  userState: initState,
  userActions: initActions,
  updateState: () => undefined,
});

function userReducer(state: IUserContextState, action: UserContextAction): IUserContextState {
  switch (action.type) {
    case UserState.USER_LOADING:
      return { ...state, userLoading: action.payload };

    case UserState.VAULTS_LOADING:
      return { ...state, vaultsLoading: action.payload };
    case UserState.SERIES_LOADING:
      return { ...state, seriesLoading: action.payload };
    case UserState.ASSETS_LOADING:
      return { ...state, assetsLoading: action.payload };
    case UserState.STRATEGIES_LOADING:
      return { ...state, strategiesLoading: action.payload };

    case UserState.ASSETS:
      return { ...state, assetMap: new Map([...state.assetMap, ...action.payload]) };
    case UserState.SERIES:
      return { ...state, seriesMap: new Map([...state.seriesMap, ...action.payload]) };
    case UserState.VAULTS:
      return { ...state, vaultMap: new Map([...state.vaultMap, ...action.payload]) };
    case UserState.STRATEGIES:
      return { ...state, strategyMap: new Map([...state.strategyMap, ...action.payload]) };

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

      case UserState.SELECTED_ILK_BALANCE:
        return { ...state, selectedIlkBalance: action.payload };
      case UserState.SELECTED_BASE_BALANCE:
        return { ...state, selectedBaseBalance: action.payload };

    case UserState.SELECTED_STRATEGY:
      return { ...state, selectedStrategy: action.payload };
    default:
      return state;
  }
}

const UserProvider = ({ children }: { children: ReactNode }) => {
  /* STATE FROM CONTEXT */
  const { chainState } = useContext(ChainContext);
  const { chainLoaded, seriesRootMap, assetRootMap, strategyRootMap } = chainState;
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const useTenderlyFork = false;

  /* LOCAL STATE */
  const [userState, updateState] = useReducer(userReducer, initState);
  const [vaultFromUrl, setVaultFromUrl] = useState<string | null>(null);

  /* HOOKS */
  const { address: account } = useAccount();
  const chainId = useChainId();
  const provider = useDefaulProvider();

  const { pathname } = useRouter();
  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();
  const { tenderlyStartBlock } = useTenderly();
  const contracts = useContracts();

  /* watch the selectedBase and selectedIlk */
  const { data: baseBalance, isLoading: baseLoading, status: baseStatus, refetch:refetchBase } = useBalance({
    addressOrName: account,
    token: userState.selectedBase?.address,
    enabled: !!account && userState.selectedBase !== null,
    cacheTime: 10_000,
  });

  const { data: ilkBalance, isLoading: ilkLoading, status: ilkStatus, refetch:refetchIlk } = useBalance({
    addressOrName: account,
    token: userState.selectedIlk?.address,
    enabled: !!account && userState.selectedIlk !== null,
    cacheTime: 10_000,
  });

  /* TODO consider moving out of here ? */
  const getPoolAPY = useCallback(
    async (sharesTokenAddr: string) => {
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
    },
    [diagnostics]
  );

  /* internal function for getting the users vaults */
  const _getVaults = useCallback(async () => {
    const Cauldron = contracts.get(ContractNames.CAULDRON) as contractTypes.Cauldron;

    const cacheKey = `vaults_${account}_${chainId}`;
    const cachedVaults = JSON.parse(localStorage.getItem(cacheKey)!);
    const cachedVaultList = (cachedVaults ?? []) as IVaultRoot[];

    const lastVaultUpdateKey = `lastVaultUpdate_${account}_${chainId}`;
    const lastVaultUpdate = JSON.parse(localStorage.getItem(lastVaultUpdateKey)!) || 'earliest';

    /* Get a list of the vaults that were BUILT */
    const vaultsBuiltFilter = Cauldron.filters.VaultBuilt(null, account, null);
    const vaultsBuilt = await Cauldron.queryFilter(vaultsBuiltFilter!, lastVaultUpdate);
    const buildEventList = vaultsBuilt.map((x) => {
      const { vaultId: id, ilkId, seriesId } = x.args;
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

    /* Get a list of the vaults that were RECEIVED */
    const vaultsReceivedFilter = Cauldron.filters.VaultGiven(null, account);
    const vaultsReceived = await Cauldron.queryFilter(vaultsReceivedFilter, lastVaultUpdate);
    const receivedEventsList = await Promise.all(
      vaultsReceived.map(async (x): Promise<IVaultRoot> => {
        const { vaultId: id } = x.args;
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

    /* all vaults */
    const allVaultList = [...buildEventList, ...receivedEventsList, ...cachedVaultList];

    /* Cache results */
    const latestBlock = (await provider.getBlockNumber()).toString();
    allVaultList.length && localStorage.setItem(cacheKey, JSON.stringify(allVaultList));
    allVaultList.length && localStorage.setItem(lastVaultUpdateKey, latestBlock);

    return allVaultList;
  }, [account, chainId, contracts, provider, seriesRootMap]);

  /* Updates the assets with relevant *user* data */
  const updateAssets = useCallback(
    async (assetList: IAssetRoot[]) => {
      console.log('Updating assets...');
      updateState({ type: UserState.ASSETS_LOADING, payload: true });
      
      /* refetch the selected base ilk balances */
      account && refetchBase();
      account && refetchIlk(); 

      const updatedAssets = await Promise.all(
        assetList.map(async (asset) => {
          const newAsset = {
            /* public data */
            ...asset,
            displaySymbol: asset?.displaySymbol,
          };
          return newAsset as IAsset;
        })
      );

      const newAssetsMap = updatedAssets.reduce((acc, item) => {
        return acc.set(item.id, item);
      }, new Map() as Map<string, IAsset>);

      updateState({ type: UserState.ASSETS, payload: newAssetsMap });

      diagnostics && console.log('ASSETS updated (with dynamic data):');
      updateState({ type: UserState.ASSETS_LOADING, payload: false });
    },
    [diagnostics]
  );

  /* Updates the series with relevant *user* data */
  const updateSeries = useCallback(
    async (seriesList: ISeriesRoot[]): Promise<Map<string, ISeries>> => {
      updateState({ type: UserState.SERIES_LOADING, payload: true });
      let _publicData: ISeries[] = [];
      let _accountData: ISeries[] = [];

      /* Add in the dynamic series data of the series in the list */
      _publicData = await Promise.all(
        seriesList.map(async (series): Promise<ISeries> => {
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
          let sharesAddress: string | undefined;

          try {
            [sharesReserves, c, mu, currentSharePrice, sharesAddress] = await Promise.all([
              series.poolContract.getSharesBalance(),
              series.poolContract.getC(),
              series.poolContract.mu(),
              series.poolContract.getCurrentSharePrice(),
              series.poolContract.sharesToken(),
            ]);
          } catch (error) {
            sharesReserves = baseReserves;
            currentSharePrice = ethers.utils.parseUnits('1', series.decimals);
            sharesAddress = series.baseAddress;
            console.log('Using old pool contract that does not include c, mu, and shares');
          }

          // convert base amounts to shares amounts (baseAmount is wad)
          const getShares = (baseAmount: BigNumber) =>
            toBn(
              new Decimal(baseAmount.toString())
                .mul(10 ** series.decimals)
                .div(new Decimal(currentSharePrice?.toString()!))
            );

          // convert shares amounts to base amounts
          const getBase = (sharesAmount: BigNumber) =>
            toBn(
              new Decimal(sharesAmount.toString())
                .mul(new Decimal(currentSharePrice?.toString()!))
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
          const poolAPY = sharesAddress ? await getPoolAPY(sharesAddress) : undefined;

          // some logic to decide if the series is shown or not
          // const showSeries = series.maturity !== 1672412400;
          const showSeries = true;

          let currentInvariant: BigNumber | undefined;
          let initInvariant: BigNumber | undefined;
          let startBlock: Block | undefined;

          try {
            // get pool init block
            const gmFilter = series.poolContract.filters.gm();
            const gm = (await series.poolContract.queryFilter(gmFilter))[0];
            startBlock = await gm.getBlock();

            currentInvariant = await series.poolContract.invariant();
            initInvariant = await series.poolContract.invariant({ blockTag: startBlock.number });
          } catch (e) {
            diagnostics && console.log('Could not get current and init invariant for series', series.id);
          }

          return {
            ...series,
            sharesReserves,
            sharesReserves_: ethers.utils.formatUnits(sharesReserves, series.decimals),
            fyTokenReserves,
            fyTokenRealReserves,
            totalSupply,
            totalSupply_: ethers.utils.formatUnits(totalSupply, series.decimals),
            apr: `${Number(apr).toFixed(2)}`,
            seriesIsMature: isMature(series.maturity),
            c,
            mu,
            poolAPY,
            getShares,
            getBase,
            showSeries,
            sharesAddress,
            currentInvariant,
            initInvariant,
            startBlock: startBlock!,
            ts: BigNumber.from(series.ts),
          };
        })
      );

      if (account) {
        _accountData = await Promise.all(
          _publicData.map(async (series): Promise<ISeries> => {
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
      const newSeriesMap = _combinedData.reduce((acc, item) => {
        return acc.set(item.id, item);
      }, new Map() as Map<string, ISeries>);

      updateState({ type: UserState.SERIES, payload: newSeriesMap });
      console.log('SERIES updated (with dynamic data): ', newSeriesMap);
      updateState({ type: UserState.SERIES_LOADING, payload: false });

      return newSeriesMap;
    },
    [account, diagnostics, getPoolAPY, getTimeTillMaturity, isMature]
  );

  /* Updates the assets with relevant *user* data */
  const updateStrategies = useCallback(
    async (strategyList: IStrategyRoot[]) => {
      updateState({ type: UserState.STRATEGIES_LOADING, payload: true });

      let _publicData: IStrategy[] = [];
      let _accountData: IStrategy[] = [];

      _publicData = await Promise.all(
        strategyList.map(async (_strategy): Promise<IStrategy> => {
          /* Get all the data simultanenously in a promise.all */
          const [strategyTotalSupply, currentSeriesId, currentPoolAddr, nextSeriesId] = await Promise.all([
            _strategy.strategyContract.totalSupply(),
            _strategy.strategyContract.seriesId(),
            _strategy.strategyContract.pool(),
            _strategy.strategyContract.nextSeriesId(),
          ]);

          const currentSeries = userState.seriesMap?.get(currentSeriesId) as ISeries;
          const nextSeries = userState.seriesMap?.get(nextSeriesId) as ISeries;

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
      const newStrategyMap = _combinedData.reduce((acc, item) => {
        return acc.set(item.address, item);
      }, new Map() as Map<string, IStrategy>);

      updateState({ type: UserState.STRATEGIES, payload: newStrategyMap });
      updateState({ type: UserState.STRATEGIES_LOADING, payload: false });

      console.log('STRATEGIES updated (with dynamic data): ', newStrategyMap);

      return newStrategyMap;
    },
    [account, userState.seriesMap] // userState.strategyMap excluded on purpose
  );

  /* Updates the vaults with *user* data */
  const updateVaults = useCallback(
    async (vaultList: IVaultRoot[] = []) => {
      console.log('Updating vaults...');
      updateState({ type: UserState.VAULTS_LOADING, payload: true });

      let _vaults: IVaultRoot[] | undefined = vaultList;
      const Cauldron = contracts.get(ContractNames.CAULDRON) as contractTypes.Cauldron;
      const Witch = contracts.get(ContractNames.WITCH) as contractTypes.Witch;

      /**
       * if vaultList is empty, clear local app memory and fetch complete Vaultlist from chain via _getVaults */
      if (vaultList.length === 0) {
        updateState({ type: UserState.CLEAR_VAULTS });
        _vaults = await _getVaults();
      }

      if (!_vaults) return;

      const updatedVaults = await Promise.all(
        _vaults.map(async (vault) => {
          const [
            { ink, art },
            { owner, seriesId, ilkId }, // update balance and series (series - because a vault can have been rolled to another series) */
          ] = await Promise.all([Cauldron?.balances(vault.id), Cauldron?.vaults(vault.id)]);

          const series = seriesRootMap.get(seriesId);
          if (!series) return;

          const isVaultMature = isMature(series.maturity);

          /* If art 0, check for liquidation event */
          const hasBeenLiquidated =
            art === ZERO_BN
              ? (await Witch?.queryFilter(
                  Witch?.filters.Auctioned(bytesToBytes32(vault.id, 12), null),
                  useTenderlyFork && tenderlyStartBlock ? tenderlyStartBlock : 'earliest',
                  'latest'
                ))!.length > 0
              : false;

          let accruedArt: BigNumber;
          let rateAtMaturity: BigNumber;
          let rate: BigNumber;

          if (isVaultMature) {
            const RATE = '0x5241544500000000000000000000000000000000000000000000000000000000'; // bytes for 'RATE'
            const oracleName = ORACLE_INFO.get(chainId)?.get(vault.baseId)?.get(RATE);

            const RateOracle = contracts.get(oracleName!);
            rateAtMaturity = await Cauldron?.ratesAtMaturity(seriesId);
            [rate] = await RateOracle?.peek(bytesToBytes32(vault.baseId, 6), RATE, '0');

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
            isWitchOwner: Witch?.address === owner, // check if witch is the owner (in liquidation process)
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
            ink_: cleanValue(ethers.utils.formatUnits(ink, ilkRoot?.decimals), ilkRoot?.digitFormat), // for display purposes only
            art_: cleanValue(ethers.utils.formatUnits(art, baseRoot?.decimals), baseRoot?.digitFormat), // for display purposes only
            accruedArt_: cleanValue(ethers.utils.formatUnits(accruedArt, baseRoot?.decimals), baseRoot?.digitFormat), // display purposes
          };

          return newVault;
        })
      );

      const newVaultMap = updatedVaults.reduce((acc, item) => {
        if (item) {
          return acc.set(item.id, item);
        }
        return acc;
      }, new Map() as Map<string, IVault>);
      updateState({ type: UserState.VAULTS, payload: newVaultMap });

      diagnostics && console.log('Vaults updated successfully.');
      updateState({ type: UserState.VAULTS_LOADING, payload: false });
    },
    [
      _getVaults,
      account,
      assetRootMap,
      chainId,
      contracts,
      diagnostics,
      isMature,
      seriesRootMap,
      tenderlyStartBlock,
      useTenderlyFork,
    ]
  );

  /**
   *
   * When the chainContext is finished loading get the dynamic series and asset.
   * (also on account change)
   *
   * */
  useEffect(() => {
    if (chainLoaded) {
      updateAssets(Array.from(assetRootMap.values()));
      updateSeries(Array.from(seriesRootMap.values()));

      account && updateVaults();
    }
  }, [chainLoaded, account, assetRootMap, seriesRootMap, strategyRootMap, updateAssets, updateSeries, updateVaults]);

  /* update strategy map when series map is fetched */
  useEffect(() => {
    if (chainLoaded && Array.from(userState.seriesMap?.values()!).length) {
      /*  when series has finished loading,...load/reload strategy data */
      updateStrategies(Array.from(strategyRootMap.values()));
    }
  }, [chainLoaded, strategyRootMap, userState.seriesMap]);

  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    const vaultId = pathname.split('/')[2];
    pathname && userState.vaultMap?.has(vaultId) && setVaultFromUrl(vaultId);
  }, [pathname, userState.vaultMap]);

  /**
   * Explicitly update selected series on series map changes
   * */
  useEffect(() => {
    if (userState.selectedSeries && userState.seriesMap) {
      updateState({
        type: UserState.SELECTED_SERIES,
        payload: userState.seriesMap.get(userState.selectedSeries.id)!,
      });
    }
  }, [userState.selectedSeries, userState.seriesMap]);

  /* update selected asset balances */
  useEffect(() => {
    account && console.log( 'Selected Base Balance updated', baseBalance?.formatted )
    account && updateState({
        type: UserState.SELECTED_BASE_BALANCE,
        payload: baseBalance,
      });
  }, [baseBalance]);

  useEffect(() => {
    account && console.log( 'Selected Ilk Balance updated', ilkBalance?.formatted  )
      account && updateState({
        type: UserState.SELECTED_ILK_BALANCE,
        payload: ilkBalance,
      });
  }, [ilkBalance]);

  /* Exposed userActions */
  const userActions = {
    updateSeries,
    updateAssets,
    updateVaults,
    updateStrategies,

    setSelectedVault: useCallback(
      (vault: IVault | null) => updateState({ type: UserState.SELECTED_VAULT, payload: vault! }),
      []
    ),
    setSelectedIlk: useCallback(
      (asset: IAsset | null) => updateState({ type: UserState.SELECTED_ILK, payload: asset! }),
      []
    ),
    setSelectedSeries: useCallback(
      (series: ISeries | null) => updateState({ type: UserState.SELECTED_SERIES, payload: series! }),
      []
    ),
    setSelectedBase: useCallback(
      (asset: IAsset | null) => updateState({ type: UserState.SELECTED_BASE, payload: asset! }),
      []
    ),
    setSelectedStrategy: useCallback(
      (strategy: IStrategy | null) => updateState({ type: UserState.SELECTED_STRATEGY, payload: strategy! }),
      []
    ),
  } as IUserContextActions;

  return <UserContext.Provider value={{ userState, userActions, updateState }}>{children}</UserContext.Provider>;
};

export { UserContext };
export default UserProvider;
