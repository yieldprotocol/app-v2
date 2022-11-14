import { BigNumber, ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount } from 'wagmi';
import { WETH } from '../config/assets';
import { ChainContext } from '../contexts/ChainContext';
import { IAsset } from '../types';
import useDefaultProvider from './useDefaultProvider';

/**
 * Fetch all asset data
 */
const useAssets = () => {
  const {
    chainState: { assetRootMap },
  } = useContext(ChainContext);

  const { address: account } = useAccount();
  const provider = useDefaultProvider();

  const getAssets = async () => {
    return [...assetRootMap.values()].reduce(async (acc, a) => {
      const asset = assetRootMap.get(a.id);

      if (!asset) return await acc;

      const args = asset.tokenIdentifier ? [account, asset.tokenIdentifier] : [account]; // handle erc1155
      const balance: BigNumber = !account
        ? ethers.constants.Zero
        : a.id === WETH
        ? await provider.getBalance(account)
        : await asset.assetContract.balanceOf(...args);

      return (await acc).set(a.id, {
        ...asset,
        balance: { value: balance, formatted: formatUnits(balance, asset.decimals) },
      });
    }, Promise.resolve(new Map<string, IAsset>()));
  };

  const key = useMemo(() => {
    return assetRootMap.size ? ['assets', assetRootMap, account] : null;
  }, [account, assetRootMap]);

  const { data, error } = useSWRImmutable(key, getAssets);

  return {
    data,
    isLoading: !data && !error,
    key,
  };
};

export default useAssets;
