import useSWR, { mutate } from 'swr';
import { VYToken__factory } from '../../contracts';
import { useCallback, useContext, useMemo } from 'react';
import useFork from '../useFork';
import useDefaultProvider from '../useDefaultProvider';
import useAccountPlus from '../useAccountPlus';
import { ISignable } from '../../types';
import { BigNumber, ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils.js';
import { ChainContext } from '../../contexts/ChainContext';
import { MulticallContext } from '../../contexts/MutlicallContext';
import { useApr } from '../useApr';
import { ActionType } from '../../types';

export interface IVYToken extends ISignable {
  id: string; // vyToken address
  decimals: number;
  baseAddress: string; // associated base addr
  baseId: string; // associated base id
  displayName: string;
  displayNameMobile: string;
  balance: BigNumber;
  balance_: string;
  vyTokenBaseVal: BigNumber;
  vyTokenBaseVal_: string;
  proxyAddress: string;
  accumulatedInterestInBase_: string;
}

const useVYTokens = () => {
  const { multicall: _multicall, forkMulticall } = useContext(MulticallContext);
  const { address: account } = useAccountPlus();
  const { useForkedEnv, provider: forkProvider, forkUrl } = useFork();
  const provider = useDefaultProvider();
  const { apr } = useApr(undefined, ActionType.LEND, null);

  const {
    chainState: { assetRootMap },
  } = useContext(ChainContext);

  const providerToUse = useForkedEnv && forkProvider ? forkProvider : provider;
  const multicall = useForkedEnv ? forkMulticall : _multicall;

  const get = useCallback(async () => {
    console.log('getting vyToken data');
    return await Array.from(assetRootMap.values())
      .map((a) => [a.VYTokenProxyAddress, a.VYTokenAddress]) // get asset's vyTokenProxy addr
      .reduce(async (vyTokens, [proxyAddress, address]) => {
        if (!address || !proxyAddress) return await vyTokens;

        const _contract = VYToken__factory.connect(address, providerToUse);
        const _proxy = VYToken__factory.connect(proxyAddress, providerToUse);
        const contract = multicall?.wrap(_contract)!;
        const proxy = multicall?.wrap(_proxy)!;

        const [name, symbol, decimals, version, baseAddress, baseId, balance] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
          contract.version(),
          contract.underlying(),
          contract.underlyingId(),
          account ? proxy.balanceOf(account) : ethers.constants.Zero,
        ]);

        let vyTokenBaseVal = balance;
        try {
          vyTokenBaseVal = await proxy.previewRedeem(balance);
        } catch (e) {
          console.log('Error getting vyTokenBaseVal', e);
        }

        const addr = address.toLowerCase();
        const data: IVYToken = {
          id: addr,
          address: addr,
          name,
          symbol,
          decimals,
          version,
          baseAddress: baseAddress.toLowerCase(),
          baseId,
          displayName: name,
          displayNameMobile: name,
          balance,
          balance_: formatUnits(balance, decimals),
          vyTokenBaseVal,
          vyTokenBaseVal_: formatUnits(vyTokenBaseVal, decimals),
          proxyAddress: proxyAddress.toLowerCase(),
          accumulatedInterestInBase_: '0.0',
        };

        return (await vyTokens).set(addr, data);
      }, Promise.resolve(new Map<string, IVYToken>()));
  }, [account, assetRootMap, multicall, providerToUse]);

  const key = useMemo(
    () => ['vyTokens', forkUrl, useForkedEnv, account, assetRootMap],
    [account, assetRootMap, forkUrl, useForkedEnv]
  );

  const { data, error, isLoading, isValidating } = useSWR(key, get, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    shouldRetryOnError: false,
  });

  return { data, error, isLoading: isLoading || isValidating, key };
};

export default useVYTokens;
