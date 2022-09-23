import React, { useContext, useEffect } from 'react';
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

import { useAccount, useNetwork, useProvider } from 'wagmi';
import { PoolType, SERIES_1, SERIES_42161 } from '../config/series';
import { SettingsContext } from './SettingsContext';
import { toast } from 'react-toastify';

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

function chainReducer(state: IChainContextState, action: any) {
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
  const provider = useProvider();
  const { chain, chains } = useNetwork();
  const { isConnecting } = useAccount();

  /* SIMPLE CACHED VARIABLES */
  const [lastAppVersion, setLastAppVersion] = useCachedState('lastAppVersion', '');

  /**
   * Track chainId changes.
   * (defaults to getting the protocol data from the first chain in the provider list)
   * */
  useEffect(() => {
    const chainId = chain?.id || chainState.chainId;

    if (chainId) {
      console.log('Connected to chainId: ', chainId);
      /* update protocol info */
      _getProtocolData(chainId);
      return updateState({ type: ChainState.CHAIN_ID, payload: chainId });
    }

    diagnostics && console.log('There is no connected chain: using default chain from state or chains config...');
    _getProtocolData(chains[0].id);
  }, [chain?.id, chainState.chainId, chains, diagnostics]);

  /**
   * A bit hacky, but if connecting account, we set 'chainloading'
   * so that we can safely update on every ACCOUNT change in userContext
   * without re-triggering loading before local memory has been cleared.
   */
  // useEffect(() => {
  //   isConnecting && updateState({ type: ChainState.CHAIN_LOADED, payload: false });
  // }, [isConnecting]);

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

  const _getContracts = (_chainId: number) => {
    /* Get the instances of the Base contracts */
    const addrs = (yieldEnv.addresses as any)[_chainId];

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

      if ([1, 4, 5, 42].includes(_chainId)) {
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
      if ([42161, 421611].includes(_chainId)) {
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
  };

  /* add on extra/calculated ASSET info and contract instances  (no async) */
  const _chargeAsset = (asset: any, _chainId: number) => {
    let assetMap = _chainId === 1 ? ASSETS_1 : ASSETS_42161;

    /* attach either contract, (or contract of the wrappedToken ) */
    let assetContract: Contract;
    let getBalance: (acc: string, asset?: string) => Promise<BigNumber>;
    let getAllowance: (acc: string, spender: string, asset?: string) => Promise<BigNumber>;
    let setAllowance: ((spender: string) => Promise<BigNumber | void>) | undefined;

    switch (asset.tokenType) {
      case TokenType.ERC20_:
        assetContract = contracts.ERC20__factory.connect(asset.address, provider);
        getBalance = async (acc) =>
          ETH_BASED_ASSETS.includes(asset.proxyId) ? provider.getBalance(acc) : assetContract.balanceOf(acc);
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
          ETH_BASED_ASSETS.includes(asset.id) ? provider.getBalance(acc) : assetContract.balanceOf(acc);
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

      getBalance,
      getAllowance,
      setAllowance,
    };
  };

  const _getAssets = async (_chainId: number) => {
    /* Select correct Asset map */
    let assetMap = _chainId === 1 ? ASSETS_1 : ASSETS_42161;

    /**
     * IF: the CACHE is empty then, get fetch asset data for chainId and cache it:
     * */
    const cacheKey = `assets_${_chainId}`;
    const cachedValues = JSON.parse(localStorage.getItem(cacheKey)!);

    if (cachedValues === null || cachedValues.length === 0) {
      let newAssetList = [] as any[];
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
              diagnostics && console.log(id, ': ERC20 contract auto-validation unsuccessfull');
            }
          }
          /* checks & corrects the version for ERC20Permit/ DAI permit tokens */
          if (assetInfo.tokenType === TokenType.ERC20_Permit || assetInfo.tokenType === TokenType.ERC20_DaiPermit) {
            const contract = contracts.ERC20Permit__factory.connect(assetInfo.assetAddress, provider);
            try {
              version = await contract.version();
            } catch (e) {
              diagnostics && console.log(id, ': contract VERSION auto-validation unsuccessfull');
            }
          }

          /* check if an unwrapping handler is provided, if so, the token is considered to be a wrapped token */
          const isWrappedToken = assetInfo.unwrapHandlerAddresses?.has(_chainId);
          /* check if a wrapping handler is provided, if so, wrapping is required */
          const wrappingRequired = assetInfo.wrapHandlerAddresses?.has(_chainId);

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

          updateState({ type: ChainState.ADD_ASSET, payload: _chargeAsset(newAsset, _chainId) });
          newAssetList.push(newAsset);
        })
      ).catch(() => console.log('Problems getting Asset data. Check ASSET CONFIG'));

      /* cache results */
      newAssetList.length && localStorage.setItem(cacheKey, JSON.stringify(newAssetList));
      newAssetList.length && console.log('Yield Protocol Asset data retrieved successfully.');
    } else {
      /**
       * ELSE: else charge the assets from the cache
       * */
      cachedValues.forEach((a: IAssetRoot) => {
        updateState({ type: ChainState.ADD_ASSET, payload: _chargeAsset(a, _chainId) });
      });
      console.log('Yield Protocol Asset data retrieved successfully ::: CACHE ::: ');
    }
  };

  /* add on extra/calculated ASYNC series info and contract instances */
  const _chargeSeries = (
    series: {
      maturity: number;
      baseId: string;
      poolAddress: string;
      poolType: PoolType;
      fyTokenAddress: string;
    },
    _chainId: number
  ) => {
    const seasonColorMap = _chainId === 1 ? ethereumColorMap : arbitrumColorMap;

    /* contracts need to be added in again in when charging because the cached state only holds strings */
    const poolContract = (
      series.poolType === PoolType.TV ? contracts.Pool__factory : contracts.PoolOld__factory
    ).connect(series.poolAddress, provider);
    const fyTokenContract = contracts.FYToken__factory.connect(series.fyTokenAddress, provider);

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

      // built-in helper functions:
      getBaseAddress: () => chainState.assetRootMap.get(series.baseId)?.address, // TODO refactor to get this static - if possible?
    };
  };

  const _getSeries = async (_chainId: number) => {
    let seriesMap = _chainId === 1 ? SERIES_1 : SERIES_42161;
    const addrs = (yieldEnv.addresses as any)[_chainId];
    const Cauldron = contracts.Cauldron__factory.connect(addrs.Cauldron, provider);

    /**
     * If: the CACHE is empty then, get fetch asset data for chainId and cache it:
     * */
    const cacheKey = `series_${_chainId}`;
    const cachedValues = JSON.parse(localStorage.getItem(cacheKey)!);

    if (cachedValues === null || cachedValues.length === 0) {
      let newSeriesList: any[] = [];
      await Promise.all(
        Array.from(seriesMap).map(async (x): Promise<void> => {
          const id = x[0];
          const baseId = `${id.slice(0, 6)}00000000`;
          const fyTokenAddress = x[1].fyTokenAddress;
          const poolAddress = x[1].poolAddress;
          const poolType = x[1].poolType;

          const { maturity } = await Cauldron.series(id);

          const poolContract = (
            poolType === PoolType.TV ? contracts.Pool__factory : contracts.PoolOld__factory
          ).connect(poolAddress, provider);
          const fyTokenContract = contracts.FYToken__factory.connect(fyTokenAddress, provider);

          const [name, symbol, version, decimals, poolName, poolVersion, poolSymbol, ts, g1, g2] = await Promise.all([
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
          ]);

          const newSeries = {
            id,
            baseId,
            maturity,
            name,
            symbol,
            version,
            address: fyTokenAddress,
            fyTokenAddress: fyTokenAddress,
            decimals,
            poolAddress,
            poolVersion,
            poolName,
            poolSymbol,
            poolType,
            ts,
            g1,
            g2,
          };

          updateState({ type: ChainState.ADD_SERIES, payload: _chargeSeries(newSeries, _chainId) });
          newSeriesList.push(newSeries);
        })
      ).catch((e) => console.log('Problems getting Series data. Check SERIES CONFIG.', e));

      /* cache results */
      newSeriesList.length && localStorage.setItem(cacheKey, JSON.stringify(newSeriesList));
      newSeriesList.length && console.log('Yield Protocol Series data retrieved successfully.');
    } else {
      /**
       * ELSE: else charge the series from the cache
       * */
      cachedValues.forEach((s: ISeriesRoot) => {
        updateState({ type: ChainState.ADD_SERIES, payload: _chargeSeries(s, _chainId) });
      });
      console.log('Yield Protocol Series data retrieved successfully ::: CACHE :::');
    }
  };

  /* Attach contract instance */
  const _chargeStrategy = (strategy: any) => {
    const Strategy = contracts.Strategy__factory.connect(strategy.address, provider);
    return {
      ...strategy,
      strategyContract: Strategy,
    };
  };

  /* Iterate through the strategies list and update accordingly */
  const _getStrategies = async (_chainId: number) => {
    const newStrategyList: any[] = [];
    const strategyList = yieldEnv.strategies[_chainId];
    /**
     * IF: the CACHE is empty then, get fetch asset data for chainId and cache it:
     * */
    const cacheKey = `strategies_${_chainId}`;
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
  };

  const _getProtocolData = async (_chainId: number) => {
    /* set loading flag */
    updateState({ type: ChainState.CHAIN_LOADED, payload: false });

    /* Clear maps in local memory */
    updateState({ type: ChainState.CLEAR_MAPS, payload: undefined });

    console.log('Fetching Protocol contract addresses for chain Id: ', _chainId);
    _getContracts(_chainId);

    console.log('Checking for new Assets and Series, and Strategies : ', _chainId);
    await Promise.all([_getAssets(_chainId), _getSeries(_chainId), _getStrategies(_chainId)])
      .catch(() => {
        toast.error('Error getting Yield Protocol data.');
        console.log('Error getting Yield Protocol data.');
      })
      .finally(() => {
        updateState({ type: ChainState.CHAIN_LOADED, payload: true });
      });
  };

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
