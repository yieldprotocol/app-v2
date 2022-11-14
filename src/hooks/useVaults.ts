import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { Cauldron } from '../contracts';
import { IVaultRoot } from '../types';
import { generateVaultName } from '../utils/appUtils';
import useChainId from './useChainId';
import useContracts, { ContractNames } from './useContracts';

const useVaults = () => {
  const chainId = useChainId();
  const { address: account } = useAccount();
  const {
    chainState: { seriesRootMap },
  } = useContext(ChainContext);
  const contracts = useContracts();

  const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron | undefined;

  const getVaults = useCallback(async () => {
    if (!Cauldron) throw new Error('no cauldron when fetching vaults');

    /* Get a list of the vaults that were BUILT */
    const vaultsBuiltFilter = Cauldron.filters.VaultBuilt(null, account, null);
    const vaultsBuilt = await Cauldron.queryFilter(vaultsBuiltFilter);
    const buildEventList = await Promise.all(
      vaultsBuilt.map(async (x): Promise<IVaultRoot> => {
        const { vaultId: id, ilkId, seriesId, owner } = x.args;
        const { art } = await Cauldron.balances(id);
        const series = seriesRootMap.get(seriesId);
        return {
          id,
          owner,
          seriesId,
          ilkId,
          baseId: series?.baseId!,
          displayName: generateVaultName(id),
          decimals: series?.decimals!,
          series,
          isActive: owner === account,
          art: {
            value: art,
            formatted: formatUnits(art, series?.decimals),
          },
        };
      })
    );

    /* Get a list of the vaults that were RECEIVED */
    const vaultsReceivedFilter = Cauldron.filters.VaultGiven(null, account);
    const vaultsReceived = await Cauldron.queryFilter(vaultsReceivedFilter);
    const receivedEventsList = await Promise.all(
      vaultsReceived.map(async (x): Promise<IVaultRoot> => {
        const { vaultId: id } = x.args;
        const [{ ilkId, seriesId, owner }, { art }] = await Promise.all([
          Cauldron.vaults(id),
          await Cauldron.balances(id),
        ]);
        const series = seriesRootMap.get(seriesId);
        return {
          id,
          owner,
          seriesId,
          ilkId,
          baseId: series?.baseId!,
          displayName: generateVaultName(id),
          decimals: series?.decimals!,
          series,
          isActive: owner === account,
          art: {
            value: art,
            formatted: formatUnits(art, series?.decimals),
          },
        };
      })
    );

    const allVaultsList = [...buildEventList, ...receivedEventsList];

    return allVaultsList.reduce(async (acc, v) => {
      return (await acc).set(v.id, v);
    }, Promise.resolve(new Map<string, IVaultRoot>()));
  }, [Cauldron, account, seriesRootMap]);

  const key = useMemo(() => {
    return account ? ['vaults', account, chainId] : null;
  }, [account, chainId]);

  const { data, error } = useSWRImmutable(key, getVaults);

  return {
    data,
    isLoading: !data && !error,
    key,
  };
};

export default useVaults;
