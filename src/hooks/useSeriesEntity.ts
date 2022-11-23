import useSWRImmutable from 'swr/immutable';
import { useCallback, useContext, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Cauldron } from '../contracts';
import useChainId from './useChainId';
import useContracts, { ContractNames } from './useContracts';
import useDefaultProvider from './useDefaultProvider';
import { getSeriesEntityDynamic } from '../lib/seriesEntities';
import { ChainContext } from '../contexts/ChainContext';

const useSeriesEntity = (id?: string) => {
  const {
    chainState: { multicall },
  } = useContext(ChainContext);
  const { address: account } = useAccount();
  const provider = useDefaultProvider();
  const chainId = useChainId();
  const contracts = useContracts();
  const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron | undefined;

  const getSeriesEntity = useCallback(
    async (id: string) => {
      if (!Cauldron || !id || !multicall) return;
      console.log(`fetching series entity with id: ${id}`);
      return await getSeriesEntityDynamic(provider, Cauldron, chainId, id, account, multicall);
    },
    [Cauldron, account, chainId, multicall, provider]
  );

  const genKey = useCallback(
    (id: string) => (chainId && id ? ['seriesEntity', id, chainId, account] : null),
    [account, chainId]
  );

  const key = useMemo(() => genKey(id!), [genKey, id]);
  const { data, error, isValidating } = useSWRImmutable(key, () => getSeriesEntity(id!));

  return { data, error, isLoading: (!data && !error) || isValidating, key, getSeriesEntity, genKey };
};

export default useSeriesEntity;
