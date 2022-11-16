import useSWRImmutable from 'swr/immutable';
import { useCallback, useMemo } from 'react';
import useChainId from './useChainId';
import { useAccount } from 'wagmi';
import { getSeriesEntities, mapify } from '../lib/seriesEntities';
import useDefaultProvider from './useDefaultProvider';
import useContracts, { ContractNames } from './useContracts';
import { Cauldron } from '../contracts';
import { ISeries } from '../types';

const useSeriesEntities = () => {
  const provider = useDefaultProvider();

  const { address: account } = useAccount();
  const chainId = useChainId();
  const contracts = useContracts();
  const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron | undefined;

  const _getSeriesEntities = useCallback(
    async (chainId: number) => {
      if (!Cauldron) return;
      return await getSeriesEntities(provider, Cauldron, chainId);
    },
    [Cauldron, provider]
  );

  const key = useMemo(() => (chainId ? ['seriesEntities', chainId, account] : null), [account, chainId]);

  const { data, error } = useSWRImmutable(key, () => mapify(_getSeriesEntities(chainId)) as Map<string, ISeries>);

  return { data, error, isLoading: !data && !error };
};

export default useSeriesEntities;
