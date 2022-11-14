import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount } from 'wagmi';
import { UserContext } from '../contexts/UserContext';
import { Cauldron } from '../contracts';
import { IVault } from '../types';
import { generateVaultName } from '../utils/appUtils';
import useAsset from './useAsset';
import useContracts, { ContractNames } from './useContracts';

const useVaults = () => {
  const { address: account } = useAccount();
  const {
    userState: { seriesMap },
  } = useContext(UserContext);
  const contracts = useContracts();
  const { getAsset } = useAsset();

  const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron | undefined;

  const getVaults = useCallback(async () => {
    if (!Cauldron) throw new Error('no cauldron when fetching vaults');

    /* Get a list of the vaults that were BUILT */
    const vaultsBuiltFilter = Cauldron.filters.VaultBuilt(null, account, null);
    const vaultsBuilt = await Cauldron.queryFilter(vaultsBuiltFilter);
    const buildEventList = await Promise.all(
      vaultsBuilt.map(async (x): Promise<IVault> => {
        const { vaultId: id, ilkId, seriesId, owner } = x.args;
        const { art, ink } = await Cauldron.balances(id);

        const series = seriesMap.get(seriesId);
        const base = await getAsset(series?.baseId!);
        const ilk = await getAsset(ilkId);

        return {
          id,
          baseId: series?.baseId!,
          ilkId,
          owner,
          displayName: generateVaultName(id),
          decimals: series?.decimals!,
          series,
          seriesId,
          isActive: owner === account,
          art: {
            value: art,
            formatted: formatUnits(art, base?.decimals),
          },
          ink: {
            value: ink,
            formatted: formatUnits(ink, ilk?.decimals),
          },
        };
      })
    );

    /* Get a list of the vaults that were RECEIVED */
    const vaultsReceivedFilter = Cauldron.filters.VaultGiven(null, account);
    const vaultsReceived = await Cauldron.queryFilter(vaultsReceivedFilter);
    const receivedEventsList = await Promise.all(
      vaultsReceived.map(async (x): Promise<IVault> => {
        const { vaultId: id } = x.args;
        const [{ ilkId, seriesId, owner }, { art, ink }] = await Promise.all([
          Cauldron.vaults(id),
          await Cauldron.balances(id),
        ]);

        const series = seriesMap.get(seriesId);
        const base = await getAsset(series?.baseId!);
        const ilk = await getAsset(ilkId);

        return {
          id,
          baseId: series?.baseId!,
          ilkId,
          owner,
          displayName: generateVaultName(id),
          decimals: series?.decimals!,
          series,
          seriesId,
          isActive: owner === account,
          art: {
            value: art,
            formatted: formatUnits(art, base?.decimals),
          },
          ink: {
            value: ink,
            formatted: formatUnits(ink, ilk?.decimals),
          },
        };
      })
    );

    const allVaultsList = [...buildEventList, ...receivedEventsList];

    return allVaultsList.reduce(async (acc, v) => {
      return (await acc).set(v.id, v);
    }, Promise.resolve(new Map<string, IVault>()));
  }, [Cauldron, account, getAsset, seriesMap]);

  const key = useMemo(() => {
    return account && seriesMap.size ? ['vaults', account, seriesMap] : null;
  }, [account, seriesMap]);

  const { data, error } = useSWRImmutable(key, getVaults);

  return {
    data,
    isLoading: !data && !error,
    key,
  };
};

export default useVaults;
