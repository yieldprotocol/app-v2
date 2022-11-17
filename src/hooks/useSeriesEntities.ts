import useSWRImmutable from 'swr/immutable';
import { useCallback, useMemo } from 'react';
import useChainId from './useChainId';
import { useAccount } from 'wagmi';
import { getSeriesEntities, mapify } from '../lib/seriesEntities';
import useDefaultProvider from './useDefaultProvider';
import useContracts, { ContractNames } from './useContracts';
import { Cauldron, FYToken__factory } from '../contracts';
import { ISeries } from '../types';
import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

const useSeriesEntities = (seriesMap?: Map<string, ISeries>) => {
  const provider = useDefaultProvider();

  const { address: account } = useAccount();
  const chainId = useChainId();
  const contracts = useContracts();
  const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron | undefined;

  // just attaches the fyToken balance for each series
  const _getSeriesEntities = useCallback(async () => {
    if (!Cauldron || !seriesMap) return;

    return [...seriesMap.values()].reduce(async (acc, seriesEntity) => {
      const fyTokenContract = FYToken__factory.connect(seriesEntity.address, provider);
      const fyTokenBalance = account ? await fyTokenContract.balanceOf(account) : ethers.constants.Zero;

      return (await acc).set(seriesEntity.id, {
        ...seriesEntity,
        fyTokenBalance: { value: fyTokenBalance, formatted: formatUnits(fyTokenBalance, seriesEntity.decimals) },
      });
    }, Promise.resolve(new Map<string, ISeries>()));
  }, [Cauldron, account, provider, seriesMap]);

  // need to have seriesMap from ssr already (don't want to refetch all seriesEntity data again)
  const key = useMemo(
    () => (chainId && seriesMap ? ['seriesEntities', chainId, account] : null),
    [account, chainId, seriesMap]
  );

  const { data, error } = useSWRImmutable(key, _getSeriesEntities);

  return { data, error, isLoading: !data && !error };
};

export default useSeriesEntities;
