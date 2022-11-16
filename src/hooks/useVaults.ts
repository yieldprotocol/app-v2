import { useCallback, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount } from 'wagmi';
import { Cauldron } from '../contracts';
import { IVault } from '../types';
import useContracts, { ContractNames } from './useContracts';
import useVault from './useVault';

const useVaults = () => {
  const { address: account } = useAccount();
  const { getVault } = useVault();
  const contracts = useContracts();

  const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron | undefined;

  const getVaults = useCallback(async () => {
    if (!Cauldron) throw new Error('no cauldron when fetching vaults');

    /* Get a list of the vaults that were BUILT */
    const vaultsBuiltFilter = Cauldron.filters.VaultBuilt(null, account, null);
    const vaultsBuilt = await Cauldron.queryFilter(vaultsBuiltFilter);
    const buildEventList = await Promise.all(
      vaultsBuilt.map(async (x) => {
        const { vaultId } = x.args;
        return getVault(vaultId);
      })
    );

    /* Get a list of the vaults that were RECEIVED */
    const vaultsReceivedFilter = Cauldron.filters.VaultGiven(null, account);
    const vaultsReceived = await Cauldron.queryFilter(vaultsReceivedFilter);
    const receivedEventsList = await Promise.all(
      vaultsReceived.map(async (x) => {
        const { vaultId } = x.args;
        return await getVault(vaultId);
      })
    );

    const allVaultsList = [...buildEventList, ...receivedEventsList];

    return allVaultsList.reduce(async (acc, v) => {
      return (await acc).set(v.id, v);
    }, Promise.resolve(new Map<string, IVault>()));
  }, [Cauldron, account, getVault]);

  const key = useMemo(() => {
    return account ? ['vaults', account] : null;
  }, [account]);

  const { data, error } = useSWRImmutable(key, getVaults);

  return {
    data,
    isLoading: !data && !error,
    key,
  };
};

export default useVaults;
