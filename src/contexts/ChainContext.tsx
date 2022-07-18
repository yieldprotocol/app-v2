import React, { useEffect } from 'react';
import { BigNumber, Contract, ethers } from 'ethers';
import { format } from 'date-fns';

import { useCachedState } from '../hooks/generalHooks';
import { useConnection } from '../hooks/useConnection';

import yieldEnv from './yieldEnv.json';
import * as contracts from '../contracts';
import { IAssetInfo, IAssetRoot, IChainContextState, ISeriesRoot, IStrategyRoot, TokenType } from '../types';
import { ASSET_INFO, ETH_BASED_ASSETS, UNKNOWN } from '../config/assets';

import { nameFromMaturity, getSeason, SeasonType } from '../utils/appUtils';

import { ethereumColorMap, arbitrumColorMap } from '../config/colors';
import { AssetAddedEvent, SeriesAddedEvent } from '../contracts/Cauldron';
import { JoinAddedEvent, PoolAddedEvent } from '../contracts/Ladle';

import markMap from '../config/marks';
import YieldMark from '../components/logos/YieldMark';

enum ChainState {
  CHAIN_LOADING = 'chainLoading',
  APP_VERSION = 'appVersion',
  CONNECTION = 'connection',
  CONTRACT_MAP = 'contractMap',
  ADD_SERIES = 'addSeries',
  ADD_ASSET = 'addAsset',
  ADD_STRATEGY = 'addStrategy',
}

export const TENDERLY_START_BLOCK = 15169163; // tenderly forked block less ~1000

/* Build the context */
const ChainContext = React.createContext<any>({});

const initState: IChainContextState = {
  appVersion: '0.0.0' as string,

  connection: {
    provider: null as ethers.providers.Web3Provider | null,
    chainId: null as number | null,

    fallbackProvider: null as ethers.providers.Web3Provider | null,
    fallbackChainId: Number(process.env.REACT_APP_DEFAULT_CHAINID) as number | null,

    signer: null as ethers.providers.JsonRpcSigner | null,
    account: null as string | null,

    connectionName: null as string | null,
    useTenderlyFork: false as boolean,
  },

  /* flags */
  chainLoading: true,

  /* Connected Contract Maps */
  contractMap: new Map<string, Contract>([]),
  assetRootMap: new Map<string, IAssetRoot>([]),
  seriesRootMap: new Map<string, ISeriesRoot>([]),
  strategyRootMap: new Map<string, IStrategyRoot>([]),
};

function chainReducer(state: IChainContextState, action: any) {
  /* Helper: only change the state if different from existing */
  const onlyIfChanged = (_action: any): IChainContextState =>
    state[action.type] === _action.payload ? state[action.type] : _action.payload;

  /* Reducer switch */
  switch (action.type) {
    case ChainState.CHAIN_LOADING:
      return { ...state, chainLoading: onlyIfChanged(action) };

    case ChainState.APP_VERSION:
      return { ...state, appVersion: onlyIfChanged(action) };

    case ChainState.CONNECTION:
      return { ...state, connection: onlyIfChanged(action) };

    case ChainState.CONTRACT_MAP:
      return { ...state, contractMap: onlyIfChanged(action) };

    case ChainState.ADD_SERIES:
      return {
        ...state,
        seriesRootMap: state.seriesRootMap.set(action.payload.id, action.payload),
      };

    case ChainState.ADD_ASSET:
      return {
        ...state,
        assetRootMap: state.assetRootMap.set(action.payload.id, action.payload),
      };

    case ChainState.ADD_STRATEGY:
      return {
        ...state,
        strategyRootMap: state.strategyRootMap.set(action.payload.address, action.payload),
      };

    default:
      return state;
  }
}

const ChainProvider = ({ children }: any) => {
  const [chainState, updateState] = React.useReducer(chainReducer, initState);

  /* CACHED VARIABLES */
  const [lastAppVersion, setLastAppVersion] = useCachedState('lastAppVersion', '');

  const [lastAssetUpdate, setLastAssetUpdate] = useCachedState('lastAssetUpdate', 'earliest');
  const [lastSeriesUpdate, setLastSeriesUpdate] = useCachedState('lastSeriesUpdate', 'earliest');

  const [cachedAssets, setCachedAssets] = useCachedState('assets', []);
  const [cachedSeries, setCachedSeries] = useCachedState('series', []);
  const [cachedStrategies, setCachedStrategies] = useCachedState('strategies', []);

  /* Connection hook */
  const { connectionState, connectionActions } = useConnection();
  const { chainId, fallbackProvider, fallbackChainId, useTenderlyFork } = connectionState;

  /**
   * Update on FALLBACK connection/state on network changes (id/library)
   */
  useEffect(() => {
    if (fallbackProvider && fallbackChainId) {
      console.log('Fallback ChainId: ', fallbackChainId);
      console.log('Primary ChainId: ', chainId);

      /* Get the instances of the Base contracts */
      const addrs = (yieldEnv.addresses as any)[fallbackChainId];
      const seasonColorMap = [1, 4, 5, 42].includes(chainId as number) ? ethereumColorMap : arbitrumColorMap;

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
        Cauldron = contracts.Cauldron__factory.connect(addrs.Cauldron, fallbackProvider);
        Ladle = contracts.Ladle__factory.connect(addrs.Ladle, fallbackProvider);
        Witch = contracts.Witch__factory.connect(addrs.Witch, fallbackProvider);

        // module access
        WrapEtherModule = contracts.WrapEtherModule__factory.connect(addrs.WrapEtherModule, fallbackProvider);

        if ([1, 4, 5, 42].includes(fallbackChainId)) {
          // Modules
          WrapEtherModule = contracts.WrapEtherModule__factory.connect(addrs.WrapEtherModule, fallbackProvider);
          ConvexLadleModule = contracts.ConvexLadleModule__factory.connect(addrs.ConvexLadleModule, fallbackProvider);

          // Oracles
          AccumulatorMultiOracle = contracts.AccumulatorOracle__factory.connect(
            addrs.AccumulatorMultiOracle,
            fallbackProvider
          );
          // RateOracle = contracts.CompoundMultiOracle__factory.connect(addrs.CompoundMultiOracle, fallbackProvider);
          RateOracle = AccumulatorMultiOracle;

          ChainlinkMultiOracle = contracts.ChainlinkMultiOracle__factory.connect(
            addrs.ChainlinkMultiOracle,
            fallbackProvider
          );
          CompositeMultiOracle = contracts.CompositeMultiOracle__factory.connect(
            addrs.CompositeMultiOracle,
            fallbackProvider
          );

          CompoundMultiOracle = contracts.CompoundMultiOracle__factory.connect(
            addrs.CompoundMultiOracle,
            fallbackProvider
          );

          YearnVaultMultiOracle = contracts.YearnVaultMultiOracle__factory.connect(
            addrs.YearnVaultMultiOracle,
            fallbackProvider
          );
          NotionalMultiOracle = contracts.NotionalMultiOracle__factory.connect(
            addrs.NotionalMultiOracle,
            fallbackProvider
          );
          NotionalMultiOracle = contracts.NotionalMultiOracle__factory.connect(
            addrs.NotionalMultiOracle,
            fallbackProvider
          );
        }

        // arbitrum
        if ([42161, 421611].includes(fallbackChainId)) {
          // Modules
          WrapEtherModule = contracts.WrapEtherModule__factory.connect(addrs.WrapEtherModule, fallbackProvider);

          // Oracles
          AccumulatorMultiOracle = contracts.AccumulatorOracle__factory.connect(
            addrs.AccumulatorMultiOracle,
            fallbackProvider
          );
          RateOracle = AccumulatorMultiOracle;
          ChainlinkUSDOracle = contracts.ChainlinkUSDOracle__factory.connect(
            addrs.ChainlinkUSDOracle,
            fallbackProvider
          );
        }
      } catch (e) {
        console.log('Could not connect to contracts: ', e);
      }

      // if there was an issue loading at htis point simply return
      if (!Cauldron || !Ladle || !RateOracle || !Witch) return;

      /* Update the baseContracts state : ( hardcoded based on networkId ) */
      const newContractMap = chainState.contractMap as Map<string, Contract>;
      newContractMap.set('Cauldron', Cauldron);
      newContractMap.set('Ladle', Ladle);
      newContractMap.set('Witch', Witch);
      newContractMap.set('RateOracle', RateOracle);

      newContractMap.set('ChainlinkMultiOracle', ChainlinkMultiOracle);
      newContractMap.set('CompositeMultiOracle', CompositeMultiOracle);
      newContractMap.set('YearnVaultMultiOracle', YearnVaultMultiOracle);
      newContractMap.set('ChainlinkUSDOracle', ChainlinkUSDOracle);
      newContractMap.set('NotionalMultiOracle', NotionalMultiOracle);
      newContractMap.set('CompoundMultiOracle', CompoundMultiOracle);

      newContractMap.set('AccumulatorMultiOracle', AccumulatorMultiOracle);

      // modules
      newContractMap.set('WrapEtherModule', WrapEtherModule);
      newContractMap.set('ConvexLadleModule', ConvexLadleModule);

      updateState({ type: ChainState.CONTRACT_MAP, payload: newContractMap });

      /* Get the hardcoded strategy addresses */
      const strategyAddresses = yieldEnv.strategies[fallbackChainId] as string[];

      /* add on extra/calculated ASSET info and contract instances  (no async) */
      const _chargeAsset = (asset: any) => {
        /* attach either contract, (or contract of the wrappedToken ) */

        let assetContract: Contract;
        let getBalance: (acc: string, asset?: string) => Promise<BigNumber>;
        let getAllowance: (acc: string, spender: string, asset?: string) => Promise<BigNumber>;
        let setAllowance: ((spender: string) => Promise<BigNumber | void>) | undefined;

        switch (asset.tokenType) {
          case TokenType.ERC20_:
            assetContract = contracts.ERC20__factory.connect(asset.address, fallbackProvider);
            getBalance = async (acc) =>
              ETH_BASED_ASSETS.includes(asset.proxyId)
                ? fallbackProvider?.getBalance(acc)
                : assetContract.balanceOf(acc);
            getAllowance = async (acc: string, spender: string) => assetContract.allowance(acc, spender);
            break;

          case TokenType.ERC1155_:
            assetContract = contracts.ERC1155__factory.connect(asset.address, fallbackProvider);
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
            assetContract = contracts.ERC20Permit__factory.connect(asset.address, fallbackProvider);
            getBalance = async (acc) =>
              ETH_BASED_ASSETS.includes(asset.id) ? fallbackProvider?.getBalance(acc) : assetContract.balanceOf(acc);
            getAllowance = async (acc: string, spender: string) => assetContract.allowance(acc, spender);
            break;
        }

        return {
          ...asset,
          digitFormat: ASSET_INFO.get(asset.id)?.digitFormat || 6,
          image: asset.tokenType !== TokenType.ERC1155_ ? markMap.get(asset.displaySymbol) : markMap.get('Notional'),

          assetContract,

          /* re-add in the wrap handler addresses when charging, because cache doesn't preserve map */
          wrapHandlerAddresses: ASSET_INFO.get(asset.id)?.wrapHandlerAddresses,
          unwrapHandlerAddresses: ASSET_INFO.get(asset.id)?.unwrapHandlerAddresses,

          getBalance,
          getAllowance,
          setAllowance,
        };
      };

      const _getAssets = async () => {
        /* get all the assetAdded, oracleAdded and joinAdded events and series events at the same time */
        const blockNum = await fallbackProvider.getBlockNumber();

        let assetAddedEvents = [];
        let joinAddedEvents = [];

        try {
          [assetAddedEvents, joinAddedEvents] = await Promise.all([
            Cauldron.queryFilter(
              'AssetAdded' as ethers.EventFilter,
              useTenderlyFork ? TENDERLY_START_BLOCK : lastAssetUpdate
            ),
            Ladle.queryFilter(
              'JoinAdded' as ethers.EventFilter,
              useTenderlyFork ? TENDERLY_START_BLOCK : lastAssetUpdate
            ),
          ]);
        } catch (e) {
          console.log('🦄 ~ file: ChainContext.tsx ~ line 295 ~ const_getAssets= ~ e', e);
        }

        /* Create a map from the joinAdded event data or hardcoded join data if available */
        const joinMap = new Map(joinAddedEvents.map((e: JoinAddedEvent) => e.args)); // event values);

        /* Create a array from the assetAdded event data or hardcoded asset data if available */
        const assetsAdded = assetAddedEvents.map((e: AssetAddedEvent) => e.args);

        const newAssetList: any[] = [];

        await Promise.all(
          assetsAdded.map(async (x) => {
            const { assetId: id, asset: address } = x;

            /* Get the basic hardcoded token info, if tooken is known, else get 'UNKNOWN' token */
            const assetInfo = ASSET_INFO.has(id)
              ? (ASSET_INFO.get(id) as IAssetInfo)
              : (ASSET_INFO.get(UNKNOWN) as IAssetInfo);
            let { name, symbol, decimals, version } = assetInfo;

            /* On first load checks & corrects the ERC20 name/symbol/decimals (if possible ) */
            if (
              assetInfo.tokenType === TokenType.ERC20_ ||
              assetInfo.tokenType === TokenType.ERC20_Permit ||
              assetInfo.tokenType === TokenType.ERC20_DaiPermit
            ) {
              const contract = contracts.ERC20__factory.connect(address, fallbackProvider);
              try {
                [name, symbol, decimals] = await Promise.all([contract.name(), contract.symbol(), contract.decimals()]);
              } catch (e) {
                console.log(
                  address,
                  ': ERC20 contract auto-validation unsuccessfull. Please manually ensure symbol and decimals are correct.'
                );
              }
            }

            /* checks & corrects the version for ERC20Permit/ DAI permit tokens */
            if (assetInfo.tokenType === TokenType.ERC20_Permit || assetInfo.tokenType === TokenType.ERC20_DaiPermit) {
              const contract = contracts.ERC20Permit__factory.connect(address, fallbackProvider);
              try {
                version = await contract.version();
              } catch (e) {
                console.log(
                  address,
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
              address,
              name,
              symbol,
              decimals,
              version,

              /* Redirect the id/join if required due to using wrapped tokens */
              joinAddress: assetInfo.proxyId ? joinMap.get(assetInfo.proxyId) : joinMap.get(id),

              isWrappedToken,
              wrappingRequired,
              proxyId: assetInfo.proxyId || id, // set proxyId  (or as baseId if undefined)

              /* Default setting of assetInfo fields if required */
              displaySymbol: assetInfo.displaySymbol || symbol,
              showToken: assetInfo.showToken || false,
            };

            // Update state and cache
            updateState({ type: ChainState.ADD_ASSET, payload: _chargeAsset(newAsset) });
            newAssetList.push(newAsset);
          })
        );

        // set the 'last checked' block
        setLastAssetUpdate(blockNum);

        // log the new assets in the cache
        setCachedAssets([...cachedAssets, ...newAssetList]);

        console.log('Yield Protocol Asset data updated.');
      };

      /* add on extra/calculated ASYNC series info and contract instances */
      const _chargeSeries = (series: {
        maturity: number;
        baseId: string;
        poolAddress: string;
        fyTokenAddress: string;
      }) => {
        /* contracts need to be added in again in when charging because the cached state only holds strings */
        const poolContract = getPoolContract(series.poolAddress, series.maturity);
        const fyTokenContract = contracts.FYToken__factory.connect(series.fyTokenAddress, fallbackProvider);

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
          getTimeTillMaturity: () => series.maturity - Math.round(new Date().getTime() / 1000),
          isMature: () => series.maturity - Math.round(new Date().getTime() / 1000) <= 0,
          getBaseAddress: () => chainState.assetRootMap.get(series.baseId).address, // TODO refactor to get this static - if possible?
        };
      };

      const _getSeries = async () => {
        /* get poolAdded events and series events at the same time */
        let seriesAddedEvents = [];
        let poolAddedEvents = [];
        try {
          [seriesAddedEvents, poolAddedEvents] = await Promise.all([
            Cauldron.queryFilter(
              'SeriesAdded' as ethers.EventFilter,
              useTenderlyFork ? TENDERLY_START_BLOCK : lastSeriesUpdate
            ),
            Ladle.queryFilter(
              'PoolAdded' as ethers.EventFilter,
              useTenderlyFork ? TENDERLY_START_BLOCK : lastSeriesUpdate
            ),
          ]);
        } catch (error) {
          console.log('🦄 ~ file: ChainContext.tsx ~ line 451 ~ const_getSeries= ~ error', error);
        }

        /* Create a map from the poolAdded event data or hardcoded pool data if available */
        const poolMap = new Map(poolAddedEvents.map((e: PoolAddedEvent) => e.args)); // event values);

        /* Create a array from the seriesAdded event data or hardcoded series data if available */
        const seriesAdded = seriesAddedEvents.map((e: SeriesAddedEvent) => e.args);

        const newSeriesList: any[] = [];

        /* Add in any extra static series */
        await Promise.all(
          seriesAdded.map(async (x): Promise<void> => {
            const { seriesId: id, baseId, fyToken } = x;
            const { maturity } = await Cauldron.series(id);

            if (poolMap.has(id)) {
              // only add series if it has a pool
              const poolAddress = poolMap.get(id);
              const poolContract = getPoolContract(poolAddress, maturity);
              const fyTokenContract = contracts.FYToken__factory.connect(fyToken, fallbackProvider);
              const [name, symbol, version, decimals, poolName, poolVersion, poolSymbol, ts, g1, g2] =
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
                ]);

              const newSeries = {
                id,
                baseId,
                maturity,
                name,
                symbol,
                version,
                address: fyToken,
                fyTokenAddress: fyToken,
                decimals,
                poolAddress,
                poolVersion,
                poolName,
                poolSymbol,
                ts,
                g1,
                g2,
              };
              updateState({ type: ChainState.ADD_SERIES, payload: _chargeSeries(newSeries) });
              newSeriesList.push(newSeries);
            }
          })
        );
        setLastSeriesUpdate(await fallbackProvider?.getBlockNumber());
        setCachedSeries([...cachedSeries, ...newSeriesList]);

        console.log('Yield Protocol Series data updated.');
      };

      /* Attach contract instance */

      const _chargeStrategy = (strategy: any) => {
        const Strategy = contracts.Strategy__factory.connect(strategy.address, fallbackProvider);
        return {
          ...strategy,
          strategyContract: Strategy,
        };
      };

      /* Iterate through the strategies list and update accordingly */
      const _getStrategies = async () => {
        const newStrategyList: any[] = [];
        try {
          await Promise.all(
            strategyAddresses.map(async (strategyAddr) => {
              /* if the strategy is NOT already in the cache : */
              if (cachedStrategies.findIndex((_s: any) => _s.address === strategyAddr) === -1) {
                console.log('updating constract ', strategyAddr);

                const Strategy = contracts.Strategy__factory.connect(strategyAddr, fallbackProvider);
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
              }
            })
          );
        } catch (e) {
          console.log('Error fetching strategies', e);
        }

        const _filteredCachedStrategies = cachedStrategies.filter((s: any) => strategyAddresses.includes(s.address));

        setCachedStrategies([..._filteredCachedStrategies, ...newStrategyList]);
        console.log('Yield Protocol Strategy data updated.');
      };

      /**
       * LOAD the Series and Assets *
       * */
      if (cachedAssets.length === 0 || cachedSeries.length === 0) {
        console.log('FIRST LOAD: Loading Asset, Series and Strategies data ');
        (async () => {
          await Promise.all([_getAssets(), _getSeries(), _getStrategies()]);
          updateState({ type: ChainState.CHAIN_LOADING, payload: false });
        })();
      } else {
        // get assets, series and strategies from cache and 'charge' them, and add to state:
        cachedAssets.forEach((a: IAssetRoot) => {
          updateState({ type: ChainState.ADD_ASSET, payload: _chargeAsset(a) });
        });
        cachedSeries.forEach((s: ISeriesRoot) => {
          updateState({ type: ChainState.ADD_SERIES, payload: _chargeSeries(s) });
        });
        cachedStrategies.forEach((st: IStrategyRoot) => {
          strategyAddresses.includes(st.address) &&
            updateState({ type: ChainState.ADD_STRATEGY, payload: _chargeStrategy(st) });
        });
        updateState({ type: ChainState.CHAIN_LOADING, payload: false });

        console.log('Checking for new Assets and Series, and Strategies ...');
        // then async check for any updates (they should automatically populate the map):
        (async () => Promise.all([_getAssets(), _getSeries(), _getStrategies()]))();
      }
    }
  }, [fallbackChainId, fallbackProvider]);

  /**
   * Handle version updates on first load -> complete refresh if app is different to published version
   */
  useEffect(() => {
    updateState({ type: 'appVersion', payload: process.env.REACT_APP_VERSION });
    console.log('APP VERSION: ', process.env.REACT_APP_VERSION);
    if (lastAppVersion && process.env.REACT_APP_VERSION !== lastAppVersion) {
      window.localStorage.clear();
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    }
    setLastAppVersion(process.env.REACT_APP_VERSION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ignore to only happen once on init

  /**
   * Update on PRIMARY connection information on specific network changes (likely via metamask/walletConnect)
   */
  useEffect(() => {
    updateState({
      type: ChainState.CONNECTION,
      payload: connectionState,
    });
  }, [
    connectionState.fallbackChainId,
    connectionState.chainId,
    connectionState.account,
    connectionState.errorMessage,
    connectionState.fallbackErrorMessage,
    connectionState.active,
    connectionState.connectionName,
    connectionState.currentChainInfo,
    connectionState.useTenderlyFork,
  ]);

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

    console.log(res);
  };

  /* Assess which pool contract to use: new (with tv) or old (without tv) */
  const getPoolContract = (poolAddress: string, maturity: number) =>
    (maturity === 1672412400 ? contracts.Pool__factory : contracts.PoolOld__factory).connect(
      poolAddress,
      fallbackProvider
    );

  /* simply Pass on the connection actions */
  const chainActions = { ...connectionActions, exportContractAddresses };

  return <ChainContext.Provider value={{ chainState, chainActions }}>{children}</ChainContext.Provider>;
};

export { ChainContext };

export default ChainProvider;
