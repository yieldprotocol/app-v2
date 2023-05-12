import { useRouter } from 'next/router';
import { useContext, useEffect, useReducer, useCallback, Dispatch, createContext, ReactNode } from 'react';
import { BigNumber, ethers } from 'ethers';

import { calculateAPR, divDecimal, floorDecimal, mulDecimal, sellFYToken, toBn } from '@yield-protocol/ui-math';

import Decimal from 'decimal.js';
import { IAssetRoot, ISeriesRoot, ISeries, IAsset, IVault, IStrategyRoot, IStrategy } from '../types';
import { ChainContext } from './ChainContext';

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

const initState: IUserContextState = {
  userLoading: false,
  /* Item maps */
  assetMap: new Map<string, IAsset>(),
  seriesMap: new Map<string, ISeries>(),
  strategyMap: new Map<string, IStrategy>(),

  seriesLoading: true,
  assetsLoading: true,
  strategiesLoading: true,

  /* Current User selections */
  selectedSeries: null,
  selectedIlk: null, // initial ilk
  selectedBase: null, // initial base
  selectedVault: null,
  selectedStrategy: null,
  selectedVR: false,
};

const initActions: IUserContextActions = {
  updateSeries: () => null,
  updateAssets: () => null,
  updateStrategies: () => null,
  setSelectedVault: () => null,
  setSelectedIlk: () => null,
  setSelectedSeries: () => null,
  setSelectedBase: () => null,
  setSelectedStrategy: () => null,
  setSelectedVR: () => null,
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
    case UserState.STRATEGIES:
      return { ...state, strategyMap: new Map([...state.strategyMap, ...action.payload]) };

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
    case UserState.SELECTED_VR:
      return { ...state, selectedVR: action.payload };
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

  /* LOCAL STATE */
  const [userState, updateState] = useReducer(userReducer, initState);

  /* HOOKS */
  const chainId = useChainId();
  const { address: account } = useAccountPlus();
  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();

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
          let baseReserves: BigNumber;
          try {
            baseReserves = await series.poolContract.getBaseBalance();
          } catch (error) {
            baseReserves = ZERO_BN;
          }
          /* Get all the data simultanenously in a promise.all */
          const [fyTokenReserves, totalSupply, fyTokenRealReserves] = await Promise.all([
            series.poolContract.getFYTokenBalance(),
            series.poolContract.totalSupply(),
            series.fyTokenContract.balanceOf(series.poolAddress),
          ]);

          let sharesReserves: BigNumber;
          let c: BigNumber | undefined;
          let mu: BigNumber | undefined;
          let currentSharePrice: BigNumber;
          let sharesAddress: string;

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
          let poolStartBlock: Block | undefined;

          try {
            // get pool init block
            const gmFilter = series.poolContract.filters.gm();
            const gm = await series.poolContract.queryFilter(gmFilter, 'earliest');
            poolStartBlock = await gm[0].getBlock();
            currentInvariant = await series.poolContract.invariant();
            initInvariant = await series.poolContract.invariant({ blockTag: poolStartBlock.number });
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
            startBlock: poolStartBlock!,
            balance: ethers.constants.Zero,
            balance_: '0',
          };
        })
      );

      if (account) {
        _accountData = await Promise.all(
          _publicData.map(async (series): Promise<ISeries> => {
            /* Get all the data simultanenously in a promise.all */
            const [poolTokens, balance] = await Promise.all([
              series.poolContract.balanceOf(account),
              series.fyTokenContract.balanceOf(account),
            ]).catch((e) => {
              console.log('Error getting user balances for series: ', series.id);
              return [ZERO_BN, ZERO_BN];
            }); // catch error and return 0 values if error with series

            const poolPercent = mulDecimal(divDecimal(poolTokens, series.totalSupply), '100');
            return {
              ...series,
              poolTokens,
              balance,
              poolTokens_: ethers.utils.formatUnits(poolTokens, series.decimals),
              balance_: ethers.utils.formatUnits(balance, series.decimals),
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
          ]).catch((e: any) => {
            console.log('Error getting strategy data: ', _strategy.name);
            return [ZERO_BN, undefined, undefined];
          });

          // const stratConnected = _strategy.strategyContract.connect(signer);
          // const accountRewards =
          //   _strategy.rewardsRate?.gt(ZERO_BN) && signer ? await stratConnected.callStatic.claim(account) : ZERO_BN;
          // console.log(accountRewards.gt(ZERO_BN) ? accountRewards.toString() : 'no rewards');

          /* We check if the strategy has been supersecced by a v2 version */
          const hasAnUpdatedVersion = _strategy.type === 'V1' && !!_strategy.associatedStrategy;

          /* Attatch the current series (if any) */
          const currentSeries = _seriesList.find((s: ISeriesRoot) =>
            fyToken ? s.address.toLowerCase() === (fyToken as String).toLowerCase() : undefined
          );

          if (currentSeries) {
            const [poolTotalSupply, strategyPoolBalance] = await Promise.all([
              currentSeries.poolContract.totalSupply(),
              currentSeries.poolContract.balanceOf(
                hasAnUpdatedVersion && _strategy.associatedStrategy ? _strategy.associatedStrategy : _strategy.address
              ),
            ]).catch((e: any) => {
              console.log('Error getting current series data: ', _strategy.name);
              return [ZERO_BN, ZERO_BN];
            });

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
              strategyTotalSupply_: ethers.utils.formatUnits(strategyTotalSupply || ZERO_BN, _strategy.decimals),
              poolTotalSupply,
              poolTotalSupply_: ethers.utils.formatUnits(poolTotalSupply, _strategy.decimals),
              strategyPoolBalance,
              strategyPoolBalance_: ethers.utils.formatUnits(strategyPoolBalance, _strategy.decimals),
              strategyPoolPercent,

              currentSeriesAddr: fyToken as string | undefined,
              currentSeries,

              currentPoolAddr: currentPoolAddr as string | undefined,

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
              ]).catch((e: any) => {
                console.log('Error getting current account balance data: ', _strategy.name);
                return [ZERO_BN, ZERO_BN];
              });

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
    }
  }, [account, assetRootMap, seriesRootMap, chainLoaded, chainId, updateAssets, updateSeries]);

  /* update strategy map when series map is fetched */
  useEffect(() => {
    if (chainLoaded === chainId && Array.from(userState.seriesMap?.values()!).length) {
      /*  when series has finished loading,...load/reload strategy data */
      strategyRootMap.size && updateStrategies(Array.from(strategyRootMap.values()));
    }
  }, [strategyRootMap, userState.seriesMap, chainLoaded, chainId, updateStrategies]);

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
    updateStrategies,
    setSelectedVault: useCallback(
      (vault: IVault | null) => updateState({ type: UserState.SELECTED_VAULT, payload: vault! }),
      []
    ),
    setSelectedIlk: useCallback(
      (asset: IAsset | null) => updateState({ type: UserState.SELECTED_ILK, payload: asset! }),
      []
    ),
    setSelectedSeries: useCallback((series: ISeries | null | string) => {
      updateState({ type: UserState.SELECTED_SERIES, payload: series as any });
    }, []),
    setSelectedBase: useCallback(
      (asset: IAsset | null) => updateState({ type: UserState.SELECTED_BASE, payload: asset! }),
      []
    ),
    setSelectedStrategy: useCallback(
      (strategy: IStrategy | null) => updateState({ type: UserState.SELECTED_STRATEGY, payload: strategy! }),
      []
    ),
    setSelectedVR: useCallback((vr: boolean) => {
      updateState({ type: UserState.SELECTED_VR, payload: vr });
      updateState({ type: UserState.SELECTED_SERIES, payload: null });
    }, []),
  } as IUserContextActions;

  return <UserContext.Provider value={{ userState, userActions, updateState }}>{children}</UserContext.Provider>;
};

export { UserContext };
export default UserProvider;
