import { useContext, useEffect, useReducer, useCallback, Dispatch, createContext, ReactNode } from 'react';
import { BigNumber, ethers } from 'ethers';

import { calculateAPR, divDecimal, floorDecimal, mulDecimal, sellFYToken, toBn } from '@yield-protocol/ui-math';

import Decimal from 'decimal.js';
import { ISeriesRoot, ISeries, IAsset, IVault, IStrategy } from '../types';

import { ChainContext } from './ChainContext';

import { EULER_SUPGRAPH_ENDPOINT } from '../utils/constants';
import { SettingsContext } from './SettingsContext';
import { ETH_BASED_ASSETS } from '../config/assets';
import useTimeTillMaturity from '../hooks/useTimeTillMaturity';
import { useAccount } from 'wagmi';
import request from 'graphql-request';
import { Block } from '@ethersproject/providers';
import useChainId from '../hooks/useChainId';
import { IUserContextActions, IUserContextState, UserContextAction, UserState } from './types/user';

const initState: IUserContextState = {
  userLoading: false,
  /* Item maps */
  seriesMap: new Map<string, ISeries>(),

  seriesLoading: true,
  assetsLoading: true,

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

    case UserState.SERIES_LOADING:
      return { ...state, seriesLoading: action.payload };

    case UserState.SERIES:
      return { ...state, seriesMap: new Map([...state.seriesMap, ...action.payload]) };

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
  const { chainLoaded, seriesRootMap, assetRootMap } = chainState;
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const useTenderlyFork = false;

  /* LOCAL STATE */
  const [userState, updateState] = useReducer(userReducer, initState);

  /* HOOKS */
  const chainId = useChainId();
  const { address: account } = useAccount();

  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();

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

            return {
              ...series,
              poolTokens,
              fyTokenBalance,
              poolTokens_: ethers.utils.formatUnits(poolTokens, series.decimals),
              fyTokenBalance_: ethers.utils.formatUnits(fyTokenBalance, series.decimals),
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

  /**
   *
   * When the chainContext is finished loading get the dynamic series and asset.
   * (also on account change)
   *
   * */
  useEffect(() => {
    if (chainLoaded === chainId && seriesRootMap.size) {
      updateSeries(Array.from(seriesRootMap.values()));
    }
  }, [chainId, chainLoaded, seriesRootMap, updateSeries]);

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
