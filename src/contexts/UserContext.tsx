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
  ISettingsContext,
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
import { useAccount, useNetwork } from 'wagmi';
import { PoolType } from '../config/series';

enum UserState {
  USER_LOADING = 'userLoading',

  VAULT_MAP = 'vaultMap',
  STRATEGY_MAP = 'strategyMap',

  UPDATE_ASSET = 'updateAsset',
  UPDATE_SERIES = 'updateSeries',
  UPDATE_VAULT = 'updateVault',
  UPDATE_STRATEGY = 'updateStrategy',

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

    case UserState.STRATEGY_MAP:
      return { ...state, strategyMap: new Map([...state.strategyMap, ...action.payload]) };

    case UserState.VAULT_MAP:
      return { ...state, vaultMap: new Map([...state.vaultMap, ...action.payload]) };

    case UserState.UPDATE_ASSET:
      return { ...state, assetMap: new Map(state.assetMap.set(action.payload.id, action.payload)) };
    case UserState.UPDATE_SERIES:
      return { ...state, seriesMap: new Map(state.seriesMap.set(action.payload.id, action.payload)) };
    case UserState.UPDATE_VAULT:
      return { ...state, vaultMap: new Map(state.vaultMap.set(action.payload.id, action.payload)) };
    case UserState.UPDATE_STRATEGY:
      return { ...state, strategyMap: new Map(state.strategyMap.set(action.payload.id, action.payload)) };

    case UserState.VAULTS_LOADING:
      return { ...state, vaultsLoading: onlyIfChanged(action) };
    case UserState.SERIES_LOADING:
      return { ...state, seriesLoading: onlyIfChanged(action) };
    case UserState.ASSETS_LOADING:
      return { ...state, assetsLoading: onlyIfChanged(action) };
    case UserState.STRATEGIES_LOADING:
      return { ...state, strategiesLoading: onlyIfChanged(action) };

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
  const { chainId: chainId, contractMap, chainLoaded, seriesRootMap, assetRootMap, strategyRootMap } = chainState;

  const { address: account, isConnecting, isReconnecting, isConnected, isDisconnected } = useAccount();
  const { chain } = useNetwork();

  // useEffect(() => {
  //   console.log(isConnecting, isReconnecting, isConnected, isDisconnected);
  // }, [isConnecting, isReconnecting, isConnected, isDisconnected]);

  const useTenderlyFork = false;

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext) as ISettingsContext;

  /* LOCAL STATE */
  const [userState, updateState] = useReducer(userReducer, initState);
  const [vaultFromUrl, setVaultFromUrl] = useState<string | null>(null);

  /* HOOKS */
  const { pathname } = useRouter();
  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();
  const { tenderlyStartBlock } = useTenderly();

  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    const vaultId = pathname.split('/')[2];
    pathname && userState.vaultMap.has(vaultId) && setVaultFromUrl(vaultId);
  }, [pathname, userState.vaultMap]);

  /* internal function for getting the users vaults */
  const _getVaults = async (fromBlock: number = 1) => {
    console.log('Fetchin vaults.');
    const Cauldron = contractMap.get('Cauldron');
    if (!Cauldron) return new Map();

    const vaultsBuiltFilter = Cauldron.filters.VaultBuilt(null, account, null);
    const vaultsReceivedFilter = Cauldron.filters.VaultGiven(null, account);
    const vaultsBuilt = await Cauldron.queryFilter(vaultsBuiltFilter, fromBlock);

    let vaultsReceived = [];
    try {
      vaultsReceived = await Cauldron.queryFilter(vaultsReceivedFilter);
    } catch (error) {
      console.log('Could not get vaults received.');
    }

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
    const vaultList = [...buildEventList, ...receivedEventsList];

    const newVaultMap = vaultList.reduce((acc: Map<string, IVaultRoot>, item) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, new Map()) as Map<string, IVaultRoot>;

    return newVaultMap;
  };

  /* Updates the assets with relevant *user* data */
  const updateAssets = async (assetList: IAssetRoot[]) => {
    console.log('Updating assets...');
    updateState({ type: UserState.ASSETS_LOADING, payload: true });

    const updatedAssets = await Promise.all(
      assetList.map(async (asset) => {
        const isYieldBase = !!Array.from(seriesRootMap.values()).find((x) => x.baseId === asset?.proxyId);
        const balance = account ? await asset.getBalance(account) : ZERO_BN;
        const newAsset = {
          /* public data */
          ...asset,
          isYieldBase,
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

    // let _publicData: IAssetRoot[] = [];
    // let _accountData: IAsset[] = [];

    // _publicData = await Promise.all(
    //   assetList.map(async (asset): Promise<IAssetRoot> => {
    //     const isYieldBase = !!Array.from(seriesRootMap.values()).find((x) => x.baseId === asset?.proxyId);
    //     return {
    //       ...asset,
    //       isYieldBase,
    //       displaySymbol: asset?.displaySymbol,
    //     };
    //   })
    // );

    // /* add in the dynamic asset data of the assets in the list */
    // if (account) {
    //   try {
    //     _accountData = await Promise.all(
    //       _publicData.map(async (asset): Promise<IAsset> => {
    //         const balance = asset.name !== 'UNKNOWN' ? await asset.getBalance(account) : ZERO_BN;
    //         return {
    //           ...asset,
    //           balance: balance || ethers.constants.Zero,
    //           balance_: balance
    //             ? cleanValue(ethers.utils.formatUnits(balance, asset.decimals), 2)
    //             : cleanValue(ethers.utils.formatUnits(ethers.constants.Zero, asset.decimals)), // for display purposes only
    //         };
    //       })
    //     );
    //   } catch (e) {
    //     console.log(e);
    //   }
    // }
    // const _combinedData = _accountData.length ? _accountData : _publicData;

    // /* reduce the asset list into a new map */
    // const newAssetMap = new Map(
    //   _combinedData.reduce((acc: Map<string, IAssetRoot>, item) => {
    //     const _map = acc;
    //     _map.set(item.id, item);
    //     return _map;
    //   }, new Map())
    // );

    // updateState({ type: UserState.ASSET_MAP, payload: newAssetMap });

    console.log('ASSETS updated (with dynamic data):');
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
          console.log('Using non-TV pool contract that does not include c, mu, and shares');
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

    console.log('SERIES updated (with dynamic data): ');
    console.table(updatedSeries, ['id','displayName', 'baseId', 'seriesIsMature', 'showSeries']);
    updateState({ type: UserState.SERIES_LOADING, payload: false });

    return updatedSeries;
  };



  /* Updates the assets with relevant *user* data */
  const updateStrategies = async (strategyList: IStrategyRoot[]) => {
    console.log('Updating Strategies...');
    updateState({ type: UserState.STRATEGIES_LOADING, payload: true });

    let _publicData: IStrategy[] = [];
    let _accountData: IStrategy[] = [];

    strategyList.length
      ? console.log(' arg list ', strategyList)
      : console.log(' stateList', Array.from(userState.strategyMap.values()));

    _publicData = await Promise.all(
      strategyList.map(async (_strategy): Promise<IStrategy> => {
        console.log(_strategy.address);

        /* Get all the data simultanenously in a promise.all */
        const [strategyTotalSupply, currentSeriesId, currentPoolAddr, nextSeriesId] = await Promise.all([
          _strategy.strategyContract.totalSupply(),
          _strategy.strategyContract.seriesId(),
          _strategy.strategyContract.pool(),
          _strategy.strategyContract.nextSeriesId(),
        ]);

        const currentSeries = userState.seriesMap.get(currentSeriesId) as ISeries;
        const nextSeries = userState.seriesMap.get(nextSeriesId) as ISeries;

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
    const newStrategyMap = new Map(
      _combinedData.reduce((acc: any, item: any) => {
        const _map = acc;
        _map.set(item.address, item);
        return _map;
      }, new Map())
    );

    const combinedMap = newStrategyMap;

    updateState({ type: UserState.STRATEGY_MAP, payload: combinedMap });
    updateState({ type: UserState.STRATEGIES_LOADING, payload: false });
    console.log('STRATEGIES updated (with dynamic data): ', combinedMap);
    return combinedMap;

    // console.log('STRATEGIES updated (with dynamic data): ');
    // console.table(updatedStrategies, ['id']);
    // updateState({ type: UserState.STRATEGIES_LOADING, payload: false });

    // return updatedStrategies;
 
  };

    /* Updates the vaults with *user* data */
    const updateVaults = async (vaultList: IVaultRoot[]) => {
      console.log('Updating vaults...');
  
      try {
        updateState({ type: UserState.VAULTS_LOADING, payload: true });
  
        let _vaultList: IVaultRoot[] = vaultList;
        const Cauldron = contractMap.get('Cauldron');
        const Witch = contractMap.get('Witch');
  
        // const RateOracle = contractMap.get('RateOracle');
  
        /* if vaultList is empty, fetch complete Vaultlist from chain via _getVaults */
        if (vaultList.length === 0) {
          const vaults = await _getVaults();
          _vaultList = Array.from(vaults.values());
        }
  
        /* Add in the dynamic vault data by mapping the vaults list */
        const vaultListMod = await Promise.all(
          _vaultList.map(async (vault): Promise<IVault> => {
            /* Get dynamic vault data */
            const [
              { ink, art },
              { owner, seriesId, ilkId }, // update balance and series (series - because a vault can have been rolled to another series) */
            ] = await Promise.all([Cauldron?.balances(vault.id), Cauldron?.vaults(vault.id)]);
  
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
  
            const series = seriesRootMap.get(seriesId);
  
            let accruedArt: BigNumber;
            let rateAtMaturity: BigNumber;
            let rate: BigNumber;
            let rate_: string;
  
            if (isMature(series.maturity)) {
              const RATE = '0x5241544500000000000000000000000000000000000000000000000000000000'; // bytes for 'RATE'
              const oracleName = ORACLE_INFO.get(chain.id)?.get(vault.baseId)?.get(RATE);
  
              const RateOracle = contractMap.get(oracleName);
              rateAtMaturity = await Cauldron.ratesAtMaturity(seriesId);
              [rate] = await RateOracle.peek(bytesToBytes32(vault.baseId, 6), RATE, '0');
              rate_ = cleanValue(ethers.utils.formatUnits(rate, 18), 2); // always 18 decimals when getting rate from rate oracle
              diagnostics && console.log('mature series : ', seriesId, rate, rateAtMaturity, art);
  
              [accruedArt] = rateAtMaturity.gt(ZERO_BN)
                ? calcAccruedDebt(rate, rateAtMaturity, art)
                : calcAccruedDebt(rate, rate, art);
            } else {
              rate = BigNumber.from('1');
              rate_ = '1';
              rateAtMaturity = BigNumber.from('1');
              accruedArt = art;
            }
  
            diagnostics && console.log('RATE', rate.toString());
            diagnostics && console.log('RATEATMATURITY', rateAtMaturity.toString());
            diagnostics && console.log('ART', art.toString());
            diagnostics && console.log('ACCRUED_ ART', accruedArt.toString());
  
            const baseRoot = assetRootMap.get(vault.baseId);
            const ilkRoot = assetRootMap.get(ilkId);
  
            const ink_ = cleanValue(ethers.utils.formatUnits(ink, ilkRoot.decimals), ilkRoot.digitFormat);
            const art_ = cleanValue(ethers.utils.formatUnits(art, baseRoot.decimals), baseRoot.digitFormat);
  
            const accruedArt_ = cleanValue(ethers.utils.formatUnits(accruedArt, baseRoot.decimals), baseRoot.digitFormat);
  
            diagnostics && console.log(vault.displayName, ' art: ', art.toString());
            diagnostics && console.log(vault.displayName, ' accArt: ', accruedArt.toString());
  
            return {
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
              rateAtMaturity,
              rate,
              rate_,
  
              ink_, // for display purposes only
              art_, // for display purposes only
              accruedArt_, // display purposes
            };
          })
        );
  
        /* Get the previous version (Map) of the vaultMap and update it */
        const newVaultMap = new Map(
          vaultListMod.reduce((acc: Map<string, IVault>, item) => {
            const _map = acc;
            _map.set(item.id, item);
            return _map;
          }, new Map())
        ) as Map<string, IVault>;
  
        /* if there are no vaults provided - assume a forced refresh of all vaults : */
        const combinedVaultMap =
          vaultList.length > 0 ? (new Map([...userState.vaultMap, ...newVaultMap]) as Map<string, IVault>) : newVaultMap;
  
        /* update state */
        updateState({ type: UserState.VAULT_MAP, payload: combinedVaultMap });
        vaultFromUrl && updateState({ type: UserState.SELECTED_VAULT, payload: vaultFromUrl });
  
        updateState({ type: UserState.VAULTS_LOADING, payload: false });
  
        console.log('VAULTS updated (with dynamic data): ', combinedVaultMap);
      } catch (e) {
        console.log('Error getting vaults', e);
      }
    };

  /**
   *
   * When the chainContext is finished loading get the dynamic series, asset and strategies data.
   * ( also on account change )
   *
   * */
  useEffect(() => {
    if (chainLoaded) {
      if (assetRootMap.size) {
        updateAssets(Array.from(assetRootMap.values()));
      }
      if (seriesRootMap.size) {
        updateSeries(Array.from(seriesRootMap.values())).then(() => {
          /* when finished, update strategies */
          updateStrategies(Array.from(strategyRootMap.values()));
        });
      }
      if (account) updateVaults([]);
    }
  }, [chainLoaded, account]);

  /* explicitly update selected series on series map changes */
  useEffect(() => {
    if (userState.selectedSeries) {
      updateState({
        type: UserState.SELECTED_SERIES,
        payload: userState.seriesMap.get(userState.selectedSeries.id),
      });
    }
  }, [userState.selectedSeries, userState.seriesMap]);

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
