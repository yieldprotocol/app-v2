import useSWR, { useSWRConfig } from 'swr';
import { VYToken__factory } from '../../contracts';
import { useCallback, useContext, useMemo } from 'react';
import useFork from '../useFork';
import useDefaultProvider from '../useDefaultProvider';
import useAccountPlus from '../useAccountPlus';
import { ISignable } from '../../types';
import { BigNumber, ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils.js';
import { ChainContext } from '../../contexts/ChainContext';

export interface IVYToken extends ISignable {
  id: string; // vyToken address
  decimals: number;
  baseAddress: string; // associated base addr
  baseId: string; // associated base id
  displayName: string;
  displayNameMobile: string;
  balance: BigNumber;
  balance_: string;
  proxyAddress: string;
}

const useVYTokens = () => {
  const { mutate: _mutate } = useSWRConfig();
  const { address: account } = useAccountPlus();
  const { useForkedEnv, provider: forkProvider, forkUrl } = useFork();
  const provider = useDefaultProvider();
  const {
    chainState: { assetRootMap },
  } = useContext(ChainContext);

  const providerToUse = useForkedEnv && forkProvider ? forkProvider : provider;

  const get = useCallback(async () => {
    console.log('getting vyToken data');
    return await Array.from(assetRootMap.values())
      .map((a) => [a.VYTokenProxyAddress, a.VYTokenAddress]) // get asset's vyTokenProxy addr
      .reduce(async (vyTokens, [proxyAddress, address]) => {
        if (!address || !proxyAddress) return await vyTokens;

        const contract = VYToken__factory.connect(address, providerToUse);
        const proxy = VYToken__factory.connect(proxyAddress, providerToUse);
        const [name, symbol, decimals, version, baseAddress, baseId, balance] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
          contract.version(),
          contract.underlying(),
          contract.underlyingId(),
          account ? proxy.balanceOf(account) : ethers.constants.Zero,
        ]);

        const data: IVYToken = {
          id: address,
          address,
          name,
          symbol,
          decimals,
          version,
          baseAddress,
          baseId,
          displayName: name,
          displayNameMobile: name,
          balance,
          balance_: formatUnits(balance, decimals),
          proxyAddress,
        };

        return (await vyTokens).set(address, data);
      }, Promise.resolve(new Map<string, IVYToken>()));
  }, [account, assetRootMap, providerToUse]);

  const key = useMemo(
    () => ['vyTokens', forkUrl, useForkedEnv, account, assetRootMap],
    [account, assetRootMap, forkUrl, useForkedEnv]
  );

  const { data, error, isLoading } = useSWR(key, get, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  return { data, error, isLoading, key };
};

export default useVYTokens;
