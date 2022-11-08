import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import useSWR from 'swr';
import { useAccount } from 'wagmi';
import { UserContext } from '../contexts/UserContext';
import { IAsset } from '../types';
import useChainId from './useChainId';

/**
 * Gets all asset balances
 * @returns assetMap values with balance added
 */

const useBalances = () => {
  const {
    userState: { assetMap },
  } = useContext(UserContext);

  const chainId = useChainId();
  const { address: account } = useAccount();

  const getBalances = async () => {
    return await [...assetMap.values()].reduce(async (acc, asset) => {
      const args = asset.tokenIdentifier ? [account, asset.tokenIdentifier] : [account]; // handle erc1155 tokens with tokenIdentifier
      const balance = (await asset.assetContract.balanceOf(...args)) as BigNumber;
      const balance_ = ethers.utils.formatUnits(balance, asset.decimals);
      const _asset = assetMap.get(asset.id);

      if (!_asset) return await acc;

      return (await acc).set(_asset.address, { ..._asset, balance, balance_ });
    }, Promise.resolve(new Map<string, IAsset>()));
  };

  /**
   * Fetch all account's balances based on chainId
   * Don't fetch if no account
   * */
  const { data, error } = useSWR(
    account && chainId && assetMap.size ? `/balances?chainId=${chainId}&account=${account}` : null,
    getBalances,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3_600_000, // don't refetch for an hour
    }
  );

  return { data, error, isLoading: !data && !error };
};

export default useBalances;
