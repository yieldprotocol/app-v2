import React, { createContext, Dispatch, ReactNode, useCallback, useEffect, useReducer, useContext } from 'react';
import { BigNumber, Contract } from 'ethers';

import { useCachedState } from '../hooks/generalHooks';

import * as contractTypes from '../contracts';
import { IAssetRoot, IStrategyRoot, TokenType } from '../types';
import { ASSETS_1, ASSETS_42161 } from '../config/assets';

import markMap from '../config/marks';

import { toast } from 'react-toastify';
import useChainId from '../hooks/useChainId';
import useContracts from '../hooks/useContracts';
import { ChainContextActions, ChainState, IChainContextActions, IChainContextState } from './types/chain';
import useDefaultProvider from '../hooks/useDefaultProvider';
import { SettingsContext } from './SettingsContext';

const initState: IChainContextState = {
  /* flags */
  chainLoaded: 0,
  assetRootMap: new Map<string, IAssetRoot>(),
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

    case ChainState.ADD_ASSET:
      return {
        ...state,
        assetRootMap: new Map(state.assetRootMap.set(action.payload.id, action.payload)),
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
  const provider = useDefaultProvider();
  const chainId = useChainId();
  const contracts = useContracts();

  /* SIMPLE CACHED VARIABLES */
  const [lastAppVersion, setLastAppVersion] = useCachedState('lastAppVersion', '');

  /* add on extra/calculated ASSET info and contract instances  (no async) */
  const _chargeAsset = useCallback(
    (asset: any) => {
      /* attach either contract, (or contract of the wrappedToken ) */

      let assetContract: Contract;
      let getAllowance: (acc: string, spender: string, asset?: string) => Promise<BigNumber>;
      let setAllowance: ((spender: string) => Promise<BigNumber | void>) | undefined;

      const assetMap = chainId === 1 ? ASSETS_1 : ASSETS_42161;

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
    [chainId, provider]
  );

  const _getAssets = useCallback(async () => {
    // handle cache
    const cacheKey = `assets_${chainId}`;
    const cachedValues = JSON.parse(localStorage.getItem(cacheKey)!);

    if (cachedValues !== null && cachedValues.length) {
      console.log('Yield Protocol ASSET data retrieved ::: CACHE :::');
      return cachedValues.forEach((a: IAssetRoot) => {
        updateState({ type: ChainState.ADD_ASSET, payload: _chargeAsset(a) });
      });
    }

    const assetMap = chainId === 1 ? ASSETS_1 : ASSETS_42161;
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
            diagnostics &&
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
            diagnostics &&
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

    console.log('Yield Protocol Asset data updated successfully.');

    /* cache results */
    newAssetList.length && localStorage.setItem(cacheKey, JSON.stringify(newAssetList));
    newAssetList.length && console.log('Yield Protocol Asset data retrieved successfully.');
  }, [_chargeAsset, chainId, diagnostics, provider]);

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

  const _getProtocolData = useCallback(async () => {
    /* Clear maps in local app memory  ( note: this is not the cache ) and set chainLoaded false */
    updateState({ type: ChainState.CLEAR_MAPS });

    console.log(
      'Fetching Protocol contract addresses and checking for new Assets and Series, and Strategies : ',
      chainId
    );

    await Promise.all([_getAssets(), _getStrategies()])
      .catch(() => {
        toast.error('Error getting Yield Protocol data.');
        console.log('Error getting Yield Protocol data.');
      })
      .finally(() => {
        updateState({ type: ChainState.CHAIN_LOADED, payload: chainId });
      });
  }, [_getAssets, _getStrategies, chainId]);

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
    _getProtocolData();
  }, [_getProtocolData]);

  /**
   * functionality to export protocol addresses
   */
  const exportContractAddresses = () => {
    const contractList = [...contracts].map(([v, k]) => [v, k.address]);
    // const seriesList = [...chainState.seriesRootMap].map(([v, k]) => [v, k.address]);
    const assetList = [...chainState.assetRootMap].map(([v, k]) => [v, k.address]);
    const strategyList = [...chainState.strategyRootMap].map(([v, k]) => [k.symbol, v]);
    const joinList = [...chainState.assetRootMap].map(([v, k]) => [v, k.joinAddress]);

    const res = JSON.stringify({
      contracts: contractList,
      // series: seriesList,
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
