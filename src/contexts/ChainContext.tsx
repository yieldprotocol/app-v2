import React, { createContext, Dispatch, ReactNode, useCallback, useEffect, useReducer, useContext } from 'react';
import { BigNumber, Contract } from 'ethers';
import { format } from 'date-fns';
import { StrategyType } from '../config/strategies';

import { useCachedState } from '../hooks/generalHooks';

import * as contractTypes from '../contracts';
import { IAssetRoot, ISeriesRoot, IStrategyRoot, TokenType } from '../types';
import { ASSETS } from '../config/assets';

import { nameFromMaturity, getSeason, SeasonType } from '../utils/appUtils';
import { ethereumColorMap, arbitrumColorMap } from '../config/colors';
import markMap from '../config/marks';
import YieldMark from '../components/logos/YieldMark';

// import { SERIES } from '../config/series';
import { toast } from 'react-toastify';
import useChainId from '../hooks/useChainId';
import useContracts from '../hooks/useContracts';
import { ChainContextActions, ChainState, IChainContextActions, IChainContextState } from './types/chain';
import { SERIES, ISeriesStatic } from '../config/series';
import { Block } from '@ethersproject/providers';
import STRATEGIES from '../config/strategies';
import { Pool__factory } from '../contracts';

import { useProvider } from 'wagmi';
import { SettingsContext } from './SettingsContext';

const initState: IChainContextState = {
  /* flags */
  chainLoaded: 0,
  /* rootMaps */
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
        assetRootMap: new Map(state.assetRootMap.set(action.payload.id.toLowerCase(), action.payload)),
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
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  /* HOOKS */
  const chainId = useChainId();
  const contracts = useContracts();
  const provider = useProvider({
    chainId: chainId,
  });

  /* CACHED VARIABLES */
  const [lastAppVersion, setLastAppVersion] = useCachedState('lastAppVersion', '');

  /* add on extra/calculated ASSET info and contract instances  (no async) */
  const _chargeAsset = useCallback(
    (asset: any, chain: number) => {
      /* attach either contract, (or contract of the wrappedToken ) */
      let assetContract: Contract;
      let getAllowance: (acc: string, spender: string, asset?: string) => Promise<BigNumber>;
      let setAllowance: ((spender: string) => Promise<BigNumber | void>) | undefined;

      const assetMap = ASSETS.get(chain)!;

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

  const _getAssets = async (chain: number) => {
    /* handle caching */
    const cacheKey = `assets_${chain}`;
    const cachedValues = JSON.parse(localStorage.getItem(cacheKey)!);
    if (cachedValues !== null && cachedValues.length) {
      console.log('::: CACHE ::: Yield Protocol ASSET data retrieved ');
      return cachedValues.forEach((a: IAssetRoot) => {
        updateState({ type: ChainState.ADD_ASSET, payload: _chargeAsset(a, chain) });
      });
    }

    const assetMap = ASSETS.get(chain)!;

    const newAssetList: any[] = [];
    await Promise.all(
      Array.from(assetMap).map(async (x: [string, any]): Promise<void> => {
        const id = x[0];
        const assetInfo = x[1];

        /* check if an unwrapping handler is provided, if so, the token is considered to be a wrapped token */
        const isWrappedToken = assetInfo.unwrapHandlerAddresses?.has(chain);
        /* check if a wrapping handler is provided, if so, wrapping is required */
        const wrappingRequired = assetInfo.wrapHandlerAddresses?.has(chain);

        const newAsset = {
          ...assetInfo,
          id,
          address: assetInfo.assetAddress,
          /* Redirect the id/join if required due to using wrapped tokens */
          joinAddress: assetInfo.joinAddress, // assetInfo.proxyId ? joinMap.get(assetInfo.proxyId) : joinMap.get(id),

          isWrappedToken,
          wrappingRequired,
          proxyId: assetInfo.proxyId || id, // set proxyId (or as baseId if undefined)

          /* Default setting of assetInfo fields if required */
          displaySymbol: assetInfo.displaySymbol || assetInfo.symbol,
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
  };

  /* add on extra/calculated ASYNC series info and contract instances */
  const _chargeSeries = useCallback(
    (series: ISeriesStatic, chain: number): ISeriesRoot => {
      /* contracts need to be added in again in when charging because the cached state only holds strings */
      const poolContract = contractTypes.Pool__factory.connect(series.poolAddress, provider);
      const fyTokenContract = contractTypes.FYToken__factory.connect(series.address, provider);
      const seasonColorMap = [1, 4, 5, 42].includes(chain) ? ethereumColorMap : arbitrumColorMap;
      const season = getSeason(series.maturity);
      const oppSeason = (_season: SeasonType) => getSeason(series.maturity + 23670000);
      const [startColor, endColor, textColor] = seasonColorMap.get(season)!;
      const [oppStartColor, oppEndColor] = seasonColorMap.get(oppSeason(season))!;

      return {
        ...series,

        poolContract,
        fyTokenContract,
        hideSeries: series.hideSeries || false,

        fullDate: format(new Date(series.maturity * 1000), 'dd MMMM yyyy'),
        displayName: format(new Date(series.maturity * 1000), 'dd MMM yyyy'),
        displayNameMobile: `${nameFromMaturity(series.maturity, 'MMM yyyy')}`,

        // season,
        startColor,
        endColor,
        color: `linear-gradient(${startColor}, ${endColor})`,
        textColor,

        oppStartColor,
        oppEndColor,

        seriesMark: <YieldMark colors={[startColor, endColor]} />,

        allowActions: series.allowActions || ['allow_all'], // default to allow all actions
      };
    },
    [provider]
  );

  const _getSeries = useCallback(
    async (chain: number) => {
      /* Handle caching of series */
      const cacheKey = `series_${chain}`;
      const cachedValues = JSON.parse(localStorage.getItem(cacheKey)!);

      if (cachedValues !== null && cachedValues.length) {
        console.log('::: CACHE ::: Yield Protocol SERIES data retrieved ');
        return cachedValues.forEach((s: ISeriesStatic) => {
          updateState({ type: ChainState.ADD_SERIES, payload: _chargeSeries(s, chain) });
        });
      }

      const seriesMap = SERIES.get(chain);
      let seriesList = Array.from(seriesMap!.values());
      const newSeriesList: ISeriesStatic[] = [];

      await Promise.all(
        seriesList.map(async (series: ISeriesStatic) => {
          if (false) {
            // eg. development get ts g1 g2 values
            const poolContract = Pool__factory.connect(series.poolAddress, provider);
            const [ts, g1, g2] = await Promise.all([poolContract.ts(), poolContract.g1(), poolContract.g2()]);
            console.log(series.symbol, ts, g1, g2);
          }
          /* Space to do some async stuff here if required... */
          const newSeries = {
            ...series,
            // version: series.version || '1',
            // poolVersion: series.poolVersion || '1',
            // decimals: series.decimals || '18',
          };
          updateState({ type: ChainState.ADD_SERIES, payload: _chargeSeries(newSeries, chain) });
          newSeriesList.push(newSeries);
        })
      ).catch(() => console.log('Problems getting Series data. Check addresses in series config.'));

      /* cache results */
      newSeriesList.length && localStorage.setItem(cacheKey, JSON.stringify(newSeriesList));
      newSeriesList.length && console.log('Yield Protocol Series data retrieved successfully.');
    },
    [_chargeSeries, provider]
  );

  /* Attach contract instance */
  const _chargeStrategy = useCallback(
    (strategy: any) => {
      let Strategy;
      switch (strategy.type) {
        case StrategyType.V1:
          Strategy = contractTypes.Strategy__factory.connect(strategy.address, provider);
          break;
        case StrategyType.V2:
          Strategy = contractTypes.StrategyV2__factory.connect(strategy.address, provider);
          break;
        case StrategyType.V2_1:
          Strategy = contractTypes.StrategyV2_1__factory.connect(strategy.address, provider);
          break;
        default:
          throw new Error('Invalid strategy type');
      }
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
      if (cachedValues !== null && cachedValues.length) {
        console.log('::: CACHE ::: Yield Protocol STRATEGY data retrieved ');
        return cachedValues.forEach((st: IStrategyRoot) => {
          updateState({ type: ChainState.ADD_STRATEGY, payload: _chargeStrategy(st) });
        });
      }

      const strategyMap = STRATEGIES.get(chain);
      let strategyList = Array.from(strategyMap!.values());

      const newStrategyList: any[] = [];
      try {
        await Promise.all(
          strategyList.map(async (strategy) => {
            const { address, type } = strategy;

            // /* if the strategy is NOT already in the cache : */
            // console.log('::: LOADING ::: Strategy Contract ', address);

            const Strategy = contractTypes.Strategy__factory.connect(address, provider);

            // get Strategy created block using first StartPool event as Proxy
            let stategyStartBlock: Block | undefined;
            const filter = Strategy.filters.PoolStarted();
            try {
              stategyStartBlock = await (await Strategy.queryFilter(filter))[0].getBlock();
            } catch (error) {
              console.log('Could not get start block for strategy', strategy.symbol);
            }

            const newStrategy: IStrategyRoot = _chargeStrategy({
              ...strategy,
              id: address,
              startBlock: stategyStartBlock,
            });

            // update state
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

      console.log(
        'Fetching Protocol contract addresses and checking for new Assets and Series, and Strategies : ',
        chain
      );

      await Promise.all([_getAssets(chain), _getSeries(chain), _getStrategies(chain)])
        .catch(() => {
          toast.error('Error getting Yield Protocol data.');
          console.log('Error getting Yield Protocol data.');
        })
        .finally(() => {
          console.log('Yield Protocol Loaded : ', chainId);
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
  }, [lastAppVersion]);

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
    const contractList = [...contracts?.entries()!].map(([v, k]) => [v, k.address]);
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
