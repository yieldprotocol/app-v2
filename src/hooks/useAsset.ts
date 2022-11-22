import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount } from 'wagmi';
import { WETH } from '../config/assets';
import { IAsset } from '../types';
import useAssets from './useAssets';
import useDefaultProvider from './useDefaultProvider';

/**
 * Fetch a single asset's data
 * @param id asset id
 */
const useAsset = (id?: string) => {
  const { data: assets } = useAssets();
  const provider = useDefaultProvider();
  const { address: account } = useAccount();

  const getAsset = useCallback(
    async (id: string): Promise<IAsset | undefined> => {
      if (!assets) return;

      console.log(`fetching asset with id: ${id}`);
      const asset = assets.get(id);

      if (!asset) throw new Error('no asset');

      const args = asset.tokenIdentifier ? [account, asset.tokenIdentifier] : [account]; // handle erc1155
      const balance: BigNumber =
        id === WETH ? await provider.getBalance(account!) : await asset.assetContract.balanceOf(...args);

      return {
        ...asset,
        balance: { value: balance, formatted: formatUnits(balance, asset.decimals) },
      };
    },
    [account, assets, provider]
  );

  const key = useMemo(() => (id ? ['asset', assets, id, account] : null), [account, assets, id]);

  const { data, error } = useSWRImmutable(key, () => getAsset(id!));

  return {
    data,
    isLoading: !data && !error,
    key,
    getAsset,
  };
};

export default useAsset;
