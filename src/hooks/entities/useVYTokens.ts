import useSWR from 'swr';
import { VYToken__factory } from '../../contracts';
import { useCallback, useContext, useMemo } from 'react';
import useFork from '../useFork';
import { UserContext } from '../../contexts/UserContext';
import useDefaultProvider from '../useDefaultProvider';
import useAccountPlus from '../useAccountPlus';
import { ISignable } from '../../types';

export interface IVYToken extends ISignable {
  id: string; // vyToken address
  decimals: number;
  baseAddress: string; // associated base addr
  baseId: string; // associated base id
  displayName?: string;
  displayNameMobile?: string;
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
      .map((a) => a.VYTokenProxyAddress) // get asset's vyTokenProxy addr
      .reduce(async (vyTokens, address) => {
        if (!address) return await vyTokens;

        const contract = VYToken__factory.connect(address, useForkedEnv && forkProvider ? forkProvider : provider);
        const [name, symbol, decimals, version, baseAddress, baseId] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
          contract.version(),
          contract.underlying(),
          contract.underlyingId(),
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
          displayName: `Variable Rate ${name.substring(2)}`,
          displayNameMobile: `Variable Rate ${name.substring(2)}`,
        };

        return (await vyTokens).set(address, data);
      }, Promise.resolve(new Map<string, IVYToken>()));
  }, [assetMap, forkProvider, provider, useForkedEnv]);

  const key = useMemo(
    () => ['lendPositionsVR', account, assetMap, forkProvider, provider, useForkedEnv],
    [account, assetMap, forkProvider, provider, useForkedEnv]
  );

  const { data, error, isLoading } = useSWR(key, get, { revalidateOnFocus: false });

  return { data, error, isLoading };
};

export default useVYTokens;
