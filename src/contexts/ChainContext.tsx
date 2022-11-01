import React, { useCallback, useContext, useEffect, useState } from 'react';
import { BigNumber, Contract } from 'ethers';
import { format } from 'date-fns';

import { useCachedState } from '../hooks/generalHooks';

import yieldEnv from './yieldEnv.json';
import * as contracts from '../contracts';
import { IAssetRoot, IChainContextState, ISeriesRoot, IStrategyRoot, TokenType } from '../types';
import { AssetInfo, ASSETS_1, ASSETS_42161, ETH_BASED_ASSETS } from '../config/assets';

import { nameFromMaturity, getSeason, SeasonType } from '../utils/appUtils';

import { ethereumColorMap, arbitrumColorMap } from '../config/colors';

import markMap from '../config/marks';
import YieldMark from '../components/logos/YieldMark';

import { useAccount, useNetwork } from 'wagmi';
import { SERIES_1, SERIES_42161 } from '../config/series';
import { SettingsContext } from './SettingsContext';
import { toast } from 'react-toastify';
import useChainId from '../hooks/useChainId';
import useDefaulProvider from '../hooks/useDefaultProvider';

enum ChainState {
  CHAIN_ID = 'chainId',
  CHAIN_LOADED = 'chainLoaded',
  CONTRACT_MAP = 'contractMap',
  ADD_SERIES = 'addSeries',
  ADD_ASSET = 'addAsset',
  ADD_STRATEGY = 'addStrategy',
  CLEAR_MAPS = 'clearMaps',
}

/* Build the context */
const ChainContext = React.createContext<any>({});

const initState: IChainContextState = {
  /* flags */
  chainId: undefined,
  chainLoaded: false,
  /* Connected Contract Maps */
  contractMap: new Map<string, Contract>(),
  assetRootMap: new Map<string, IAssetRoot>(),
  seriesRootMap: new Map<string, ISeriesRoot>(),
  strategyRootMap: new Map<string, IStrategyRoot>(),
};

function chainReducer(state: IChainContextState, action: any): IChainContextState {
  /* Reducer switch */
  switch (action.type) {
    case ChainState.CHAIN_LOADED:
      return { ...state, chainLoaded: action.payload };

    case ChainState.CHAIN_ID:
      return { ...state, chainId: action.payload };

    case ChainState.CONTRACT_MAP:
      return { ...state, contractMap: new Map(action.payload) };

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

    case ChainState.CLEAR_MAPS: {
      return initState;
    }

    default: {
      return state;
    }
  }
}

const ChainProvider = ({ children }: any) => {
  const [chainState, updateState] = React.useReducer(chainReducer, initState);

  /* STATE FROM CONTEXT */
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  /* HOOKS */
  const provider = useDefaulProvider();
  const chainId = useChainId();

  /* SIMPLE CACHED VARIABLES */
  const [lastAppVersion, setLastAppVersion] = useCachedState('lastAppVersion', '');

  const [loadingFlag, setLoadingFlag] = useState(false);

  /* get asset map config */
  const ASSET_CONFIG = chainId === 1 ? ASSETS_1 : ASSETS_42161;

  /* get series map config */
  const SERIES_CONFIG = chainId === 1 ? SERIES_1 : SERIES_42161;

  const _getContracts = useCallback(() => {
    /* Get the instances of the Base contracts */
    const addrs = (yieldEnv.addresses as any)[chainId];

    let Cauldron: contracts.Cauldron;
    let Ladle: contracts.Ladle;
    let RateOracle: contracts.CompoundMultiOracle | contracts.AccumulatorOracle;
    let ChainlinkMultiOracle: contracts.ChainlinkMultiOracle;
    let CompositeMultiOracle: contracts.CompositeMultiOracle;
    let CompoundMultiOracle: contracts.CompoundMultiOracle;
    let YearnVaultMultiOracle: contracts.YearnVaultMultiOracle;
    let Witch: contracts.Witch;

    // modules
    let WrapEtherModule: contracts.WrapEtherModule;

    // Notional
    let NotionalMultiOracle: contracts.NotionalMultiOracle;

    // Convex
    let ConvexLadleModule: contracts.ConvexLadleModule;

    // arbitrum specific
    let ChainlinkUSDOracle: contracts.ChainlinkUSDOracle;
    let AccumulatorMultiOracle: contracts.AccumulatorOracle;

    try {
      Cauldron = contracts.Cauldron__factory.connect(addrs.Cauldron, provider);
      Ladle = contracts.Ladle__factory.connect(addrs.Ladle, provider);
      Witch = contracts.Witch__factory.connect(addrs.Witch, provider);

      // module access
      WrapEtherModule = contracts.WrapEtherModule__factory.connect(addrs.WrapEtherModule, provider);

      if ([1, 4, 5, 42].includes(chainId)) {
        // Modules
        WrapEtherModule = contracts.WrapEtherModule__factory.connect(addrs.WrapEtherModule, provider);
        ConvexLadleModule = contracts.ConvexLadleModule__factory.connect(addrs.ConvexLadleModule, provider);

        // Oracles
        AccumulatorMultiOracle = contracts.AccumulatorOracle__factory.connect(addrs.AccumulatorMultiOracle, provider);
        // RateOracle = contracts.CompoundMultiOracle__factory.connect(addrs.CompoundMultiOracle, provider);
        RateOracle = AccumulatorMultiOracle;

        ChainlinkMultiOracle = contracts.ChainlinkMultiOracle__factory.connect(addrs.ChainlinkMultiOracle, provider);
        CompositeMultiOracle = contracts.CompositeMultiOracle__factory.connect(addrs.CompositeMultiOracle, provider);

        CompoundMultiOracle = contracts.CompoundMultiOracle__factory.connect(addrs.CompoundMultiOracle, provider);

        YearnVaultMultiOracle = contracts.YearnVaultMultiOracle__factory.connect(addrs.YearnVaultMultiOracle, provider);
        NotionalMultiOracle = contracts.NotionalMultiOracle__factory.connect(addrs.NotionalMultiOracle, provider);
        NotionalMultiOracle = contracts.NotionalMultiOracle__factory.connect(addrs.NotionalMultiOracle, provider);
      }

      // arbitrum
      if ([42161, 421611].includes(chainId)) {
        // Modules
        WrapEtherModule = contracts.WrapEtherModule__factory.connect(addrs.WrapEtherModule, provider);

        // Oracles
        AccumulatorMultiOracle = contracts.AccumulatorOracle__factory.connect(addrs.AccumulatorMultiOracle, provider);
        RateOracle = AccumulatorMultiOracle;
        ChainlinkUSDOracle = contracts.ChainlinkUSDOracle__factory.connect(addrs.ChainlinkUSDOracle, provider);
      }
    } catch (e) {
      console.log('Could not connect to contracts: ', e);
    }

    // if there was an issue loading at this point simply return
    if (!Cauldron! || !Ladle! || !RateOracle! || !Witch!) return;

    /* Update the baseContracts state : ( hardcoded based on networkId ) */
    const newContractMap = new Map();

    newContractMap.set('Cauldron', Cauldron);
    newContractMap.set('Ladle', Ladle);
    newContractMap.set('Witch', Witch);

    newContractMap.set('RateOracle', RateOracle);
    newContractMap.set('ChainlinkMultiOracle', ChainlinkMultiOracle!);
    newContractMap.set('CompositeMultiOracle', CompositeMultiOracle!);
    newContractMap.set('YearnVaultMultiOracle', YearnVaultMultiOracle!);
    newContractMap.set('ChainlinkUSDOracle', ChainlinkUSDOracle!);
    newContractMap.set('NotionalMultiOracle', NotionalMultiOracle!);
    newContractMap.set('CompoundMultiOracle', CompoundMultiOracle!);
    newContractMap.set('AccumulatorMultiOracle', AccumulatorMultiOracle!);

    // modules
    newContractMap.set('WrapEtherModule', WrapEtherModule!);
    newContractMap.set('ConvexLadleModule', ConvexLadleModule!);

    updateState({ type: ChainState.CONTRACT_MAP, payload: newContractMap });
  }, [chainId, provider]);

  /* add on extra/calculated ASSET info and contract instances  (no async) */
  const _chargeAsset = useCallback(
    (asset: any) => {
      /* attach either contract, (or contract of the wrappedToken ) */

      let assetContract: Contract;
      let getBalance: (acc: string, asset?: string) => Promise<BigNumber>;
      let getAllowance: (acc: string, spender: string, asset?: string) => Promise<BigNumber>;
      let setAllowance: ((spender: string) => Promise<BigNumber | void>) | undefined;

      switch (asset.tokenType) {
        case TokenType.ERC20_:
          assetContract = contracts.ERC20__factory.connect(asset.address, provider);
          getBalance = async (acc) =>
            ETH_BASED_ASSETS.includes(asset.proxyId) ? provider?.getBalance(acc) : assetContract.balanceOf(acc);
          getAllowance = async (acc: string, spender: string) => assetContract.allowance(acc, spender);
          break;

        case TokenType.ERC1155_:
          assetContract = contracts.ERC1155__factory.connect(asset.address, provider);
          getBalance = async (acc) => assetContract.balanceOf(acc, asset.tokenIdentifier);
          getAllowance = async (acc: string, spender: string) => assetContract.isApprovedForAll(acc, spender);
          setAllowance = async (spender: string) => {
            console.log(spender);
            console.log(asset.address);
            assetContract.setApprovalForAll(spender, true);
          };
          break;

        default:
          // Default is ERC20Permit;
          assetContract = contracts.ERC20Permit__factory.connect(asset.address, provider);
          getBalance = async (acc) =>
            ETH_BASED_ASSETS.includes(asset.id) ? provider?.getBalance(acc) : assetContract.balanceOf(acc);
          getAllowance = async (acc: string, spender: string) => assetContract.allowance(acc, spender);
          break;
      }

      return {
        ...asset,
        digitFormat: ASSET_CONFIG.get(asset.id)?.digitFormat || 6,
        image: asset.tokenType !== TokenType.ERC1155_ ? markMap.get(asset.displaySymbol) : markMap.get('Notional'),

        assetContract,

        /* re-add in the wrap handler addresses when charging, because cache doesn't preserve map */
        wrapHandlerAddresses: ASSET_CONFIG.get(asset.id)?.wrapHandlerAddresses,
        unwrapHandlerAddresses: ASSET_CONFIG.get(asset.id)?.unwrapHandlerAddresses,

        getBalance,
        getAllowance,
        setAllowance,
      };
    },
    [ASSET_CONFIG, provider]
  );

  const _getAssets = useCallback(async () => {
    let assetMap = ASSET_CONFIG;
    const newAssetList: any[] = [];

    await Promise.all(
      Array.from(assetMap).map(async (x: [string, AssetInfo]): Promise<void> => {
        const id = x[0];
        const assetInfo = x[1];

        let { name, symbol, decimals, version } = assetInfo;

        /* On first load checks & corrects the ERC20 name/symbol/decimals (if possible ) */
        if (
          assetInfo.tokenType === TokenType.ERC20_ ||
          assetInfo.tokenType === TokenType.ERC20_Permit ||
          assetInfo.tokenType === TokenType.ERC20_DaiPermit
        ) {
          const contract = contracts.ERC20__factory.connect(assetInfo.assetAddress, provider);
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
          const contract = contracts.ERC20Permit__factory.connect(assetInfo.assetAddress, provider);
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
        const isWrappedToken = assetInfo.unwrapHandlerAddresses?.has(chainId);
        /* check if a wrapping handler is provided, if so, wrapping is required */
        const wrappingRequired = assetInfo.wrapHandlerAddresses?.has(chainId);

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

        updateState({ type: ChainState.ADD_ASSET, payload: _chargeAsset(newAsset) });
        newAssetList.push(newAsset);
      })
    ).catch(() => console.log('Problems getting Asset data. Check addresses in asset config.'));

    // log the new assets in the cache
    // setCachedAssets(newAssetList);

    console.log('Yield Protocol Asset data updated successfully.');
  }, [ASSET_CONFIG, _chargeAsset, chainId, provider]);

  /* add on extra/calculated ASYNC series info and contract instances */
  const _chargeSeries = useCallback(
    (series: { maturity: number; baseId: string; poolAddress: string; fyTokenAddress: string }) => {
      /* contracts need to be added in again in when charging because the cached state only holds strings */
      const poolContract = contracts.Pool__factory.connect(series.poolAddress, provider);
      const fyTokenContract = contracts.FYToken__factory.connect(series.fyTokenAddress, provider);
      const seasonColorMap = [1, 4, 5, 42].includes(chainId) ? ethereumColorMap : arbitrumColorMap;
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
    [chainId, provider]
  );

  const _getSeries = useCallback(async () => {
    let seriesMap = SERIES_CONFIG;

    const newSeriesList: any[] = [];

    await Promise.all(
      Array.from(seriesMap).map(async (x): Promise<void> => {
        const id = x[0];
        const fyTokenAddress = x[1].fyTokenAddress;
        const poolAddress = x[1].poolAddress;

        const { maturity, baseId } = await Cauldron.series(id);
        const poolContract = contracts.Pool__factory.connect(poolAddress, provider);
        const fyTokenContract = contracts.FYToken__factory.connect(fyTokenAddress, provider);

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
        };

        updateState({ type: ChainState.ADD_SERIES, payload: _chargeSeries(newSeries) });
        newSeriesList.push(newSeries);
      })
    ).catch(() => console.log('Problems getting Series data. Check addresses in series config.'));

    // setCachedSeries(newSeriesList);

    console.log('Yield Protocol Series data updated successfully.');
  }, [SERIES_CONFIG, _chargeSeries, provider]);

  /* Attach contract instance */
  const _chargeStrategy = useCallback(
    (strategy: any) => {
      const Strategy = contracts.Strategy__factory.connect(strategy.address, provider);
      return {
        ...strategy,
        strategyContract: Strategy,
      };
    },
    [provider]
  );

  /* Iterate through the strategies list and update accordingly */
  const _getStrategies = useCallback(async () => {
    const newStrategyList: any[] = [];
    const strategyList = yieldEnv.strategies[chainId];
    /**
     * IF: the CACHE is empty then, get fetch asset data for chainId and cache it:
     * */
    const cacheKey = `strategies_${chainId}`;
    const cachedValues = JSON.parse(localStorage.getItem(cacheKey)!);

    if (cachedValues === null || cachedValues.length === 0) {
      try {
        await Promise.all(
          strategyList.map(async (strategyAddr) => {
            /* if the strategy is NOT already in the cache : */
            // console.log('Updating Strategy contract ', strategyAddr);
            const Strategy = contracts.Strategy__factory.connect(strategyAddr, provider);
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
    } else {
      /**
       * ELSE: else charge the strategies from the cache
       * */
      cachedValues.forEach((st: IStrategyRoot) => {
        updateState({ type: ChainState.ADD_STRATEGY, payload: _chargeStrategy(st) });
      });
      console.log('Yield Protocol Strategy data retrieved successfully ::: CACHE :::');
    }
  }, [_chargeStrategy, chainId, provider]);

  const _getProtocolData = useCallback(async () => {
    /* set loading flag */
    updateState({ type: ChainState.CHAIN_LOADED, payload: false });

    /* Clear maps in local memory */
    updateState({ type: ChainState.CLEAR_MAPS, payload: undefined });

    console.log('Fetching Protocol contract addresses for chain Id: ', chainId);
    _getContracts();

    console.log('Checking for new Assets and Series, and Strategies : ', chainId);
    await Promise.all([_getAssets(), _getSeries(), _getStrategies()])
      .catch(() => {
        toast.error('Error getting Yield Protocol data.');
        console.log('Error getting Yield Protocol data.');
      })
      .finally(() => {
        updateState({ type: ChainState.CHAIN_LOADED, payload: true });
      });
  }, [_getAssets, _getContracts, _getSeries, _getStrategies, chainId]);

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
  }, []);

  /**
   * functionality to export protocol addresses
   */
  const exportContractAddresses = () => {
    const contractList = [...(chainState.contractMap as any)].map(([v, k]) => [v, k?.address]);
    const seriesList = [...(chainState.seriesRootMap as any)].map(([v, k]) => [v, k?.address]);
    const assetList = [...(chainState.assetRootMap as any)].map(([v, k]) => [v, k?.address]);
    const strategyList = [...(chainState.strategyRootMap as any)].map(([v, k]) => [k?.symbol, v]);
    const joinList = [...(chainState.assetRootMap as any)].map(([v, k]) => [v, k?.joinAddress]);

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

    // console.table(contractList);
    // console.table(seriesList);
    // console.table(assetList);
    // console.table(joinList);
    // console.table(strategyList);
  };

  /* simply Pass on the connection actions */
  const chainActions = { exportContractAddresses };

  return <ChainContext.Provider value={{ chainState, chainActions }}>{children}</ChainContext.Provider>;
};

export { ChainContext };

export default ChainProvider;
