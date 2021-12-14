import React, { useEffect } from 'react';
import { Contract, ethers } from 'ethers';

import { format } from 'date-fns';

import { useCachedState } from '../hooks/generalHooks';
import { useConnection } from '../hooks/useConnection';

import * as yieldEnv from './yieldEnv.json';
import * as contracts from '../contracts';
import { IAssetInfo, IAssetRoot, IChainContextState, ISeriesRoot, IStrategyRoot } from '../types';
import { ASSET_INFO, ETH_BASED_ASSETS, USDC } from '../config/assets';
import { nameFromMaturity, getSeason, SeasonType, clearCachedItems } from '../utils/appUtils';

import DaiMark from '../components/logos/DaiMark';
import EthMark from '../components/logos/EthMark';
import TSTMark from '../components/logos/TSTMark';
import USDCMark from '../components/logos/USDCMark';
import WBTCMark from '../components/logos/WBTCMark';
import USDTMark from '../components/logos/USDTMark';
import YieldMark from '../components/logos/YieldMark';
import StEthMark from '../components/logos/StEthMark';
import LINKMark from '../components/logos/LinkMark';
import ENSMark from '../components/logos/ENSMark';

import { seasonColorMap } from '../config/colors';
import UNIMark from '../components/logos/UNIMark';
import YFIMark from '../components/logos/YFIMark';
import MakerMark from '../components/logos/MakerMark';
import { BLANK_ADDRESS } from '../utils/constants';

const markMap = new Map([
  ['DAI', <DaiMark key="dai" />],
  ['USDC', <USDCMark key="usdc" />],
  ['WBTC', <WBTCMark key="wbtc" />],
  ['TST', <TSTMark key="tst" />],
  ['ETH', <EthMark key="eth" />],
  ['USDT', <USDTMark key="eth" />],
  ['LINK', <LINKMark key="link" />],
  ['wstETH', <StEthMark key="wsteth" />],
  ['stETH', <StEthMark key="steth" />],
  ['ENS', <ENSMark key="ens" />],
  ['UNI', <UNIMark key="uni" />],
  ['yvUSDC', <YFIMark key="yvusdc" color={ASSET_INFO?.get('yvUSDC')!.color} />],
  ['MKR', <MakerMark key="mkr" />],
]);

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
    web3Active: false as boolean,
    fallbackActive: false as boolean,
    connectorName: null as string | null,
  },

  /* flags */
  chainLoading: true,

  /* Connected Contract Maps */
  contractMap: new Map<string, Contract>(),
  assetRootMap: new Map<string, IAssetRoot>(),
  seriesRootMap: new Map<string, ISeriesRoot>(),
  strategyRootMap: new Map<string, IStrategyRoot>(),
};

function chainReducer(state: any, action: any) {
  /* Helper: only change the state if different from existing */
  const onlyIfChanged = (_action: any) =>
    state[action.type] === _action.payload ? state[action.type] : _action.payload;

  /* Reducer switch */
  switch (action.type) {
    case 'chainLoading':
      return { ...state, chainLoading: onlyIfChanged(action) };

    case 'appVersion':
      return { ...state, appVersion: onlyIfChanged(action) };

    case 'connection':
      return { ...state, connection: onlyIfChanged(action) };

    case 'contractMap':
      return { ...state, contractMap: onlyIfChanged(action) };

    case 'addSeries':
      return {
        ...state,
        seriesRootMap: state.seriesRootMap.set(action.payload.id, action.payload),
      };

    case 'addAsset':
      return {
        ...state,
        assetRootMap: state.assetRootMap.set(action.payload.id, action.payload),
      };

    case 'addStrategy':
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

  const [lastAssetUpdate, setLastAssetUpdate] = useCachedState('lastAssetUpdate', 0);
  const [lastSeriesUpdate, setLastSeriesUpdate] = useCachedState('lastSeriesUpdate', 0);

  const [cachedAssets, setCachedAssets] = useCachedState('assets', []);
  const [cachedSeries, setCachedSeries] = useCachedState('series', []);
  const [cachedStrategies, setCachedStrategies] = useCachedState('strategies', []);

  /* Connection hook */
  const { connectionState, connectionActions } = useConnection();
  const { chainId, fallbackProvider, fallbackChainId } = connectionState;

  /**
   * Update on FALLBACK connection/state on network changes (id/library)
   */
  useEffect(() => {
    if (fallbackProvider && fallbackChainId) {
      console.log('Fallback ChainId: ', fallbackChainId);
      console.log('Primary ChainId: ', chainId);

      /* Get the instances of the Base contracts */
      const addrs = (yieldEnv.addresses as any)[fallbackChainId];

      let Cauldron: any;
      let Ladle: any;
      let ChainlinkMultiOracle: any;
      let CompositeMultiOracle: any;
      let Witch: any;
      let LidoWrapHandler: any;

      // arbitrum
      let ChainlinkUSDOracle: any;
      let AccumulatorMultiOracle: any;

      try {
        Cauldron = contracts.Cauldron__factory.connect(addrs.Cauldron, fallbackProvider);
        Ladle = contracts.Ladle__factory.connect(addrs.Ladle, fallbackProvider);
        Witch = contracts.Witch__factory.connect(addrs.Witch, fallbackProvider);

        if ([1, 4, 42].includes(fallbackChainId)) {
          ChainlinkMultiOracle = contracts.ChainlinkMultiOracle__factory.connect(
            addrs.ChainlinkMultiOracle,
            fallbackProvider
          );
          CompositeMultiOracle = contracts.CompositeMultiOracle__factory.connect(
            addrs.CompositeMultiOracle,
            fallbackProvider
          );
        }

        // arbitrum
        if ([421611].includes(fallbackChainId)) {
          ChainlinkUSDOracle = '';
          AccumulatorMultiOracle = '';
        }
      } catch (e) {
        console.log(e, 'Could not connect to contracts');
      }

      if (
        [1, 4, 42].includes(fallbackChainId) &&
        (!Cauldron || !Ladle || !ChainlinkMultiOracle || !CompositeMultiOracle || !Witch)
      )
        return;

      // arbitrum
      if (
        [421611].includes(fallbackChainId) &&
        (!Cauldron || !Ladle || ChainlinkUSDOracle || AccumulatorMultiOracle || !Witch)
      )
        return;

      /* Update the baseContracts state : ( hardcoded based on networkId ) */
      const newContractMap = chainState.contractMap;
      newContractMap.set('Cauldron', Cauldron);
      newContractMap.set('Ladle', Ladle);
      newContractMap.set('Witch', Witch);
      newContractMap.set('ChainlinkMultiOracle', ChainlinkMultiOracle);
      newContractMap.set('CompositeMultiOracle', CompositeMultiOracle);
      newContractMap.set('ChainlinkUSDOracle', ChainlinkUSDOracle);
      newContractMap.set('AccumulatorMultiOracle', AccumulatorMultiOracle);
      newContractMap.set('LidoWrapHandler', LidoWrapHandler);
      updateState({ type: 'contractMap', payload: newContractMap });

      /* Get the hardcoded strategy addresses */
      const strategyAddresses = (yieldEnv.strategies as any)[fallbackChainId];

      /* add on extra/calculated ASSET info and contract instances  (no async) */
      const _chargeAsset = (asset: any) => {
        /* attach either contract, (or contract of the wrappedToken ) */
        let baseContract = contracts.ERC20Permit__factory.connect(asset.address, fallbackProvider);
        if (asset.wrappedTokenAddress) {
          baseContract = contracts.ERC20Permit__factory.connect(asset.wrappedTokenAddress, fallbackProvider);
        }
        const ERC20Permit = contracts.ERC20Permit__factory.connect(asset.address, fallbackProvider);

        return {
          ...asset,
          digitFormat: ASSET_INFO.get(asset.symbol)?.digitFormat || 6,
          image: markMap.get(asset.displaySymbol),
          color: ASSET_INFO.get(asset.symbol)?.color || '#FFFFFF', // (yieldEnv.assetColors as any)[asset.symbol],
          baseContract,
          /* baked in token fns */
          getBalance: async (acc: string) =>
            /* if eth based get provider balance, if token based, get token balance (NOT of wrappedToken ) */
            ETH_BASED_ASSETS.includes(asset.idToUse) ? fallbackProvider?.getBalance(acc) : ERC20Permit.balanceOf(acc),
          getAllowance: async (acc: string, spender: string) => baseContract.allowance(acc, spender),
          // getAllowance: async (acc: string, spender: string) => ERC20Permit.allowance(acc, spender),
        };
      };

      const _getAssets = async () => {
        /* get all the assetAdded, oracleAdded and joinAdded events and series events at the same time */
        const blockNum = await fallbackProvider.getBlockNumber();
        const blockNumForUse = [1, 4, 42].includes(fallbackChainId) ? lastAssetUpdate : blockNum - 20000; // use last 1000 blocks if too much (arbitrum limit)

        const [assetAddedEvents, joinAddedEvents] = await Promise.all([
          // Cauldron.queryFilter('AssetAdded' as any, lastAssetUpdate),
          // Ladle.queryFilter('JoinAdded' as any, lastAssetUpdate),
          Cauldron.queryFilter('AssetAdded' as any, blockNumForUse),
          Ladle.queryFilter('JoinAdded' as any, blockNumForUse),
        ]);

        /* Create a map from the joinAdded event data */
        const joinMap: Map<string, string> = new Map(
          joinAddedEvents.map((log: any) => Ladle.interface.parseLog(log).args) as [[string, string]]
        );

        const newAssetList: any[] = [];
        await Promise.all(
          assetAddedEvents.map(async (x: any) => {
            const { assetId: id, asset: address } = Cauldron.interface.parseLog(x).args;

            /* Get the basic token info */
            const ERC20 = contracts.ERC20Permit__factory.connect(address, fallbackProvider);

            let name: string;
            let symbol: string;
            let decimals: number;
            let version: string;
            try {
              [name, symbol, decimals, version] = await Promise.all([
                ERC20.name(),
                ERC20.symbol(),
                ERC20.decimals(),
                id === USDC ? '2' : '1', // TODO ERC20.version()
              ]);
            } catch (e) {
              /* TODO look at finding a better way to handle Maker Token */
              const mkrABI = ['function name() view returns (bytes32)', 'function symbol() view returns (bytes32)'];
              const mkrERC20 = new ethers.Contract(address, mkrABI, fallbackProvider);
              [name, symbol, decimals, version] = await Promise.all([
                mkrERC20.name(),
                mkrERC20.symbol(),
                Promise.resolve(18),
                Promise.resolve('1'),
              ]);
            }

            const assetInfo = ASSET_INFO.get(symbol) as IAssetInfo;
            const idToUse = assetInfo?.wrappedTokenId || id;

            const newAsset = {
              id,
              address,
              name,

              symbol,
              decimals,
              version,

              joinAddress: joinMap.get(idToUse),
              idToUse,

              displaySymbol: assetInfo?.displaySymbol || symbol,

              isWrappedToken: assetInfo?.isWrappedToken,
              wrapHandlerAddress: assetInfo?.wrapHandlerAddress,
              wrappedTokenId: assetInfo?.wrappedTokenId,
              wrappedTokenAddress: assetInfo?.wrappedTokenAddress,
              unwrappedTokenId: assetInfo?.unwrappedTokenId,
              showToken: assetInfo?.showToken || false,
            };

            // Update state and cache
            updateState({ type: 'addAsset', payload: _chargeAsset(newAsset) });
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
        const poolContract = contracts.Pool__factory.connect(series.poolAddress, fallbackProvider);
        const fyTokenContract = contracts.FYToken__factory.connect(series.fyTokenAddress, fallbackProvider);

        const season = getSeason(series.maturity) as SeasonType;
        const oppSeason = (_season: SeasonType) => getSeason(series.maturity + 23670000) as SeasonType;
        const [startColor, endColor, textColor]: string[] = seasonColorMap.get(season)!;
        const [oppStartColor, oppEndColor, oppTextColor]: string[] = seasonColorMap.get(oppSeason(season))!;
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
          isMature: async () => series.maturity < (await fallbackProvider.getBlock('latest')).timestamp,
          getBaseAddress: () => chainState.assetRootMap.get(series.baseId).address, // TODO refactor to get this static - if possible?
        };
      };

      const _getSeries = async () => {
        const blockNum = await fallbackProvider.getBlockNumber();
        /* NBNBNBNBNBBN this is PPPPPOOOOR logic marco... please be exlpicit > */
        const blockNumForUse = [1, 4, 42].includes(fallbackChainId) ? lastSeriesUpdate : blockNum - 20000; // use last 1000 blocks if too much (arbitrum limit)

        /* get poolAdded events and series events at the same time */
        const [seriesAddedEvents, poolAddedEvents] = await Promise.all([
          // Cauldron.queryFilter('SeriesAdded' as any, lastSeriesUpdate),
          // Ladle.queryFilter('PoolAdded' as any, lastSeriesUpdate),
          Cauldron.queryFilter('SeriesAdded' as any, blockNumForUse),
          Ladle.queryFilter('PoolAdded' as any, blockNumForUse),
        ]);

        /* build a map from the poolAdded event data */
        const poolMap: Map<string, string> = new Map(
          poolAddedEvents.map((log: any) => Ladle.interface.parseLog(log).args) as [[string, string]]
        );

        const newSeriesList: any[] = [];

        /* Add in any extra static series */
        try {
          await Promise.all([
            ...seriesAddedEvents.map(async (x: any): Promise<void> => {
              const { seriesId: id, baseId, fyToken } = Cauldron.interface.parseLog(x).args;
              const { maturity } = await Cauldron.series(id);

              if (poolMap.has(id)) {
                // only add series if it has a pool
                const poolAddress: string = poolMap.get(id) as string;
                const poolContract = contracts.Pool__factory.connect(poolAddress, fallbackProvider);
                const fyTokenContract = contracts.FYToken__factory.connect(fyToken, fallbackProvider);
                const [name, symbol, version, decimals, poolName, poolVersion, poolSymbol] = await Promise.all([
                  fyTokenContract.name(),
                  fyTokenContract.symbol(),
                  fyTokenContract.version(),
                  fyTokenContract.decimals(),
                  poolContract.name(),
                  poolContract.version(),
                  poolContract.symbol(),
                  // poolContract.decimals(),
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
                };
                updateState({ type: 'addSeries', payload: _chargeSeries(newSeries) });
                newSeriesList.push(newSeries);
              }
            }),
          ]);
        } catch (e) {
          console.log('Error fetching series data: ', e);
        }
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
            strategyAddresses.map(async (strategyAddr: string) => {
              /* if the strategy is already in the cache : */
              if (cachedStrategies.findIndex((_s: any) => _s.address === strategyAddr) === -1) {
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
                updateState({ type: 'addStrategy', payload: _chargeStrategy(newStrategy) });
                newStrategyList.push(newStrategy);
              }
            })
          );
        } catch (e) {
          console.log('Error getching strategies', e);
        }

        setCachedStrategies([...cachedStrategies, ...newStrategyList]);
        console.log('Yield Protocol Strategy data updated.');
      };

      /**
       * LOAD the Series and Assets *
       * */
      if (cachedAssets.length === 0 || cachedSeries.length === 0) {
        console.log('FIRST LOAD: Loading Asset, Series and Strategies data ');
        (async () => {
          await Promise.all([_getAssets(), _getSeries(), _getStrategies()]);
          updateState({ type: 'chainLoading', payload: false });
        })();
      } else {
        // get assets, series and strategies from cache and 'charge' them, and add to state:
        cachedAssets.forEach((a: IAssetRoot) => {
          updateState({ type: 'addAsset', payload: _chargeAsset(a) });
        });
        cachedSeries.forEach((s: ISeriesRoot) => {
          updateState({ type: 'addSeries', payload: _chargeSeries(s) });
        });
        cachedStrategies.forEach((st: IStrategyRoot) => {
          updateState({ type: 'addStrategy', payload: _chargeStrategy(st) });
        });

        updateState({ type: 'chainLoading', payload: false });

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
      clearCachedItems([
        'lastAppVersion',
        'lastChainId',
        'assets',
        'series',
        'lastAssetUpdate',
        'lastSeriesUpdate',
        'strategies',
        'lastStrategiesUpdate',
      ]);
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
      type: 'connection',
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
  ]);

  /* simply Pass on the connection actions */
  const chainActions = connectionActions;

  return <ChainContext.Provider value={{ chainState, chainActions }}>{children}</ChainContext.Provider>;
};

export { ChainContext, ChainProvider };
