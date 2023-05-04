import useSWR from 'swr';
import { VYToken__factory, VRInterestRateOracle__factory } from '../../contracts';
import { useCallback, useContext, useMemo } from 'react';
import useFork from '../useFork';
import useDefaultProvider from '../useDefaultProvider';
import useAccountPlus from '../useAccountPlus';
import { ISignable } from '../../types';
import { BigNumber, ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils.js';
import { ChainContext } from '../../contexts/ChainContext';
import { MulticallContext } from '../../contexts/MutlicallContext';
import { ContractNames } from '../../config/contracts';
import * as contractTypes from '../../contracts';
import useContracts from '../useContracts';
import { RATE, CHI } from '../../utils/constants';
import { bytesToBytes32 } from '@yield-protocol/ui-math';
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
  proxyAddress: string;
  accumulatedInterestInBase_: string;
}

const useVYTokens = () => {
  const { multicall: _multicall, forkMulticall } = useContext(MulticallContext);
  const { address: account } = useAccountPlus();
  const { useForkedEnv, provider: forkProvider, forkUrl } = useFork();
  const provider = useDefaultProvider();
  const contracts = useContracts();

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

        // const contract = multicall?.wrap(VYToken__factory.connect(address, providerToUse))!;
        // const proxy = multicall?.wrap(VYToken__factory.connect(proxyAddress, providerToUse))!;

        const contract = VYToken__factory.connect(address, providerToUse)!;
        const proxy = VYToken__factory.connect(proxyAddress, providerToUse)!;

        const [name, symbol, decimals, version, baseAddress, baseId, balance] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
          contract.version(),
          contract.underlying(),
          contract.underlyingId(),
          account ? proxy.balanceOf(account) : ethers.constants.Zero,
        ]);

        try {
          const underlyingAmount = await contract.convertToUnderlying(balance);
          console.log('convertToUnderlying', formatUnits(underlyingAmount, decimals));
          // Calculate the interest accrued
          // const interestAccrued = underlyingAmount.mul(ethers.BigNumber.from(apr)).div(ethers.constants.WeiPerEther);
          // console.log('Interest accrued:', formatUnits(interestAccrued, decimals), );
        } catch (e) {
          console.log('error in useVYTokens', e, bytesToBytes32(baseId, 6));
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
          proxyAddress: proxyAddress.toLowerCase(),
          accumulatedInterestInBase_: '0.0',
        };

        return (await vyTokens).set(addr, data);
      }, Promise.resolve(new Map<string, IVYToken>()));
  }, [account, assetRootMap, providerToUse]);

  const key = useMemo(
    () => ['vyTokens', forkUrl, useForkedEnv, account, assetRootMap],
    [account, assetRootMap, forkUrl, useForkedEnv]
  );

  const { data, error, isLoading } = useSWR(key, get, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
  });

  return { data, error, isLoading, key };
};

export default useVYTokens;
