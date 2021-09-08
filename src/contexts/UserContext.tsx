import React, { useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BigNumber, BigNumberish, ethers } from 'ethers';

import { uniqueNamesGenerator, Config, adjectives, animals } from 'unique-names-generator';

import {
  IAssetRoot,
  ISeriesRoot,
  IVaultRoot,
  ISeries,
  IAsset,
  IVault,
  IUserContextState,
  IUserContext,
  ApprovalType,
  IStrategyRoot,
  IStrategy,
} from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, genVaultImage, bytesToBytes32, bnToDecimal18 } from '../utils/appUtils';
import { calculateAPR, divDecimal, floorDecimal, mulDecimal, secondsToFrom, sellFYToken } from '../utils/yieldMath';

import { ONE_WEI_BN, ETH_BASED_ASSETS, BLANK_VAULT, BLANK_SERIES, ZERO_BN } from '../utils/constants';

const UserContext = React.createContext<any>({});

const initState: IUserContextState = {
  userLoading: false,
  /* activeAccount */
  activeAccount: null,
  error: null as string | null,

  /* Item maps */
  assetMap: new Map<string, IAsset>(),
  seriesMap: new Map<string, ISeries>(),
  vaultMap: new Map<string, IVault>(),
  strategyMap: new Map<string, IStrategy>(),
  /* map of asset prices */
  priceMap: new Map<string, Map<string, any>>(),

  vaultsLoading: false as boolean,
  seriesLoading: false as boolean,
  assetsLoading: false as boolean,
  strategiesLoading: false as boolean,
  pricesLoading: false as boolean,

  /* Current User selections */
  selectedSeriesId: null,
  selectedIlkId: null, // initial ilk
  selectedBaseId: null, // initial base
  selectedVaultId: null,
  selectedStrategyAddr: null,

  /* User Settings */
  approvalMethod: ApprovalType.SIG,
  dudeSalt: 20,
  showInactiveVaults: false as boolean,
  slippageTolerance: 0.01 as number,

  hideBalancesSetting: null as string | null,
  currencySetting: 'DAI' as string,
};

const vaultNameConfig: Config = {
  dictionaries: [adjectives, animals],
  separator: ' ',
  length: 2,
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

    case 'error':
      return { ...state, error: onlyIfChanged(action) };

    case 'selectedVaultId':
      return { ...state, selectedVaultId: onlyIfChanged(action) };
    case 'selectedSeriesId':
      return { ...state, selectedSeriesId: onlyIfChanged(action) };
    case 'selectedIlkId':
      return { ...state, selectedIlkId: onlyIfChanged(action) };
    case 'selectedBaseId':
      return { ...state, selectedBaseId: onlyIfChanged(action) };
    case 'selectedStrategyAddr':
      return { ...state, selectedStrategyAddr: onlyIfChanged(action) };

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

    case 'approvalMethod':
      return { ...state, approvalMethod: onlyIfChanged(action) };
    case 'dudeSalt':
      return { ...state, dudeSalt: onlyIfChanged(action) };
    case 'showInactiveVaults':
      return { ...state, showInactiveVaults: onlyIfChanged(action) };
    case 'hideBalancesSetting':
      return { ...state, hideBalancesSetting: onlyIfChanged(action) };
    case 'setSlippageTolerance':
      return { ...state, slippageTolerance: onlyIfChanged(action) };

    case 'pricesLoading':
      return { ...state, pricesLoading: onlyIfChanged(action) };
    case 'vaultsLoading':
      return { ...state, vaultsLoading: onlyIfChanged(action) };
    case 'seriesLoading':
      return { ...state, seriesLoading: onlyIfChanged(action) };
    case 'assetsLoading':
      return { ...state, assetsLoading: onlyIfChanged(action) };
    case 'strategiesLoading':
      return { ...state, strategiesLoading: onlyIfChanged(action) };

    case 'currencySetting':
      return { ...state, currencySetting: onlyIfChanged(action) };

    default:
      return state;
  }
}

const UserProvider = ({ children }: any) => {
  /* STATE FROM CONTEXT */
  // TODO const [cachedVaults, setCachedVaults] = useCachedState('vaults', { data: [], lastBlock: Number(process.env.REACT_APP_DEPLOY_BLOCK) });
  const { chainState } = useContext(ChainContext);
  const { contractMap, account, chainLoading, seriesRootMap, assetRootMap, strategyRootMap } = chainState;

  const [userState, updateState] = useReducer(userReducer, initState);

  /* LOCAL STATE */
  const [vaultFromUrl, setVaultFromUrl] = useState<string | null>(null);

  /* HOOKS */
  const { pathname } = useLocation();

  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    pathname && setVaultFromUrl(pathname.split('/')[2]);
  }, [pathname]);

  /* internal function for getting the users vaults */
  const _getVaults = useCallback(
    async (fromBlock: number = 1) => {
      const Cauldron = contractMap.get('Cauldron');

      const vaultsBuiltFilter = Cauldron.filters.VaultBuilt(null, account);
      const vaultsReceivedfilter = Cauldron.filters.VaultGiven(null, account);

      const [vaultsBuilt, vaultsReceived] = await Promise.all([
        Cauldron.queryFilter(vaultsBuiltFilter, fromBlock),
        Cauldron.queryFilter(vaultsReceivedfilter, fromBlock),
      ]);

      const buildEventList: IVaultRoot[] = vaultsBuilt.map((x: any): IVaultRoot => {
        const { vaultId: id, ilkId, seriesId } = Cauldron.interface.parseLog(x).args;
        const series = seriesRootMap.get(seriesId);
        return {
          id,
          seriesId,
          baseId: series?.baseId,
          ilkId,
          image: genVaultImage(id),
          displayName: uniqueNamesGenerator({ seed: parseInt(id.substring(14), 16), ...vaultNameConfig }),
          decimals: series?.decimals,
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
            baseId: series?.baseId,
            ilkId,
            image: genVaultImage(id),
            displayName: uniqueNamesGenerator({ seed: parseInt(id.substring(14), 16), ...vaultNameConfig }), // TODO Marco move uniquNames generator into utils
            decimals: series?.decimals,
          };
        })
      );

      const vaultList: IVaultRoot[] = [...buildEventList, ...recievedEventsList];

      // TODO const _combined: IVaultRoot[] = [...vaultList, ...cachedVaults];
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

      try {
        _publicData = await Promise.all(
          assetList.map(async (asset: IAssetRoot): Promise<IAssetRoot> => {
            const rate = 'rate';
            return {
              ...asset,
            };
          })
        );

        /* add in the dynamic asset data of the assets in the list */
        if (account) {
          _accountData = await Promise.all(
            _publicData.map(async (asset: IAssetRoot): Promise<IAsset> => {
              const [balance, ladleAllowance, joinAllowance] = await Promise.all([
                asset.getBalance(account),
                asset.getAllowance(account, contractMap.get('Ladle').address),
                asset.getAllowance(account, asset.joinAddress),
              ]);

              const isYieldBase = !!Array.from(seriesRootMap.values()).find((x: any) => x.baseId === asset.id);

              return {
                ...asset,
                isYieldBase,
                hasLadleAuth: ladleAllowance.gt(ethers.constants.Zero),
                hasJoinAuth: joinAllowance.gt(ethers.constants.Zero),
                balance: balance || ethers.constants.Zero,
                balance_: balance
                  ? cleanValue(ethers.utils.formatUnits(balance, asset.decimals), 2)
                  : cleanValue(ethers.utils.formatUnits(ethers.constants.Zero, asset.decimals)), // for display purposes only
              };
            })
          );
        }

        const _combinedData = _accountData.length ? _accountData : _publicData;

        /* get the previous version (Map) of the vaultMap and update it */
        const newAssetMap = new Map(
          _combinedData.reduce((acc: any, item: any) => {
            const _map = acc;
            _map.set(item.id, item);
            return _map;
          }, userState.assetMap)
        );

        updateState({ type: 'assetMap', payload: newAssetMap });
        console.log('ASSETS updated (with dynamic data): ', newAssetMap);
        updateState({ type: 'assetsLoading', payload: false });
      } catch (e) {
        console.log(e);
        updateState({ type: 'error', payload: 'Error updating asset data' });
      }
    },
    [account]
  );

  /* Updates the prices from the oracle with latest data */ // TODO reduce redundant calls
  const updatePrice = useCallback(
    async (base: string, ilk: string): Promise<ethers.BigNumber> => {
      updateState({ type: 'pricesLoading', payload: true });

      try {
        const _priceMap = userState.priceMap;
        const _ilkPriceMap = _priceMap.get(ilk) || new Map<string, any>();

        // set oracle based on whether ILK is ETH-BASED
        const Oracle = ETH_BASED_ASSETS.includes(ilk)
          ? contractMap.get('ChainlinkMultiOracle')
          : contractMap.get('CompositeMultiOracle');

        const [price] = await Oracle.peek(bytesToBytes32(ilk, 6), bytesToBytes32(base, 6), ONE_WEI_BN);

        _ilkPriceMap.set(base, price);
        _priceMap.set(ilk, _ilkPriceMap);

        updateState({ type: 'priceMap', payload: _priceMap });
        console.log('Price Updated: ', ilk, '->', base, ':', price.toString());
        updateState({ type: 'pricesLoading', payload: false });

        return price;
      } catch (error) {
        console.log(error);
        updateState({ type: 'error', payload: false });
        updateState({ type: 'pricesLoading', payload: 'Error updating price data' });
        return ethers.constants.Zero;
      }
    },
    [contractMap, userState.priceMap]
  );

  /* Updates the series with relevant *user* data */
  const updateSeries = useCallback(
    async (seriesList: ISeriesRoot[]) => {
      updateState({ type: 'seriesLoading', payload: true });
      let _publicData: ISeries[] = [];
      let _accountData: ISeries[] = [];

      try {
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
              secondsToFrom(series.maturity.toString())
            );

            console.log(baseReserves.toString(), fyTokenReserves.toString(), _sellRate.toString(), series.baseId);

            const apr =
              calculateAPR(floorDecimal(_sellRate), ethers.utils.parseUnits('1', series.decimals), series.maturity) ||
              '0';

            return {
              ...series,
              baseReserves,
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
        );

        updateState({ type: 'seriesMap', payload: newSeriesMap });
        console.log('SERIES updated (with dynamic data): ', newSeriesMap);
        updateState({ type: 'seriesLoading', payload: false });
        return newSeriesMap;
      } catch (e) {
        console.log(e);
        updateState({ type: 'error', payload: 'Error updating series data' });
      }
    },
    [account]
  ); // TODO oops > sort out this dependency error. (is cyclic)

  /* Updates the vaults with *user* data */
  const updateVaults = useCallback(
    async (vaultList: IVaultRoot[], force: boolean = false) => {
      updateState({ type: 'vaultsLoading', payload: true });
      let _vaultList: IVaultRoot[] = vaultList;
      const Cauldron = contractMap.get('Cauldron');

      try {
        /* if vaultList is empty, fetch complete Vaultlist from chain via _getVaults */
        if (vaultList.length === 0) _vaultList = Array.from((await _getVaults()).values());

        /* Add in the dynamic vault data by mapping the vaults list */
        const vaultListMod = await Promise.all(
          _vaultList.map(async (vault: IVaultRoot): Promise<IVault> => {
            /* update balance and series  ( series - because a vault can have been rolled to another series) */
            const [{ ink, art }, { owner, seriesId, ilkId }, { min: minDebt, max: maxDebt }, price] = await Promise.all(
              [
                await Cauldron.balances(vault.id),
                await Cauldron.vaults(vault.id),
                await Cauldron.debt(vault.baseId, vault.ilkId),
                await updatePrice(vault.baseId, vault.ilkId),
              ]
            );

            const baseRoot: IAssetRoot = assetRootMap.get(vault.baseId);
            const ilkRoot: IAssetRoot = assetRootMap.get(ilkId);

            return {
              ...vault,
              owner, // refreshed in case owner has been updated
              isActive: owner === account,
              seriesId, // refreshed in case seriesId has been updated
              ilkId, // refreshed in case ilkId has been updated
              ink,
              art,
              ink_: cleanValue(ethers.utils.formatUnits(ink, ilkRoot.decimals), ilkRoot.digitFormat), // for display purposes only
              art_: cleanValue(ethers.utils.formatUnits(art, baseRoot.decimals), baseRoot.digitFormat), // for display purposes only
              price,
              price_: cleanValue(ethers.utils.formatUnits(price, 18), baseRoot.digitFormat), // for display purposes only
              minDebt,
              maxDebt,
            };
          })
        );

        /* Get the previous version (Map) of the vaultMap and update it */
        const newVaultMap = new Map(
          vaultListMod.reduce(
            (acc: any, item: any) => {
              const _map = acc;
              _map.set(item.id, item);
              return _map;
            },
            force ? new Map() : userState.vaultMap
          )
        );

        updateState({ type: 'vaultMap', payload: newVaultMap });
        vaultFromUrl && updateState({ type: 'selectedVaultId', payload: vaultFromUrl });

        console.log('VAULTS: ', newVaultMap);
        updateState({ type: 'vaultsLoading', payload: false });
      } catch (e) {
        console.log(e);
        updateState({ type: 'error', payload: 'Error updating vault data' });
      }
    },
    [contractMap, vaultFromUrl, _getVaults]
  );

  /* Updates the assets with relevant *user* data */
  const updateStrategies = useCallback(
    async (strategyList: IStrategyRoot[]) => {
      updateState({ type: 'strategiesLoading', payload: true });
      let _publicData: IStrategy[] = [];
      let _accountData: IStrategy[] = [];

      try {
        _publicData = await Promise.all(
          strategyList.map(async (_strategy: IStrategyRoot): Promise<IStrategy> => {
            /* Get all the data simultanenously in a promise.all */
            const [strategyTotalSupply, currentSeriesId, currentPoolAddr, nextSeriesId] = await Promise.all([
              _strategy.strategyContract.totalSupply(),
              _strategy.strategyContract.seriesId(),
              _strategy.strategyContract.pool(),
              _strategy.strategyContract.nextSeriesId(),
            ]);

            if (seriesRootMap.has(currentSeriesId)) {
              const currentSeries = seriesRootMap.get(currentSeriesId);
              const nextSeries = seriesRootMap.get(nextSeriesId);
              const [poolTotalSupply, strategyPoolBalance] = await Promise.all([
                currentSeries?.poolContract.totalSupply(),
                currentSeries?.poolContract.balanceOf(_strategy.address),
              ]);

              const strategyPoolPercent = mulDecimal(divDecimal(strategyPoolBalance, poolTotalSupply), '100');

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

        updateState({ type: 'strategyMap', payload: newStrategyMap });
        console.log('STRATEGIES updated (with dynamic data): ', newStrategyMap);
        updateState({ type: 'strategiesLoading', payload: false });
        return newStrategyMap;
      } catch (e) {
        console.log(e);
        updateState({ type: 'error', payload: 'Error updating strategy data' });
      }
    },
    [account, seriesRootMap]
  );

  useEffect(() => {
    /* When the chainContext is finished loading get the dynamic series, asset and strategies data */
    if (!chainLoading) {
      seriesRootMap.size && updateSeries(Array.from(seriesRootMap.values()));
      assetRootMap.size && updateAssets(Array.from(assetRootMap.values()));
      strategyRootMap.size && updateStrategies(Array.from(strategyRootMap.values()));
    }
  }, [
    account,
    chainLoading,
    assetRootMap,
    seriesRootMap,
    strategyRootMap,
    updateSeries,
    updateAssets,
    updateStrategies,
  ]);

  useEffect(() => {
    /* When the chainContext is finished loading get the users vault data */
    if (!chainLoading && account !== null) {
      console.log('Checking User Vaults');
      /* trigger update of update all vaults by passing empty array */
      updateVaults([], true);
    }
    /* keep checking the active account when it changes/ chainlaoding */
    updateState({ type: 'activeAccount', payload: account });
  }, [account, chainLoading]); // updateVaults ignored here on purpose

  /* TODO SUBSCRIBE TO EVENTS */
  // useEffect(() => {
  //   !chainLoading &&
  //     seriesRootMap &&
  //     (async () => {
  //       const Oracle = contractMap.get('CompositeMultiOracle');
  //       // const filter = Oracle.filters.SourceSet(null, null, null);
  //       // const eventList = await Oracle.queryFilter(filter, 1);
  //       // console.log('Oracle events: ', eventList);
  //     })();
  // }, [chainLoading, contractMap, seriesRootMap]);

  /* Exposed userActions */
  const userActions = {
    updateSeries,
    updateAssets,
    updateVaults,
    updateStrategies,

    updatePrice,

    setSelectedVault: (vaultId: string | null) => updateState({ type: 'selectedVaultId', payload: vaultId }),
    setSelectedIlk: (assetId: string | null) => updateState({ type: 'selectedIlkId', payload: assetId }),
    setSelectedSeries: (seriesId: string | null) => updateState({ type: 'selectedSeriesId', payload: seriesId }),
    setSelectedBase: (assetId: string | null) => updateState({ type: 'selectedBaseId', payload: assetId }),
    setSelectedStrategy: (strategyAddr: string | null) =>
      updateState({ type: 'selectedStrategyAddr', payload: strategyAddr }),

    // TODO To reduce exposure, maybe we have a single 'change setting' function?  > that handles all the below? not urgent.
    setApprovalMethod: (type: ApprovalType) => updateState({ type: 'approvalMethod', payload: type }),
    updateDudeSalt: () => updateState({ type: 'dudeSalt', payload: userState.dudeSalt + 3 }),
    setShowInactiveVaults: (showInactiveVaults: boolean) =>
      updateState({ type: 'showInactiveVaults', payload: showInactiveVaults }),
    setSlippageTolerance: (slippageTolerance: number) =>
      updateState({ type: 'setSlippageTolerance', payload: slippageTolerance }),
    setHideBalancesSetting: (hideBalancesSetting: string) =>
      updateState({ type: 'hideBalancesSetting', payload: hideBalancesSetting }),
    setCurrencySetting: (currencySetting: string) => updateState({ type: 'currencySetting', payload: currencySetting }),
  };

  return <UserContext.Provider value={{ userState, userActions } as IUserContext}>{children}</UserContext.Provider>;
};

export { UserContext, UserProvider };
