import React, { useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ethers } from 'ethers';

import { uniqueNamesGenerator, Config, adjectives, animals } from 'unique-names-generator';

import { IAssetRoot, ISeriesRoot, IVaultRoot, ISeries, IAsset, IVault, IUserContextState, IUserContext, ApprovalType } from '../types';

import { ChainContext } from './ChainContext';
import { cleanValue, genVaultImage } from '../utils/displayUtils';
import { calculateAPR, divDecimal, floorDecimal, mulDecimal, secondsToFrom, sellFYToken } from '../utils/yieldMath';

const UserContext = React.createContext<any>({});

const initState : IUserContextState = {
  /* activeAccount */
  activeAccount: null,
  /* Item maps */
  assetMap: new Map<string, IAsset>(),
  seriesMap: new Map<string, ISeries>(),
  vaultMap: new Map<string, IVault>(),

  /* Current User selections */
  selectedSeriesId: null,
  selectedIlkId: null, // initial ilk
  selectedBaseId: null, // initial base
  selectedVaultId: null,

  /* User Settings */
  approvalMethod: ApprovalType.SIG,

};

const vaultNameConfig: Config = {
  dictionaries: [adjectives, animals],
  separator: '-',
  length: 2,
};

function userReducer(state:any, action:any) {
  /* Helper: only change the state if different from existing */ // TODO if even reqd.?
  const onlyIfChanged = (_action: any) => (
    state[action.type] === _action.payload
      ? state[action.type]
      : _action.payload
  );

  /* Reducer switch */
  switch (action.type) {
    case 'userLoading': return { ...state, seriesLoading: onlyIfChanged(action) };
    case 'activeAccount': return { ...state, activeAccount: onlyIfChanged(action) };

    case 'selectedVaultId': return { ...state, selectedVaultId: onlyIfChanged(action) };
    case 'selectedSeriesId': return { ...state, selectedSeriesId: onlyIfChanged(action) };
    case 'selectedIlkId': return { ...state, selectedIlkId: onlyIfChanged(action) };
    case 'selectedBaseId': return { ...state, selectedBaseId: onlyIfChanged(action) };

    case 'assetMap': return { ...state, assetMap: onlyIfChanged(action) };
    case 'seriesMap': return { ...state, seriesMap: onlyIfChanged(action) };
    case 'vaultMap': return { ...state, vaultMap: onlyIfChanged(action) };

    case 'approvalMethod': return { ...state, approvalMethod: onlyIfChanged(action) };

    default: return state;
  }
}

const UserProvider = ({ children }:any) => {
  /* STATE FROM CONTEXT */
  // TODO const [cachedVaults, setCachedVaults] = useCachedState('vaults', { data: [], lastBlock: Number(process.env.REACT_APP_DEPLOY_BLOCK) });
  const { chainState } = useContext(ChainContext);
  const {
    contractMap,
    account,
    chainLoading,
    seriesRootMap,
    assetRootMap,
  } = chainState;

  const [userState, updateState] = useReducer(userReducer, initState);

  /* LOCAL STATE */
  const [vaultFromUrl, setVaultFromUrl] = useState<string|null>(null);

  /* HOOKS */
  const { pathname } = useLocation();

  /* If the url references a series/vault...set that one as active */
  useEffect(() => {
    pathname && setVaultFromUrl(pathname.split('/')[2]);
  }, [pathname]);

  /* internal function for getting the users vaults */
  const _getVaults = useCallback(async (fromBlock:number = 1) => {
    const Cauldron = contractMap.get('Cauldron');
    const filter = Cauldron.filters.VaultBuilt(null, account);
    const eventList = await Cauldron.queryFilter(filter, fromBlock);

    console.log(eventList);
    // const eventList = await Cauldron.queryFilter(filter, cachedVaults.lastBlock);
    const vaultList : IVaultRoot[] = await Promise.all(eventList.map(async (x:any) : Promise<IVaultRoot> => {
      const { vaultId: id, ilkId, seriesId } = Cauldron.interface.parseLog(x).args;
      const series = seriesRootMap.get(seriesId);
      // const baseId = assetRootMap.get(series.baseId);

      return {
        id,
        seriesId,
        baseId: series.baseId,
        ilkId,
        image: genVaultImage(id),
        displayName: uniqueNamesGenerator({ seed: parseInt(id.substring(14), 16), ...vaultNameConfig }),
      };
    }));

    // TODO const _combined: IVaultRoot[] = [...vaultList, ...cachedVaults];
    const newVaultMap = vaultList.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, new Map()) as Map<string, IVaultRoot>;

    return newVaultMap;
    /* Update the local cache storage */
    // TODO setCachedVaults({ data: Array.from(newVaultMap.values()), lastBlock: await fallbackProvider.getBlockNumber() });
  }, [account, contractMap, seriesRootMap]);

  /* Updates the assets with relevant *user* data */
  const updateAssets = useCallback(async (assetList: IAssetRoot[]) => {
    let _publicData : IAssetRoot[] = [];
    let _accountData : IAsset[] = [];

    _publicData = await Promise.all(
      assetList.map(async (asset:IAssetRoot) : Promise<IAssetRoot> => {
        const rate = 'rate';
        return {
          ...asset,
        };
      }),
    );

    /* add in the dynamic asset data of the assets in the list */
    if (account) {
      _accountData = await Promise.all(
        _publicData.map(async (asset:IAssetRoot) : Promise<IAsset> => {
          const balance = await asset.getBalance(account);
          return {
            ...asset,
            balance: balance || ethers.constants.Zero,
            balance_: balance
              ? cleanValue(ethers.utils.formatEther(balance), 2)
              : cleanValue(ethers.utils.formatEther(ethers.constants.Zero)), // for display purposes only
          };
        }),
      );
    }

    const _combinedData = _accountData.length ? _accountData : _publicData;

    /* get the previous version (Map) of the vaultMap and update it */
    const newAssetMap = new Map(_combinedData.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.assetMap));

    updateState({ type: 'assetMap', payload: newAssetMap });
    console.log('ASSETS updated (with dynamic data): ', newAssetMap);
  }, [account]);

  /* Updates the series with relevant *user* data */
  const updateSeries = useCallback(async (seriesList: ISeriesRoot[]) => {
    let _publicData : ISeries[] = [];
    let _accountData : ISeries[] = [];

    /* Add in the dynamic series data of the series in the list */
    _publicData = await Promise.all(
      seriesList.map(async (series:ISeriesRoot) : Promise<ISeries> => {
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
          ethers.utils.parseEther('1'),
          secondsToFrom(series.maturity.toString()),
        );
        const apr = calculateAPR(floorDecimal(_sellRate), ethers.utils.parseEther('1'), series.maturity) || '0';
        // const { symbol } = assetRootMap.get(series.baseId);
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
      }),
    );

    if (account) {
      _accountData = await Promise.all(
        _publicData.map(async (series:ISeries) : Promise<ISeries> => {
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
        }),
      );
    }

    const _combinedData = _accountData.length ? _accountData : _publicData;

    /* combined account and public series data reduced into a single Map */
    const newSeriesMap = new Map(_combinedData.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, userState.seriesMap));

    updateState({ type: 'seriesMap', payload: newSeriesMap });
    console.log('SERIES updated (with dynamic data): ', newSeriesMap);
    return newSeriesMap;
  }, [account]); // TODO oops > sort out this dependency error. (is cyclic)

  /* Updates the vaults with *user* data */
  const updateVaults = useCallback(async (vaultList: IVaultRoot[]) => {
    let _vaultList: IVaultRoot[] = vaultList;
    const Cauldron = contractMap.get('Cauldron');

    /* if vaultList is empty, fetch complete Vaultlist from chain via _getVaults */
    if (vaultList.length === 0) _vaultList = Array.from((await _getVaults()).values());

    /* add in the dynamic vault data by mapping the vaults list */
    const vaultListMod = await Promise.all(
      _vaultList.map(async (vault:IVaultRoot) : Promise<IVault> => {
        /* update balance and series  ( series - because a vault can have been rolled to another series) */
        const [{ ink, art }, { seriesId }] = await Promise.all([
          await Cauldron.balances(vault.id),
          await Cauldron.vaults(vault.id),
        ]);

        return {
          ...vault,
          seriesId,
          ink,
          art,
          ink_: cleanValue(ethers.utils.formatEther(ink), 2), // for display purposes only
          art_: cleanValue(ethers.utils.formatEther(art), 2), // for display purposes only
        };
      }),
    );

    /* Get the previous version (Map) of the vaultMap and update it */
    const newVaultMap = new Map(vaultListMod.reduce((acc:any, item:any) => {
      const _map = acc;
      _map.set(item.id, item);
      return _map;
    }, new Map()));

    updateState({ type: 'vaultMap', payload: newVaultMap });
    vaultFromUrl && updateState({ type: 'selectedVaultId', payload: vaultFromUrl });

    console.log('VAULTS: ', newVaultMap);
  }, [contractMap, vaultFromUrl, _getVaults]);

  useEffect(() => {
    /* When the chainContext is finished loading get the dynamic series and asset data */
    if (!chainLoading) {
      Array.from(seriesRootMap.values()).length && updateSeries(Array.from(seriesRootMap.values()));
      Array.from(assetRootMap.values()).length && updateAssets(Array.from(assetRootMap.values()));
    }
  }, [
    account,
    chainLoading,
    assetRootMap, updateAssets,
    seriesRootMap, updateSeries,
  ]);

  useEffect(() => {
    /* When the chainContext is finished loading get the users vault data */
    if (account !== null && !chainLoading) {
      /* trigger update of update all vaults by passing empty array */
      updateVaults([]);
    }
  }, [
    account, chainLoading,
    updateVaults,
  ]);

  /* Subscribe to vault event listeners */
  useEffect(() => {
    updateState({ type: 'activeAccount', payload: account });
  }, [account]);

  /* Exposed userActions */
  const userActions = {
    updateSeries,
    updateAssets,
    updateVaults,
    setSelectedVault: (vaultId:string|null) => updateState({ type: 'selectedVaultId', payload: vaultId }),
    setSelectedIlk: (assetId:string|null) => updateState({ type: 'selectedIlkId', payload: assetId }),
    setSelectedSeries: (seriesId:string|null) => updateState({ type: 'selectedSeriesId', payload: seriesId }),
    setSelectedBase: (assetId:string|null) => updateState({ type: 'selectedBaseId', payload: assetId }),

    setApprovalMethod: (type:ApprovalType) => updateState(
      { type: 'approvalMethod', payload: type },
    ),
  };

  return (
    <UserContext.Provider value={{ userState, userActions } as IUserContext}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
