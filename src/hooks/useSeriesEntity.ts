import useSWRImmutable from 'swr/immutable';
import { useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Cauldron } from '../contracts';
import useChainId from './useChainId';
import useContracts, { ContractNames } from './useContracts';
import useDefaultProvider from './useDefaultProvider';
import { getSeriesEntityDynamic } from '../lib/seriesEntities';

const useSeriesEntity = (id?: string) => {
  const { address: account } = useAccount();
  const provider = useDefaultProvider();
  const chainId = useChainId();
  const contracts = useContracts();
  const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron | undefined;

  const _getSeriesEntity = useCallback(async () => {
    if (!Cauldron || !id) return;
    return await getSeriesEntityDynamic(provider, Cauldron, chainId, id, account);
  }, [Cauldron, account, chainId, id, provider]);

  const key = useMemo(() => (chainId && id ? ['seriesEntity', id, chainId, account] : null), [account, chainId, id]);

  const { data, error, isValidating } = useSWRImmutable(key, _getSeriesEntity);

  return { data, error, isLoading: (!data && !error) || isValidating };
};

export default useSeriesEntity;
