import React, { useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BigNumber, ethers } from 'ethers';

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
} from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, genVaultImage, bytesToBytes32 } from '../utils/appUtils';
import { calculateAPR, divDecimal, floorDecimal, mulDecimal, secondsToFrom, sellFYToken } from '../utils/yieldMath';

import { ONE_WEI_BN, ETH_BASED_ASSETS } from '../utils/constants';

const UserContext = React.createContext<any>({});

const initState: IUserContextState = {
  userLoading: false,
  /* activeAccount */
  activeAccount: null,

  /* Item maps */
  assetMap: new Map<string, IAsset>(),
  seriesMap: new Map<string, ISeries>(),
  vaultMap: new Map<string, IVault>(),

  /* map of asset prices */
  priceMap: new Map<string, Map<string, any>>(),
  pricesLoading: false as boolean,

  /* Current User selections */
  selectedSeriesId: null,
  selectedIlkId: null, // initial ilk
  selectedBaseId: null, // initial base
  selectedVaultId: null,

  /* User Settings */
  approvalMethod: ApprovalType.SIG,
  dudeSalt: 20,
  showInactiveVaults: false as boolean,
  slippageTolerance: 0.01 as number,
  vaultsLoading: false as boolean,
  seriesLoading: false as boolean,
  assetsLoading: false as boolean,
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
    case 'selectedVaultId':
      return { ...state, selectedVaultId: onlyIfChanged(action) };
    case 'selectedSeriesId':
      return { ...state, selectedSeriesId: onlyIfChanged(action) };
    case 'selectedIlkId':
      return { ...state, selectedIlkId: onlyIfChanged(action) };
    case 'selectedBaseId':
      return { ...state, selectedBaseId: onlyIfChanged(action) };
    case 'assetMap':
      return { ...state, assetMap: onlyIfChanged(action) };
    case 'seriesMap':
      return { ...state, seriesMap: onlyIfChanged(action) };
    case 'vaultMap':
      return { ...state, vaultMap: onlyIfChanged(action) };
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
  const { contractMap, account, chainLoading, seriesRootMap, assetRootMap } = chainState;

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
          baseId: series.baseId,
          ilkId,
          image: genVaultImage(id),
          displayName: uniqueNamesGenerator({ seed: parseInt(id.substring(14), 16), ...vaultNameConfig }),
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
            baseId: series.baseId,
            ilkId,
            image: genVaultImage(id),
            displayName: uniqueNamesGenerator({ seed: parseInt(id.substring(14), 16), ...vaultNameConfig }), // TODO Marco move uniquNames generator into utils
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
        try {
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
                  ? cleanValue(ethers.utils.formatEther(balance), 2)
                  : cleanValue(ethers.utils.formatEther(ethers.constants.Zero)), // for display purposes only
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
        }, userState.assetMap)
      );

      updateState({ type: 'assetMap', payload: newAssetMap });
      console.log('ASSETS updated (with dynamic data): ', newAssetMap);
      updateState({ type: 'assetsLoading', payload: false });
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

        console.log(price.toString());

        _ilkPriceMap.set(base, price);
        _priceMap.set(ilk, _ilkPriceMap);

        updateState({ type: 'priceMap', payload: _priceMap });
        console.log('Price Updated: ', ilk, '->', base, ':', price.toString());
        updateState({ type: 'pricesLoading', payload: false });

        return price;
      } catch (error) {
        console.log(error);
        updateState({ type: 'pricesLoading', payload: false });
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

          const apr =
            calculateAPR(floorDecimal(_sellRate), ethers.utils.parseUnits('1', series.decimals), series.maturity) ||
            '0';

          return {
            ...series,
            baseReserves,
            fyTokenReserves,
            fyTokenRealReserves,
            totalSupply,
            totalSupply_: ethers.utils.formatEther(totalSupply),
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
              poolTokens_: ethers.utils.formatEther(poolTokens),
              fyTokenBalance_: ethers.utils.formatEther(fyTokenBalance),
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
    },
    [account]
  ); // TODO oops > sort out this dependency error. (is cyclic)

  /* Updates the vaults with *user* data */
  const updateVaults = useCallback(
    async (vaultList: IVaultRoot[], force: boolean = false) => {
      updateState({ type: 'vaultsLoading', payload: true });
      let _vaultList: IVaultRoot[] = vaultList;
      const Cauldron = contractMap.get('Cauldron');

      /* if vaultList is empty, fetch complete Vaultlist from chain via _getVaults */
      if (vaultList.length === 0) _vaultList = Array.from((await _getVaults()).values());

      /* Add in the dynamic vault data by mapping the vaults list */
      const vaultListMod = await Promise.all(
        _vaultList.map(async (vault: IVaultRoot): Promise<IVault> => {
          /* update balance and series  ( series - because a vault can have been rolled to another series) */
          const [{ ink, art }, { owner, seriesId, ilkId }, { min, max }, price] = await Promise.all([
            await Cauldron.balances(vault.id),
            await Cauldron.vaults(vault.id),
            await Cauldron.debt(vault.baseId, vault.ilkId),
            await updatePrice(vault.baseId, vault.ilkId),
          ]);

          return {
            ...vault,
            owner,
            isActive: owner === account,
            seriesId, // in case seriesId has been updated
            ilkId, // in case ilkId has been updated
            ink,
            art,
            ink_: cleanValue(ethers.utils.formatEther(ink), 2), // for display purposes only
            art_: cleanValue(ethers.utils.formatEther(art), 2), // for display purposes only
            price,
            price_: cleanValue(ethers.utils.formatEther(price), 2),
            min,
            max,
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
    },
    [contractMap, vaultFromUrl, _getVaults]
  );

  useEffect(() => {
    /* When the chainContext is finished loading get the dynamic series and asset data */
    if (!chainLoading) {
      Array.from(seriesRootMap.values()).length && updateSeries(Array.from(seriesRootMap.values()));
      Array.from(assetRootMap.values()).length && updateAssets(Array.from(assetRootMap.values()));
    }
  }, [account, chainLoading, assetRootMap, updateAssets, seriesRootMap, updateSeries]);

  useEffect(() => {
    /* When the chainContext is finished loading get the users vault data */
    if (account !== null && !chainLoading) {
      console.log('checking vaults');
      /* trigger update of update all vaults by passing empty array */
      updateVaults([], true);
    }
  }, [account, chainLoading]);

  /* Subscribe to vault event listeners */
  useEffect(() => {
    updateState({ type: 'activeAccount', payload: account });
  }, [account]);

  /* TODO Subscribe to oracle price changes */
  useEffect(() => {
    !chainLoading &&
      seriesRootMap &&
      (async () => {
        const Oracle = contractMap.get('CompositeMultiOracle');
        // const filter = Oracle.filters.SourceSet(null, null, null);
        // const eventList = await Oracle.queryFilter(filter, 1);
        // console.log('Oracle events: ', eventList);
      })();
  }, [chainLoading, contractMap, seriesRootMap]);

  /* Exposed userActions */
  const userActions = {
    updateSeries,
    updateAssets,
    updateVaults,

    updatePrice,

    setSelectedVault: (vaultId: string | null) => updateState({ type: 'selectedVaultId', payload: vaultId }),
    setSelectedIlk: (assetId: string | null) => updateState({ type: 'selectedIlkId', payload: assetId }),
    setSelectedSeries: (seriesId: string | null) => updateState({ type: 'selectedSeriesId', payload: seriesId }),
    setSelectedBase: (assetId: string | null) => updateState({ type: 'selectedBaseId', payload: assetId }),

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
