import useSWRImmutable from 'swr/immutable';
import { useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Cauldron } from '../contracts';
import useChainId from './useChainId';
import useContracts, { ContractNames } from './useContracts';
import useDefaultProvider from './useDefaultProvider';
import { getSeriesEntityDynamic } from '../lib/seriesEntities';
import useTimeTillMaturity from './useTimeTillMaturity';
import { sellFYToken, ZERO_BN } from '@yield-protocol/ui-math';
import { ethers } from 'ethers';

const useSeriesEntity = (id?: string) => {
  const { address: account } = useAccount();
  const provider = useDefaultProvider();
  const chainId = useChainId();
  const contracts = useContracts();
  const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron | undefined;
  const { isMature, getTimeTillMaturity } = useTimeTillMaturity();

  const _getSeriesEntity = useCallback(async () => {
    if (!Cauldron || !id) return;
    console.log(`fetching series entity with id: ${id}`);
    return await getSeriesEntityDynamic(provider, Cauldron, chainId, id, account);
  }, [Cauldron, account, chainId, id, provider]);

  const getCurrentValue = async (id: string) => {
    if (!Cauldron) return;
    const seriesEntity = await getSeriesEntityDynamic(provider, Cauldron, chainId, id, account);
    const currentValue = isMature(seriesEntity.maturity)
      ? seriesEntity.fyTokenBalance.value || ZERO_BN
      : sellFYToken(
          seriesEntity.sharesReserves.value,
          seriesEntity.fyTokenReserves.value,
          seriesEntity.fyTokenBalance.value || ethers.constants.Zero,
          getTimeTillMaturity(seriesEntity.maturity),
          seriesEntity.ts,
          seriesEntity.g2,
          seriesEntity.decimals,
          seriesEntity.c,
          seriesEntity.mu
        );

    return currentValue.lte(ethers.constants.Zero) && seriesEntity.fyTokenBalance.value.gt(ethers.constants.Zero)
      ? seriesEntity.fyTokenBalance.formatted
      : ethers.utils.formatUnits(currentValue, seriesEntity.decimals);
  };

  const key = useMemo(() => (chainId && id ? ['seriesEntity', id, chainId, account] : null), [account, chainId, id]);

  const { data, error, isValidating } = useSWRImmutable(key, _getSeriesEntity);

  return { data, error, isLoading: (!data && !error) || isValidating, key, getCurrentValue };
};

export default useSeriesEntity;
