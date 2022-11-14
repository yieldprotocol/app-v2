import { bytesToBytes32, calcAccruedDebt, ZERO_BN } from '@yield-protocol/ui-math';
import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useContext, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { useAccount } from 'wagmi';
import { ORACLE_INFO } from '../config/oracles';
import { ChainContext } from '../contexts/ChainContext';
import { Cauldron, Witch } from '../contracts';
import { IVault, IVaultRoot } from '../types';
import { generateVaultName } from '../utils/appUtils';
import useChainId from './useChainId';
import useContracts, { ContractNames } from './useContracts';
import useTenderly from './useTenderly';
import useTimeTillMaturity from './useTimeTillMaturity';

const useVaults = () => {
  const chainId = useChainId();
  const { address: account } = useAccount();
  const {
    chainState: { seriesRootMap },
  } = useContext(ChainContext);
  const { isMature } = useTimeTillMaturity();
  const contracts = useContracts();
  const { tenderlyStartBlock } = useTenderly();
  const useTenderlyFork = false;

  const getVaults = useCallback(async () => {
    const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron;
    const Witch = contracts.get(ContractNames.WITCH) as Witch;

    /* Get a list of the vaults that were BUILT */
    const vaultsBuiltFilter = Cauldron.filters.VaultBuilt(null, account, null);
    const vaultsBuilt = await Cauldron.queryFilter(vaultsBuiltFilter);
    const buildEventList = await Promise.all(
      vaultsBuilt.map(async (x): Promise<IVaultRoot> => {
        const { vaultId: id, ilkId, seriesId } = x.args;
        const series = seriesRootMap.get(seriesId);
        return {
          id,
          seriesId,
          baseId: series?.baseId!,
          ilkId,
          displayName: generateVaultName(id),
          decimals: series?.decimals!,
        };
      })
    );

    /* Get a list of the vaults that were RECEIVED */
    const vaultsReceivedFilter = Cauldron.filters.VaultGiven(null, account);
    const vaultsReceived = await Cauldron.queryFilter(vaultsReceivedFilter);
    const receivedEventsList = await Promise.all(
      vaultsReceived.map(async (x): Promise<IVaultRoot> => {
        const { vaultId: id } = x.args;
        const { ilkId, seriesId } = await Cauldron.vaults(id);
        const series = seriesRootMap.get(seriesId);
        return {
          id,
          seriesId,
          baseId: series?.baseId!,
          ilkId,
          displayName: generateVaultName(id),
          decimals: series?.decimals!,
        };
      })
    );

    const allVaultsList = [...buildEventList, ...receivedEventsList];

    // more data
    return allVaultsList.reduce(async (acc, v) => {
      /* If art 0, check for liquidation event */
      const hasBeenLiquidated =
        (await Witch?.queryFilter(
          Witch?.filters.Auctioned(bytesToBytes32(v.id, 12), null),
          useTenderlyFork && tenderlyStartBlock ? tenderlyStartBlock : 'earliest',
          'latest'
        ))!.length > 0;

      const [
        { ink, art },
        { owner, seriesId, ilkId }, // update balance and series (series - because a vault can have been rolled to another series) */
      ] = await Promise.all([Cauldron?.balances(v.id), Cauldron?.vaults(v.id)]);

      const series = seriesRootMap.get(seriesId);
      if (!series) return await acc;

      const isVaultMature = isMature(series.maturity);

      let accruedArt: BigNumber;
      let rateAtMaturity: BigNumber;
      let rate: BigNumber;

      if (isVaultMature) {
        const RATE = '0x5241544500000000000000000000000000000000000000000000000000000000'; // bytes for 'RATE'
        const oracleName = ORACLE_INFO.get(chainId)?.get(v.baseId)?.get(RATE);

        const RateOracle = contracts.get(oracleName!);
        rateAtMaturity = await Cauldron?.ratesAtMaturity(seriesId);
        [rate] = await RateOracle?.peek(bytesToBytes32(v.baseId, 6), RATE, '0');

        [accruedArt] = rateAtMaturity.gt(ZERO_BN)
          ? calcAccruedDebt(rate, rateAtMaturity, art)
          : calcAccruedDebt(rate, rate, art);
      } else {
        rate = BigNumber.from('1');
        rateAtMaturity = BigNumber.from('1');
        accruedArt = art;
      }

      const vault: IVault = {
        ...v,
        owner, // refreshed in case owner has been updated
        isWitchOwner: Witch?.address === owner, // check if witch is the owner (in liquidation process)
        hasBeenLiquidated,
        isActive: owner === account, // refreshed in case owner has been updated
        seriesId, // refreshed in case seriesId has been updated
        ilkId, // refreshed in case ilkId has been updated
        ink: {
          value: ink,
          formatted: formatUnits(ink, series.decimals), // for display purposes only
        },
        art: {
          value: art,
          formatted: formatUnits(art, series.decimals), // for display purposes only
        },
        accruedArt: {
          value: accruedArt,

          formatted: formatUnits(accruedArt, series.decimals), // display purposes
        },
        isVaultMature,
        rateAtMaturity,
        rate: {
          value: rate,
          formatted: formatUnits(rate, 18), // always 18 decimals when getting rate from rate oracle,
        },
      };

      return (await acc).set(v.id, {
        ...v,
        ...vault,
      });
    }, Promise.resolve(new Map<string, IVault>()));
  }, [account, chainId, contracts, isMature, seriesRootMap, tenderlyStartBlock, useTenderlyFork]);

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
