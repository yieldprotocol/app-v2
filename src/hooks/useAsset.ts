import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount } from 'wagmi';
import { WETH } from '../config/assets';
import { ChainContext } from '../contexts/ChainContext';
import { IAsset } from '../types';
import useDefaultProvider from './useDefaultProvider';

/**
 * Fetch a single asset's data
 * @param id asset id
 */
const useAsset = (id?: string) => {
  const {
    chainState: { assetRootMap },
  } = useContext(ChainContext);

  const provider = useDefaultProvider();

  const { address: account } = useAccount();

  const getAsset = async (id: string): Promise<IAsset> => {
    const asset = assetRootMap.get(id);

    if (!asset) throw new Error('no asset');

    const args = asset.tokenIdentifier ? [account, asset.tokenIdentifier] : [account]; // handle erc1155
    const balance: BigNumber =
      id === WETH ? await provider.getBalance(account!) : await asset.assetContract.balanceOf(...args);

    return {
      ...asset,
      balance: { value: balance, formatted: formatUnits(balance, asset.decimals) },
    };
  };

  const key = useMemo(() => (id ? ['asset', id, assetRootMap, account] : null), [account, assetRootMap, id]);

  const { data, error } = useSWRImmutable(key, () => getAsset(id!));

  return {
    data,
    isLoading: !data && !error,
    key,
    getAsset,
  };
};

export default useAsset;
