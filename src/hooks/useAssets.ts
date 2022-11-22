import { BigNumber, Contract, ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount } from 'wagmi';
import { ASSETS_1, ASSETS_42161, WETH } from '../config/assets';
import markMap from '../config/marks';
import { SettingsContext } from '../contexts/SettingsContext';
import { ERC1155__factory, ERC20Permit__factory, ERC20__factory } from '../contracts';
import { IAsset, IAssetRoot, TokenType } from '../types';
import useChainId from './useChainId';
import useDefaultProvider from './useDefaultProvider';

/**
 * Fetch all asset data
 */
const useAssets = () => {
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);
  const { address: account } = useAccount();
  const provider = useDefaultProvider();
  const chainId = useChainId();

  /* add on extra/calculated ASSET info and contract instances  (no async) */
  const _chargeAsset = useCallback(
    (asset: any): IAssetRoot => {
      /* attach either contract, (or contract of the wrappedToken ) */

      let assetContract: Contract;
      let getAllowance: (acc: string, spender: string, asset?: string) => Promise<BigNumber>;
      let setAllowance: ((spender: string) => Promise<BigNumber | void>) | undefined;

      const assetMap = chainId === 1 ? ASSETS_1 : ASSETS_42161;

      switch (asset.tokenType) {
        case TokenType.ERC20_:
          assetContract = ERC20__factory.connect(asset.address, provider);
          getAllowance = async (acc: string, spender: string) => assetContract.allowance(acc, spender);
          break;

        case TokenType.ERC1155_:
          assetContract = ERC1155__factory.connect(asset.address, provider);
          getAllowance = async (acc: string, spender: string) => assetContract.isApprovedForAll(acc, spender);
          setAllowance = async (spender: string) => {
            console.log(spender);
            console.log(asset.address);
            assetContract.setApprovalForAll(spender, true);
          };
          break;

        default:
          // Default is ERC20Permit;
          assetContract = ERC20Permit__factory.connect(asset.address, provider);
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
      const cachedAssets: Map<string, IAssetRoot> = cachedValues.reduce((acc: Map<string, IAssetRoot>, a: any) => {
        return acc.set(a.id, _chargeAsset(a));
      }, new Map<string, IAssetRoot>());
      return cachedAssets;
    }

    const assetMap = chainId === 1 ? ASSETS_1 : ASSETS_42161;
    const newAssetList: IAssetRoot[] = [];

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
          const contract = ERC20__factory.connect(assetInfo.assetAddress, provider);
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
          const contract = ERC20Permit__factory.connect(assetInfo.assetAddress, provider);
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

        return _chargeAsset(newAsset);
      })
    ).catch(() => console.log('Problems getting Asset data. Check addresses in asset config.'));

    console.log('Yield Protocol Asset data updated successfully.');

    /* cache results */
    newAssetList.length && localStorage.setItem(cacheKey, JSON.stringify(newAssetList));
    newAssetList.length && console.log('Yield Protocol Asset data retrieved successfully.');

    return newAssetList.reduce((acc, a) => {
      return acc.set(a.id, a);
    }, new Map<string, IAssetRoot>());
  }, [_chargeAsset, chainId, diagnostics, provider]);

  const getAssets = useCallback(async () => {
    console.log('fetching assets');
    return [...(await _getAssets()).values()].reduce(async (acc, asset) => {
      const args = asset.tokenIdentifier ? [account, asset.tokenIdentifier] : [account]; // handle erc1155
      const balance: BigNumber = !account
        ? ethers.constants.Zero
        : asset.id === WETH
        ? await provider.getBalance(account)
        : await asset.assetContract.balanceOf(...args);

      return (await acc).set(asset.id, {
        ...asset,
        balance: { value: balance, formatted: formatUnits(balance, asset.decimals) },
      });
    }, Promise.resolve(new Map<string, IAsset>()));
  }, [_getAssets, account, provider]);

  const key = useMemo(() => {
    return chainId ? ['assets', chainId, account] : null;
  }, [account, chainId]);

  const { data, error } = useSWRImmutable(key, getAssets);

  return {
    data,
    isLoading: !data && !error,
    key,
  };
};

export default useAssets;
