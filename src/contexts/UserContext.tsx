import { useRouter } from 'next/router';
import { useContext, useEffect, useReducer, useCallback, useState, Dispatch, createContext, ReactNode } from 'react';
import { BigNumber, ethers } from 'ethers';
import * as contractTypes from '../contracts';

import { multicall } from '@wagmi/core';

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

import { EULER_SUPGRAPH_ENDPOINT, RATE, ZERO_BN } from '../utils/constants';
import { SettingsContext } from './SettingsContext';
import { ETH_BASED_ASSETS } from '../config/assets';
import useTimeTillMaturity from '../hooks/useTimeTillMaturity';
import { useProvider } from 'wagmi';

import request from 'graphql-request';
import { Block } from '@ethersproject/providers';
import useChainId from '../hooks/useChainId';
import useContracts from '../hooks/useContracts';
import { IUserContextActions, IUserContextState, UserContextAction, UserState } from './types/user';
import useFork from '../hooks/useFork';
import { formatUnits } from 'ethers/lib/utils';
import useBalances, { BalanceData } from '../hooks/useBalances';
import useAccountPlus from '../hooks/useAccountPlus';
import { ContractNames } from '../config/contracts';
import { StrategyType } from '../config/strategies';

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

  /* HOOKS */
  const chainId = useChainId();
  const provider = useProvider();

  const { address: account } = useAccountPlus();

  const { pathname } = useRouter();

  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();

  const contracts = useContracts();

  const { forkStartBlock } = useFork();

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
    if (!contracts) return;

    const Cauldron = contracts.get(ContractNames.CAULDRON) as contractTypes.Cauldron;

    const cacheKey = `vaults_${account}_${chainId}`;
    const cachedVaults = JSON.parse(localStorage.getItem(cacheKey)!);
    const cachedVaultList = (cachedVaults ?? []) as IVaultRoot[];

    const lastVaultUpdateKey = `lastVaultUpdate_${account}_${chainId}`;
    // get the latest available vault ( either from the local storage or from the forkStart)
    const lastVaultUpdate = useForkedEnv
      ? forkStartBlock || 'earliest'
      : JSON.parse(localStorage.getItem(lastVaultUpdateKey)!) || 'earliest';

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
  }, [account, chainId, contracts, forkStartBlock, provider, seriesRootMap, useForkedEnv]);

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
          const { balance, balance_ } = _assetBalances.find((a) => a.id.toLowerCase() === asset.id.toLowerCase()) || {
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
        return acc.set(item.id.toLowerCase(), item);
      }, new Map() as Map<string, IAsset>);

      updateState({ type: UserState.ASSETS, payload: newAssetsMap });
      console.log('ASSETS updated (with dynamic data):', newAssetsMap);
      updateState({ type: UserState.ASSETS_LOADING, payload: false });
    },
    [account]
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
          const [baseReserves, fyTokenReserves, totalSupply, fyTokenRealReserves] = (await multicall({
            contracts: [
              {
                address: series.poolContract.address as `0x${string}`,
                abi: series.poolContract.interface as any,
                functionName: 'getBaseBalance',
                args: [],
              },

              {
                address: series.poolContract.address as `0x${string}`,
                abi: series.poolContract.interface as any,
                functionName: 'getFYTokenBalance',
                args: [],
              },
              {
                address: series.poolContract.address as `0x${string}`,
                abi: series.poolContract.interface as any,
                functionName: 'totalSupply',
                args: [],
              },
              {
                address: series.fyTokenContract.address as `0x${string}`,
                abi: series.fyTokenContract.interface as any,
                functionName: 'balanceOf',
                args: [series.poolAddress],
              },
            ],
          })) as unknown as (BigNumber | undefined | null)[];

          let sharesReserves: BigNumber;
          let c: BigNumber | undefined;
          let mu: BigNumber | undefined;
          let currentSharePrice: BigNumber;
          let sharesAddress: string;

          /* This was the case used for Euler pools - no longer used left here for reference */
          if (false) {
            [sharesReserves, c, mu, currentSharePrice, sharesAddress] = (await multicall({
              contracts: [
                {
                  address: series.poolContract.address as `0x${string}`,
                  abi: series.poolContract.interface as any,
                  functionName: 'getSharesBalance',
                  args: [],
                },
                {
                  address: series.poolContract.address as `0x${string}`,
                  abi: series.poolContract.interface as any,
                  functionName: 'getC',
                  args: [],
                },
                {
                  address: series.poolContract.address as `0x${string}`,
                  abi: series.poolContract.interface as any,
                  functionName: 'mu',
                  args: [],
                },
                {
                  address: series.poolContract.address as `0x${string}`,
                  abi: series.poolContract.interface as any,
                  functionName: 'getCurrentSharePrice',
                  args: [],
                },
                {
                  address: series.poolContract.address as `0x${string}`,
                  abi: series.poolContract.interface as any,
                  functionName: 'sharesToken',
                  args: [],
                },
              ],
            })) as unknown as any[];
          } else {
            sharesReserves = baseReserves ?? ZERO_BN;
            currentSharePrice = ethers.utils.parseUnits('1', series.decimals);
            sharesAddress = assetRootMap.get(series.baseId)?.address!;
            diagnostics && console.log('Using old pool contract that does not include c, mu, and shares');
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
            fyTokenReserves || ZERO_BN,
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
          const hideSeries = series.hideSeries; // eg. series.maturity !== 1672412400;

          let currentInvariant: BigNumber | undefined;
          let initInvariant: BigNumber | undefined;
          let poolStartBlock: Block | undefined;

          // try {
          //   // get pool init block
          //   const gmFilter = series.poolContract.filters.gm();
          //   const gm = await series.poolContract.queryFilter(gmFilter, 'earliest');
          //   poolStartBlock = await gm[0].getBlock();
          //   currentInvariant = await series.poolContract.invariant();
          //   initInvariant = await series.poolContract.invariant({ blockTag: poolStartBlock.number });
          // } catch (e) {
          //   diagnostics && console.log('Could not get current and init invariant for series', series.id);
          // }

          return {
            ...series,
            sharesReserves,
            sharesReserves_: ethers.utils.formatUnits(sharesReserves, series.decimals),
            fyTokenReserves: fyTokenReserves || ZERO_BN,
            fyTokenRealReserves: fyTokenRealReserves || ZERO_BN,
            totalSupply: totalSupply || ZERO_BN,
            totalSupply_: totalSupply ? ethers.utils.formatUnits(totalSupply, series.decimals) : '0',
            apr: `${Number(apr).toFixed(2)}`,
            seriesIsMature: isMature(series.maturity),
            c,
            mu,
            poolAPY,
            getShares,
            getBase,
            hideSeries,
            sharesAddress,
            currentInvariant,
            initInvariant,
            startBlock: poolStartBlock!,
          };
        })
      );

      if (account) {
        _accountData = await Promise.all(
          _publicData.map(async (series): Promise<ISeries> => {
            const [poolTokens, fyTokenBalance] = (await multicall({
              contracts: [
                {
                  address: series.poolContract.address as `0x${string}`,
                  abi: series.poolContract.interface as any,
                  functionName: 'balanceOf',
                  args: [account],
                },
                {
                  address: series.fyTokenContract.address as `0x${string}`,
                  abi: series.poolContract.interface as any,
                  functionName: 'balanceOf',
                  args: [account],
                },
              ],
            })) as unknown as BigNumber[];

            const poolPercent = mulDecimal(divDecimal(poolTokens || ZERO_BN, series.totalSupply), '100');

            return {
              ...series,
              poolTokens: poolTokens || ZERO_BN,
              fyTokenBalance: fyTokenBalance || ZERO_BN,
              poolTokens_: ethers.utils.formatUnits(poolTokens || ZERO_BN, series.decimals),
              fyTokenBalance_: ethers.utils.formatUnits(fyTokenBalance || ZERO_BN, series.decimals),
              poolPercent,
            };
          })
        );
      }

      const _combinedData = _accountData.length ? _accountData : _publicData;

      /* Combined account and public series data reduced into a single Map */
      const newSeriesMap = _combinedData.reduce((acc, item) => {
        return acc.set(item.id, item);
      }, new Map() as Map<string, ISeries>);

      updateState({ type: UserState.SERIES, payload: newSeriesMap });
      console.log('SERIES updated (with dynamic data): ', newSeriesMap);
      updateState({ type: UserState.SERIES_LOADING, payload: false });

      return newSeriesMap;
    },
    [account, assetRootMap, diagnostics, getPoolAPY, getTimeTillMaturity, isMature]
  );

  /* Updates the assets with relevant *user* data */
  const updateStrategies = useCallback(
    async (strategyList: IStrategyRoot[], seriesList: ISeries[] = []) => {
      console.log('Updating strategies...', strategyList);
      updateState({ type: UserState.STRATEGIES_LOADING, payload: true });

      const _seriesList = seriesList.length ? seriesList : Array.from(userState.seriesMap.values());

      // let _publicData: IStrategy[] = [];
      const _publicData = await Promise.all(
        strategyList.map(async (_strategy): Promise<IStrategy> => {
          const strategyTotalSupply = await _strategy.strategyContract.totalSupply();
          let currentPoolAddr = undefined;
          let fyToken: any = undefined;

          if (_strategy.type === StrategyType.V2_1 || _strategy.type === StrategyType.V1) {
            [fyToken, currentPoolAddr] = (await multicall({
              contracts: [
                {
                  address: _strategy.strategyContract.address as `0x${string}`,
                  abi: _strategy.strategyContract.interface as any,
                  functionName: 'fyToken',
                  args: [],
                },
                {
                  address: _strategy.strategyContract.address as `0x${string}`,
                  abi: _strategy.strategyContract.interface as any,
                  functionName: 'pool',
                  args: [],
                },
              ],
            })) as unknown as BigNumber[];
          } else if (_strategy.type === StrategyType.V2) {
            currentPoolAddr = await _strategy.strategyContract.pool();
            fyToken = _strategy.associatedSeries;
          }

          // if (_strategy.type === StrategyType.V2_1 || _strategy.type === StrategyType.V1) {
          //   [fyToken, currentPoolAddr] = await Promise.all([
          //     _strategy.strategyContract.fyToken(),
          //     _strategy.strategyContract.pool(),
          //   ]).catch((e: any) => {
          //     console.log('Error getting strategy data: ', _strategy.name);
          //     return [undefined, undefined];
          //   });
          // } else if (_strategy.type === StrategyType.V2) {
          //   fyToken = _strategy.associatedSeries;
          //   currentPoolAddr = await _strategy.strategyContract.pool();
          // }

          /* We check if the strategy has been supersecced by a newer version */
          const hasAnUpdatedVersion = _strategy.type === StrategyType.V2 || _strategy.type === StrategyType.V1;

          /* Attatch the current series (if any) */
          const currentSeries = _seriesList.find((s: ISeriesRoot) =>
            fyToken ? s.address.toLowerCase() === (fyToken as String).toLowerCase() : undefined
          );

          if (currentSeries) {
            const [poolTotalSupply, strategyPoolBalance] = await Promise.all([
              currentSeries.poolContract.totalSupply(),
              currentSeries.poolContract.balanceOf(
                hasAnUpdatedVersion && _strategy.associatedStrategy?.V2_1
                  ? _strategy.associatedStrategy.V2_1
                  : _strategy.address
              ),
            ]).catch((e: any) => {
              console.log('Error getting current series data: ', _strategy.name, _strategy);
              return [ZERO_BN, ZERO_BN];
            });

            const strategyPoolPercent = mulDecimal(divDecimal(strategyPoolBalance, poolTotalSupply), '100');

            /* Get rewards data */
            let rewardsPeriod: { start: number; end: number } | undefined;
            let rewardsRate: BigNumber | undefined;
            let rewardsTokenAddress: string | undefined;

            try {
              const [{ rate }, { start, end }, rewardsToken] = (await multicall({
                contracts: [
                  {
                    address: _strategy.strategyContract.address as `0x${string}`,
                    abi: _strategy.strategyContract.interface as any,
                    functionName: 'rewardsPerToken',
                    args: [],
                  },
                  {
                    address: _strategy.strategyContract.address as `0x${string}`,
                    abi: _strategy.strategyContract.interface as any,
                    functionName: 'rewardsPeriod',
                    args: [],
                  },
                  {
                    address: _strategy.strategyContract.address as `0x${string}`,
                    abi: _strategy.strategyContract.interface as any,
                    functionName: 'rewardsToken',
                    args: [],
                  },
                ],
              })) as unknown as any[];

              rewardsPeriod = { start, end };
              rewardsRate = rate;
              rewardsTokenAddress = rewardsToken;
            } catch (e) {
              console.log(`Could not get any rewards data for strategy with address: ${_strategy.address}`);
              rewardsPeriod = undefined;
              rewardsRate = undefined;
              rewardsTokenAddress = undefined;
            }

            return {
              ..._strategy,
              strategyTotalSupply,
              strategyTotalSupply_: ethers.utils.formatUnits(strategyTotalSupply || ZERO_BN, _strategy.decimals),
              poolTotalSupply,
              poolTotalSupply_: ethers.utils.formatUnits(poolTotalSupply, _strategy.decimals),
              strategyPoolBalance,
              strategyPoolBalance_: ethers.utils.formatUnits(strategyPoolBalance, _strategy.decimals),
              strategyPoolPercent,

              currentSeriesAddr: fyToken as string | undefined,
              currentSeries,
              currentPoolAddr: currentPoolAddr as string | undefined,

              rewardsRate,
              rewardsPeriod,
              rewardsTokenAddress,
            };
          }

          /* Else return an 'EMPTY' strategy */
          return {
            ..._strategy,
            currentSeries: undefined,
          };
        })
      );

      /* Add in account specific data */
      const _accountData = account
        ? await Promise.all(
            _publicData.map(async (_strategy: IStrategy): Promise<IStrategy> => {
              const [accountBalance, accountPoolBalance] = (await multicall({
                contracts: [
                  {
                    address: _strategy.strategyContract.address as `0x${string}`,
                    abi: _strategy.strategyContract.interface as any,
                    functionName: 'balanceOf',
                    args: [account],
                  },
                  {
                    address: _strategy.currentSeries?.poolContract.address as `0x${string}`,
                    abi: _strategy.currentSeries?.poolContract.interface as any,
                    functionName: 'balanceOf',
                    args: [account],
                  },
                ],
              })) as unknown as BigNumber[];

              // const stratConnected = _strategy.strategyContract.connect(signer!);
              // const accountRewards =
              // _strategy.rewardsRate?.gt(ZERO_BN) && signer ? await stratConnected.callStatic.claim(account) : ZERO_BN;
              const accountRewards = ZERO_BN;
              const accountStrategyPercent = mulDecimal(
                divDecimal(accountBalance || ZERO_BN, _strategy.strategyTotalSupply || '0'),
                '100'
              );

              return {
                ..._strategy,
                accountBalance: accountBalance || ZERO_BN,
                accountBalance_: ethers.utils.formatUnits(accountBalance || ZERO_BN, _strategy.decimals),
                accountPoolBalance: accountPoolBalance || ZERO_BN,
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
      if (!contracts) return;

      console.log('Updating vaults ...', account);
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

      /* if fetching vaults fails */
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
            const rateOracleAddr = await Cauldron.lendingOracles(vault.baseId);
            const RateOracle = contractTypes.CompoundMultiOracle__factory.connect(rateOracleAddr, provider); // using compount multi here, but all rate oracles follow the same func sig methodology

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
            isWitchOwner: Witch.address === owner || WitchV1.address === owner, // check if witch is the owner (in liquidation process)
            hasBeenLiquidated,
            isActive: owner.toLowerCase() === account?.toLowerCase(), // refreshed in case owner has been updated
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
    [_getVaults, account, assetRootMap, contracts, diagnostics, isMature, provider, seriesRootMap, useForkedEnv]
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

  // /* If the url references a series/vault...set that one as active */
  // useEffect(() => {
  //   const vaultId = pathname.split('/')[2];
  //   pathname && userState.vaultMap?.has(vaultId);
  // }, [pathname, userState.vaultMap]);

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
