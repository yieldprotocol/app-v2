import React, { createContext, Dispatch, ReactNode, useCallback, useEffect, useReducer } from 'react';
import { BigNumber, Contract } from 'ethers';
import { format } from 'date-fns';

import { useCachedState } from '../hooks/generalHooks';

import yieldEnv from './yieldEnv.json';
import * as contractTypes from '../contracts';
import { IAssetRoot, ISeriesRoot, IStrategyRoot, TokenType } from '../types';
import { ASSETS_1, ASSETS_42161 } from '../config/assets';

import { nameFromMaturity, getSeason, SeasonType } from '../utils/appUtils';

import { ethereumColorMap, arbitrumColorMap } from '../config/colors';

import markMap from '../config/marks';
import YieldMark from '../components/logos/YieldMark';

import { SERIES_1, SERIES_42161 } from '../config/series';
import { toast } from 'react-toastify';
import useChainId from '../hooks/useChainId';
import useDefaulProvider from '../hooks/useDefaultProvider';
import useContracts, { ContractNames } from '../hooks/useContracts';
import { ChainContextActions, ChainState, IChainContextActions, IChainContextState } from './types/chain';
import { UserState } from './types/user';

const initState: IChainContextState = {
  /* flags */
  chainLoaded: 0,
  assetRootMap: new Map<string, IAssetRoot>(),
  seriesRootMap: new Map<string, ISeriesRoot>(),
  strategyRootMap: new Map<string, IStrategyRoot>(),
};

const initActions: IChainContextActions = {
  exportContractAddresses: () => null,
};

/* Build the context */
const ChainContext = createContext<{
  chainState: IChainContextState;
  updateState: Dispatch<ChainContextActions>;
  chainActions: IChainContextActions;
}>({
  chainState: initState,
  chainActions: initActions,
  updateState: () => undefined,
});

function chainReducer(state: IChainContextState, action: ChainContextActions): IChainContextState {
  /* Reducer switch */
  switch (action.type) {
    case ChainState.CHAIN_LOADED:
      return { ...state, chainLoaded: action.payload };

    case ChainState.ADD_SERIES:
      return {
        ...state,
        seriesRootMap: new Map(state.seriesRootMap.set(action.payload.id, action.payload)),
      };

    case ChainState.ADD_ASSET:
      return {
        ...state,
        assetRootMap: new Map(state.assetRootMap.set(action.payload.id, action.payload)),
      };

    case ChainState.ADD_STRATEGY:
      return {
        ...state,
        strategyRootMap: new Map(state.strategyRootMap.set(action.payload.address, action.payload)),
      };

    case ChainState.CLEAR_MAPS:
      return initState;

    default: {
      return state;
    }
  }
}

const ChainProvider = ({ children }: { children: ReactNode }) => {
  const [chainState, updateState] = useReducer(chainReducer, initState);

  /* HOOKS */
  const provider = useDefaulProvider();
  const chainId = useChainId();
  const contracts = useContracts();

  /* SIMPLE CACHED VARIABLES */
  const [lastAppVersion, setLastAppVersion] = useCachedState('lastAppVersion', '');

  /* add on extra/calculated ASSET info and contract instances  (no async) */
  const _chargeAsset = useCallback(
    (asset: any, chain: number) => {
      /* attach either contract, (or contract of the wrappedToken ) */

      let assetContract: Contract;
      let getAllowance: (acc: string, spender: string, asset?: string) => Promise<BigNumber>;
      let setAllowance: ((spender: string) => Promise<BigNumber | void>) | undefined;

      const assetMap = chain === 1 ? ASSETS_1 : ASSETS_42161;

      switch (asset.tokenType) {
        case TokenType.ERC20_:
          assetContract = contractTypes.ERC20__factory.connect(asset.address, provider);
          getAllowance = async (acc: string, spender: string) => assetContract.allowance(acc, spender);
          break;

        case TokenType.ERC1155_:
          assetContract = contractTypes.ERC1155__factory.connect(asset.address, provider);
          getAllowance = async (acc: string, spender: string) => assetContract.isApprovedForAll(acc, spender);
          setAllowance = async (spender: string) => {
            console.log(spender);
            console.log(asset.address);
            assetContract.setApprovalForAll(spender, true);
          };
          break;

        default:
          // Default is ERC20Permit;
          assetContract = contractTypes.ERC20Permit__factory.connect(asset.address, provider);
          getAllowance = async (acc: string, spender: string) => assetContract.allowance(acc, spender);
          break;
      }

      return {
        ...asset,
        digitFormat: assetMap.get(asset.id)?.digitFormat || 6,
        image: asset.tokenType !== TokenType.ERC1155_ ? markMap.get(asset.displaySymbol) : markMap.get('Notional'),

        assetContract,

        /* re-add in the wrap handler addresses when charging, because cache doesn't preserve map */
        wrapHandlerAddresses: assetMap.get(asset.id)?.wrapHandlerAddresses,
        unwrapHandlerAddresses: assetMap.get(asset.id)?.unwrapHandlerAddresses,

        getAllowance,
        setAllowance,
      };
    },
    [provider]
  );

  const _getAssets = useCallback(
    async (chain: number) => {
      // handle cache
      const cacheKey = `assets_${chain}`;
      const cachedValues = JSON.parse(localStorage.getItem(cacheKey)!);

      if (cachedValues !== null && cachedValues.length) {
        console.log('Yield Protocol ASSET data retrieved ::: CACHE :::');
        return cachedValues.forEach((a: IAssetRoot) => {
          updateState({ type: ChainState.ADD_ASSET, payload: _chargeAsset(a, chain) });
        });
      }

      const assetMap = chain === 1 ? ASSETS_1 : ASSETS_42161;
      const newAssetList: any[] = [];

      await Promise.all(
        Array.from(assetMap).map(async (x) => {
          const id = x[0];
          const assetInfo = x[1];

          let { name, symbol, decimals, version } = assetInfo;

          /* On first load checks & corrects the ERC20 name/symbol/decimals (if possible ) */
          if (
            assetInfo.tokenType === TokenType.ERC20_ ||
            assetInfo.tokenType === TokenType.ERC20_Permit ||
            assetInfo.tokenType === TokenType.ERC20_DaiPermit
          ) {
            const contract = contractTypes.ERC20__factory.connect(assetInfo.assetAddress, provider);
            try {
              [name, symbol, decimals] = await Promise.all([contract.name(), contract.symbol(), contract.decimals()]);
            } catch (e) {
              console.log(
                id,
                ': ERC20 contract auto-validation unsuccessfull. Please manually ensure symbol and decimals are correct.'
              );
            }
          }
          /* checks & corrects the version for ERC20Permit/ DAI permit tokens */
          if (assetInfo.tokenType === TokenType.ERC20_Permit || assetInfo.tokenType === TokenType.ERC20_DaiPermit) {
            const contract = contractTypes.ERC20Permit__factory.connect(assetInfo.assetAddress, provider);
            try {
              version = await contract.version();
            } catch (e) {
              console.log(
                id,
                ': contract VERSION auto-validation unsuccessfull. Please manually ensure version is correct.'
              );
            }
          }

          /* check if an unwrapping handler is provided, if so, the token is considered to be a wrapped token */
          const isWrappedToken = assetInfo.unwrapHandlerAddresses?.has(chain);
          /* check if a wrapping handler is provided, if so, wrapping is required */
          const wrappingRequired = assetInfo.wrapHandlerAddresses?.has(chain);

          const newAsset = {
            ...assetInfo,
            id,
            address: assetInfo.assetAddress,
            name,
            symbol,
            decimals,
            version,

            /* Redirect the id/join if required due to using wrapped tokens */
            joinAddress: assetInfo.joinAddress, // assetInfo.proxyId ? joinMap.get(assetInfo.proxyId) : joinMap.get(id),

            isWrappedToken,
            wrappingRequired,
            proxyId: assetInfo.proxyId || id, // set proxyId  (or as baseId if undefined)

            /* Default setting of assetInfo fields if required */
            displaySymbol: assetInfo.displaySymbol || symbol,
            showToken: assetInfo.showToken || false,
          };

          updateState({ type: ChainState.ADD_ASSET, payload: _chargeAsset(newAsset, chain) });
          newAssetList.push(newAsset);
        })
      ).catch(() => console.log('Problems getting Asset data. Check addresses in asset config.'));

      console.log('Yield Protocol Asset data updated successfully.');

      /* cache results */
      newAssetList.length && localStorage.setItem(cacheKey, JSON.stringify(newAssetList));
      newAssetList.length && console.log('Yield Protocol Asset data retrieved successfully.');
    },
    [_chargeAsset, provider]
  );

  /* add on extra/calculated ASYNC series info and contract instances */
  const _chargeSeries = useCallback(
    (series: ISeriesRoot, chain: number): ISeriesRoot => {
      /* contracts need to be added in again in when charging because the cached state only holds strings */
      const poolContract = contractTypes.Pool__factory.connect(series.poolAddress, provider);
      const fyTokenContract = contractTypes.FYToken__factory.connect(series.fyTokenAddress, provider);
      const seasonColorMap = [1, 4, 5, 42].includes(chain) ? ethereumColorMap : arbitrumColorMap;
      const season = getSeason(series.maturity);
      const oppSeason = (_season: SeasonType) => getSeason(series.maturity + 23670000);
      const [startColor, endColor, textColor] = seasonColorMap.get(season)!;
      const [oppStartColor, oppEndColor, oppTextColor] = seasonColorMap.get(oppSeason(season))!;

      return {
        ...series,

        poolContract,
        fyTokenContract,

        fullDate: format(new Date(series.maturity * 1000), 'dd MMMM yyyy'),
        displayName: format(new Date(series.maturity * 1000), 'dd MMM yyyy'),
        displayNameMobile: `${nameFromMaturity(series.maturity, 'MMM yyyy')}`,

        season,
        startColor,
        endColor,
        color: `linear-gradient(${startColor}, ${endColor})`,
        textColor,

        oppStartColor,
        oppEndColor,
        oppTextColor,
        seriesMark: <YieldMark colors={[startColor, endColor]} />,
      };
    },
    [provider]
  );

  const _getSeries = useCallback(
    async (chain: number) => {
      // handle cache
      const cacheKey = `series_${chain}`;
      const cachedValues = JSON.parse(localStorage.getItem(cacheKey)!);

      if (cachedValues !== null && cachedValues.length) {
        console.log('Yield Protocol SERIES data retrieved ::: CACHE :::');
        return cachedValues.forEach((s: ISeriesRoot) => {
          updateState({ type: ChainState.ADD_SERIES, payload: _chargeSeries(s, chain) });
        });
      }

      const seriesMap = chain === 1 ? SERIES_1 : SERIES_42161;
      const newSeriesList: ISeriesRoot[] = [];

      await Promise.all(
        Array.from(seriesMap).map(async (x) => {
          const id = x[0];
          const fyTokenAddress = x[1].fyTokenAddress;
          const poolAddress = x[1].poolAddress;
          const Cauldron = contracts.get(ContractNames.CAULDRON) as contractTypes.Cauldron;

          const { maturity, baseId } = await Cauldron.series(id);
          const poolContract = contractTypes.Pool__factory.connect(poolAddress, provider);
          const fyTokenContract = contractTypes.FYToken__factory.connect(fyTokenAddress, provider);

          const [name, symbol, version, decimals, poolName, poolVersion, poolSymbol, ts, g1, g2, baseAddress] =
            await Promise.all([
              fyTokenContract.name(),
              fyTokenContract.symbol(),
              fyTokenContract.version(),
              fyTokenContract.decimals(),
              poolContract.name(),
              poolContract.version(),
              poolContract.symbol(),
              poolContract.ts(),
              poolContract.g1(),
              poolContract.g2(),
              poolContract.base(),
            ]);

          const newSeries = {
            id,
            baseId,
            maturity,
            name,
            symbol,
            version,
            address: fyTokenAddress,
            fyTokenAddress,
            decimals,
            poolAddress,
            poolVersion,
            poolName,
            poolSymbol,
            ts: BigNumber.from(ts),
            g1,
            g2,
            baseAddress,
          } as ISeriesRoot;

          updateState({ type: ChainState.ADD_SERIES, payload: _chargeSeries(newSeries, chain) });
          newSeriesList.push(newSeries);
        })
      ).catch(() => console.log('Problems getting Series data. Check addresses in series config.'));

      console.log('Yield Protocol Series data updated successfully.');
      /* cache results */
      newSeriesList.length && localStorage.setItem(cacheKey, JSON.stringify(newSeriesList));
      newSeriesList.length && console.log('Yield Protocol Series data retrieved successfully.');
    },
    [_chargeSeries, contracts, provider]
  );

  /* Attach contract instance */
  const _chargeStrategy = useCallback(
    (strategy: any) => {
      const Strategy = contractTypes.Strategy__factory.connect(strategy.address, provider);
      return {
        ...strategy,
        strategyContract: Strategy,
      };
    },
    [provider]
  );

  /* Iterate through the strategies list and update accordingly */
  const _getStrategies = useCallback(
    async (chain: number) => {
      /**
       * IF: the CACHE is empty then, get fetch asset data for chainId and cache it:
       * */
      const cacheKey = `strategies_${chain}`;
      const cachedValues = JSON.parse(localStorage.getItem(cacheKey)!);

      const newStrategyList: any[] = [];
      const strategyList: string[] = (yieldEnv.strategies as any)[chain];

      if (cachedValues !== null && cachedValues.length) {
        console.log('Yield Protocol STRATEGY data retrieved ::: CACHE :::');
        return cachedValues.forEach((st: IStrategyRoot) => {
          updateState({ type: ChainState.ADD_STRATEGY, payload: _chargeStrategy(st) });
        });
      }

      try {
        await Promise.all(
          strategyList.map(async (strategyAddr) => {
            /* if the strategy is NOT already in the cache : */
            const Strategy = contractTypes.Strategy__factory.connect(strategyAddr, provider);
            const [name, symbol, baseId, decimals, version] = await Promise.all([
              Strategy.name(),
              Strategy.symbol(),
              Strategy.baseId(),
              Strategy.decimals(),
              Strategy.version(),
            ]);

            const newStrategy = {
              id: strategyAddr,
              address: strategyAddr,
              symbol,
              name,
              version,
              baseId,
              decimals,
            };
            // update state and cache
            updateState({ type: ChainState.ADD_STRATEGY, payload: _chargeStrategy(newStrategy) });
            newStrategyList.push(newStrategy);
          })
        );
      } catch (e) {
        console.log('Error fetching strategies', e);
      }

      /* cache results */
      newStrategyList.length && localStorage.setItem(cacheKey, JSON.stringify(newStrategyList));
      newStrategyList.length && console.log('Yield Protocol Strategy data retrieved successfully.');
    },
    [_chargeStrategy, provider]
  );

  const _getProtocolData = useCallback(
    async (chain: number) => {
      /* Clear maps in local app memory  ( note: this is not the cache ) and set chainLoaded false */
      updateState({ type: ChainState.CLEAR_MAPS });

      console.log('Fetching Protocol contract addresses for chain Id: ', chain);
      console.log('Checking for new Assets and Series, and Strategies : ', chain);

      await Promise.all([_getAssets(chain), _getSeries(chain), _getStrategies(chain)])
        .catch(() => {
          toast.error('Error getting Yield Protocol data.');
          console.log('Error getting Yield Protocol data.');
        })
        .finally(() => {
          updateState({ type: ChainState.CHAIN_LOADED, payload: chainId });
        });
    },
    [_getAssets, _getSeries, _getStrategies]
  );

  /**
   * Handle version updates on first load -> complete refresh if app is different to published version
   */
  useEffect(() => {
    console.log('APP VERSION: ', process.env.REACT_APP_VERSION);
    if (lastAppVersion && process.env.REACT_APP_VERSION !== lastAppVersion) {
      window.localStorage.clear();
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    }
    setLastAppVersion(process.env.REACT_APP_VERSION);
  }, [lastAppVersion, setLastAppVersion]);

  /* Hande getting protocol data on first load */
  useEffect(() => {
    /* load / reload the protocol data */
    chainId && _getProtocolData(chainId);
  }, [chainId]);

  /* Reload the page on chain changes ( if chain is different ) TODO: try remove this */
  useEffect(() => {
    if (chainId !== chainState.chainLoaded && chainState.chainLoaded !== 0) location.reload();
  }, [chainId, chainState.chainLoaded]);

  /**
   * functionality to export protocol addresses
   */
  const exportContractAddresses = () => {
    const contractList = [...contracts].map(([v, k]) => [v, k.address]);
    const seriesList = [...chainState.seriesRootMap].map(([v, k]) => [v, k.address]);
    const assetList = [...chainState.assetRootMap].map(([v, k]) => [v, k.address]);
    const strategyList = [...chainState.strategyRootMap].map(([v, k]) => [k.symbol, v]);
    const joinList = [...chainState.assetRootMap].map(([v, k]) => [v, k.joinAddress]);

    const res = JSON.stringify({
      contracts: contractList,
      series: seriesList,
      assets: assetList,
      strategies: strategyList,
      joins: joinList,
    });

    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(res)}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'contracts' + '.json');
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const chainActions = { exportContractAddresses };

  return <ChainContext.Provider value={{ chainState, chainActions, updateState }}>{children}</ChainContext.Provider>;
};

export { ChainContext };

export default ChainProvider;
