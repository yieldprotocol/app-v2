import useSWR from 'swr';
import { VYToken__factory } from '../../contracts';
import { useCallback, useContext, useMemo } from 'react';
import useFork from '../useFork';
import { UserContext } from '../../contexts/UserContext';
import useDefaultProvider from '../useDefaultProvider';
import useAccountPlus from '../useAccountPlus';
import { ISignable } from '../../types';
import { BigNumber, ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils.js';

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
  const { address: account } = useAccountPlus();
  const { useForkedEnv, provider: forkProvider } = useFork();
  const provider = useDefaultProvider();
  const {
    userState: { assetMap },
  } = useContext(UserContext);

  const get = useCallback(async () => {
    return await Array.from(assetMap.values())
      .map((a) => [a.VYTokenProxyAddress, a.VYTokenAddress]) // get asset's vyTokenProxy addr
      .reduce(async (vyTokens, [proxyAddress, address]) => {
        if (!address || !proxyAddress) return await vyTokens;

        const _provider = useForkedEnv && forkProvider ? forkProvider : provider;
        const contract = VYToken__factory.connect(address, _provider);
        const proxy = VYToken__factory.connect(proxyAddress, _provider);
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
  }, [account, assetMap, forkProvider, provider, useForkedEnv]);

  const key = useMemo(
    () => ['vyTokens', account, assetMap, forkProvider, provider, useForkedEnv],
    [account, assetMap, forkProvider, provider, useForkedEnv]
  );

  const { data, error, isLoading } = useSWR(key, get, { revalidateOnFocus: false, revalidateIfStale: false });

  return { data, error, isLoading };
};

export default useVYTokens;
