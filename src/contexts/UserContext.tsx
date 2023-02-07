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
import { useAccount, useProvider } from 'wagmi';

import request from 'graphql-request';
import { Block } from '@ethersproject/providers';
import useChainId from '../hooks/useChainId';
import useContracts, { ContractNames } from '../hooks/useContracts';
import { IUserContextActions, IUserContextState, UserContextAction, UserState } from './types/user';
import useFork from '../hooks/useFork';
import { formatUnits, zeroPad } from 'ethers/lib/utils';
import useBalances, { BalanceData } from '../hooks/useBalances';
import { FaBalanceScale } from 'react-icons/fa';

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
    settingsState: { diagnostics, useForkedEnv },
  } = useContext(SettingsContext);

  /* LOCAL STATE */
  const [userState, updateState] = useReducer(userReducer, initState);
  const [vaultFromUrl, setVaultFromUrl] = useState<string | null>(null);

  /* HOOKS */
  const chainId = useChainId();
  const provider = useProvider();
  const { address: account } = useAccount();

  const { pathname } = useRouter();

  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();
  const { getForkStartBlock } = useFork();

  const contracts = useContracts();

  const {
    // data: assetBalances,
    // isLoading: assetsLoading,
    // status: assetsStatus,
    refetch: refetchAssetBalances,
  } = useBalances(
    Array.from(assetRootMap.values()), // asset list : assetRoot[]
    false // enabled : boolean false so that the hook only runs on demand (weh refetch() is called)
  );

  /* TODO consider moving out of here? */
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
    const vaultsBuilt = (await Cauldron.queryFilter(vaultsBuiltFilter!, lastVaultUpdate)) || [];
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
    const vaultsReceived = (await Cauldron.queryFilter(vaultsReceivedFilter, lastVaultUpdate)) || [];
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

      /* refetch the asset balances */
      const _assetBalances = (await refetchAssetBalances()).data as BalanceData[];

      /**
       * NOTE! this block Below is just a place holder for if EVER async updates of assets are required.
       * Those async fetches would go here.
       * */
      const updatedAssets = await Promise.all(
        assetList.map(async (asset) => {
          // get the balance of the asset from the assetsBalance array
          const { balance, balance_ } = _assetBalances.find((a: any) => a.id === asset.id) || {
            balance: ZERO_BN,
            balance_: '0',
          };
          const newAsset = {
            /* public data */
            ...asset,
            balance,
            balance_,
          };
          return newAsset as IAsset;
        })
      );

      const newAssetsMap = updatedAssets.reduce((acc, item) => {
        return acc.set(item.id, item);
      }, new Map() as Map<string, IAsset>);

      updateState({ type: UserState.ASSETS, payload: newAssetsMap });
      console.log('ASSETS updated (with dynamic data):', newAssetsMap);
      updateState({ type: UserState.ASSETS_LOADING, payload: false });
    },
    [account]
  );

  /* Updates the assets with relevant *user* data */
  const updateStrategies = useCallback(
    async (strategyList: IStrategyRoot[], seriesList: ISeries[] = []) => {
      console.log('Updating strategies...');
      updateState({ type: UserState.STRATEGIES_LOADING, payload: true });

      const _seriesList = seriesList.length ? seriesList : Array.from(userState.seriesMap.values());

      // let _publicData: IStrategy[] = [];
      const _publicData = await Promise.all(
        strategyList.map(async (_strategy): Promise<IStrategy> => {
          /* Get all the data simultanenously in a promise.all */
          const [strategyTotalSupply, fyToken, currentPoolAddr] = await Promise.all([
            _strategy.strategyContract.totalSupply(),
            _strategy.strategyContract.fyToken(),
            _strategy.strategyContract.pool(),
          ]);

          /* We check if the strategy has been supersecced by a v2 version */
          const hasAnUpdatedVersion = _strategy.type === 'V1' && !!_strategy.associatedStrategy;

          /* Attatch the current series (if any) */
          const currentSeries = _seriesList.find((s: ISeriesRoot) => s.address === fyToken) as ISeries;
          if (currentSeries) {
            const [poolTotalSupply, strategyPoolBalance] = await Promise.all([
              currentSeries.poolContract.totalSupply(),
              currentSeries.poolContract.balanceOf(
                hasAnUpdatedVersion && _strategy.associatedStrategy ? _strategy.associatedStrategy : _strategy.address
              ),
            ]);
            const strategyPoolPercent = mulDecimal(divDecimal(strategyPoolBalance, poolTotalSupply), '100');

            /* get rewards data */
            let rewardsPeriod: { start: number; end: number } | undefined;
            let rewardsRate: BigNumber | undefined;
            let rewardsTokenAddress: string | undefined;

            try {
              const [{ rate }, { start, end }, rewardsToken] = await Promise.all([
                _strategy.strategyContract.rewardsPerToken(),
                _strategy.strategyContract.rewardsPeriod(),
                _strategy.strategyContract.rewardsToken(),
              ]);
              rewardsPeriod = { start, end };
              rewardsRate = rate;
              rewardsTokenAddress = rewardsToken;
            } catch (e) {
              console.log(`Could not get rewards data for strategy with address: ${_strategy.address}`);
              rewardsPeriod = undefined;
              rewardsRate = undefined;
              rewardsTokenAddress = undefined;
            }

            /* Decide if stragtegy should be 'active' */
            const isActive = _strategy.type === 'V2' || _strategy.type === 'V1'; // && !_strategy.associatedStrategy)

            return {
              ..._strategy,
              strategyTotalSupply,
              strategyTotalSupply_: ethers.utils.formatUnits(strategyTotalSupply, _strategy.decimals),
              poolTotalSupply,
              poolTotalSupply_: ethers.utils.formatUnits(poolTotalSupply, _strategy.decimals),
              strategyPoolBalance,
              strategyPoolBalance_: ethers.utils.formatUnits(strategyPoolBalance, _strategy.decimals),
              strategyPoolPercent,

              currentSeriesAddr: fyToken,
              currentSeries,

              currentPoolAddr,

              active: isActive,
              rewardsRate,
              rewardsPeriod,
              rewardsTokenAddress,
            };
          }

          /* Else return an 'EMPTY' strategy */
          return {
            ..._strategy,
            currentSeries: undefined,
            active: false,
          };
        })
      );

      /* Add in account specific data */
      const _accountData = account
        ? await Promise.all(
            _publicData.map(async (_strategy: IStrategy): Promise<IStrategy> => {
              const [accountBalance, accountPoolBalance] = await Promise.all([
                _strategy.strategyContract.balanceOf(account),
                _strategy.currentSeries?.poolContract.balanceOf(account),
              ]);

              // const stratConnected = _strategy.strategyContract.connect(signer!);
              // const accountRewards =
              // _strategy.rewardsRate?.gt(ZERO_BN) && signer ? await stratConnected.callStatic.claim(account) : ZERO_BN;

              const accountRewards = ZERO_BN;
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
                accountRewards: accountRewards,
                accountRewards_: formatUnits(accountRewards, _strategy.decimals),
              };
            })
          )
        : [];

      const _combinedData = account ? _accountData : _publicData; // .filter( (s:IStrategy) => s.active) ; // filter out strategies with no current series

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
      const WitchV1 = contracts.get(ContractNames.WITCH) as contractTypes.Witch;
      const Witch = contracts.get(ContractNames.WITCHV2) as contractTypes.WitchV2;

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

          const liquidationEvents = !useForkedEnv
            ? await Promise.all([
                WitchV1.queryFilter(Witch.filters.Bought(bytesToBytes32(vault.id, 12), null, null, null)),
                Witch.queryFilter(Witch.filters.Bought(bytesToBytes32(vault.id, 12), null, null, null)),
              ])
            : [];
          const hasBeenLiquidated = liquidationEvents.flat().length > 0;

          let accruedArt: BigNumber;
          let rateAtMaturity: BigNumber;
          let rate: BigNumber;

          if (isVaultMature) {
            const RATE = '0x5241544500000000000000000000000000000000000000000000000000000000'; // bytes for 'RATE'
            const oracleName = ORACLE_INFO.get(chainId)?.get(vault.baseId)?.get(RATE);

            const RateOracle = contracts.get(oracleName!);
            rateAtMaturity = await Cauldron.ratesAtMaturity(seriesId);
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
            isWitchOwner: Witch.address === owner || WitchV1.address === owner, // check if witch is the owner (in liquidation process)
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
    [_getVaults, account, assetRootMap, chainId, contracts, diagnostics, isMature, seriesRootMap, useForkedEnv]
  );

  /**
   *
   * When the chainContext is finished loading get the dynamic series and asset.
   * (also on account change)
   *
   * */
  useEffect(() => {
    if (chainLoaded === chainId && assetRootMap.size && seriesRootMap.size) {
      updateAssets(Array.from(assetRootMap.values()));
      updateSeries(Array.from(seriesRootMap.values()));
      account && updateVaults();
    }
  }, [account, assetRootMap, seriesRootMap, chainLoaded, chainId, updateAssets, updateSeries, updateVaults]);

  /* update strategy map when series map is fetched */
  useEffect(() => {
    if (chainLoaded === chainId && Array.from(userState.seriesMap?.values()!).length) {
      /*  when series has finished loading,...load/reload strategy data */
      strategyRootMap.size && updateStrategies(Array.from(strategyRootMap.values()));
    }
  }, [strategyRootMap, userState.seriesMap, chainLoaded, chainId, updateStrategies]);

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
