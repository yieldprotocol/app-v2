import useSWRImmutable from 'swr/immutable';
import { bytesToBytes32, calcAccruedDebt, ZERO_BN } from '@yield-protocol/ui-math';
import { useCallback, useContext, useMemo } from 'react';
import { Cauldron, Witch } from '../contracts';
import useContracts, { ContractNames } from './useContracts';
import useTimeTillMaturity from './useTimeTillMaturity';
import useChainId from './useChainId';
import { BigNumber } from 'ethers';
import { ORACLE_INFO } from '../config/oracles';
import { formatUnits } from 'ethers/lib/utils';
import useAsset from './useAsset';
import { useAccount } from 'wagmi';
import { IAsset, IVault } from '../types';
import { generateVaultName } from '../utils/appUtils';
import useDefaultProvider from './useDefaultProvider';
import { unstable_serialize, useSWRConfig } from 'swr';
import { ChainContext } from '../contexts/ChainContext';

const useVault = (id?: string) => {
  const { cache, mutate } = useSWRConfig();
  const {
    chainState: { multicall },
  } = useContext(ChainContext);
  const provider = useDefaultProvider();
  const { address: account } = useAccount();
  const contracts = useContracts();
  const chainId = useChainId();
  const { getAsset, genKey } = useAsset();
  const { isMature } = useTimeTillMaturity();

  const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron | undefined;
  const Witch = contracts.get(ContractNames.WITCH) as Witch | undefined;

  const getVault = useCallback(
    async (id: string): Promise<IVault> => {
      if (!multicall) throw new Error('no multicall detected');
      if (!Cauldron) throw new Error('no cauldron when fetching vault');
      if (!Witch) throw new Error('no witch when fetching vault');

      /* If art 0, check for liquidation event */
      const hasBeenLiquidated =
        (
          await multicall
            .wrap(Witch)
            .queryFilter(Witch.filters.Auctioned(bytesToBytes32(id, 12), null), 'earliest', 'latest')
        ).length > 0;

      const [{ owner, seriesId, ilkId }, { ink, art }] = await Promise.all([
        multicall.wrap(Cauldron).vaults(id),
        multicall.wrap(Cauldron).balances(id),
      ]);

      const [{ baseId, maturity }] = await Promise.all([multicall.wrap(Cauldron).series(seriesId)]);

      const isVaultMature = isMature(maturity);

      let accruedArt: BigNumber;
      let rateAtMaturity: BigNumber;
      let rate: BigNumber;

      if (isVaultMature) {
        const RATE = '0x5241544500000000000000000000000000000000000000000000000000000000'; // bytes for 'RATE'
        const oracleName = ORACLE_INFO.get(chainId)?.get(baseId)?.get(RATE);

        const RateOracle = contracts.get(oracleName!);
        rateAtMaturity = await multicall.wrap(Cauldron).ratesAtMaturity(seriesId);
        [rate] = await multicall.wrap(RateOracle!)?.peek(bytesToBytes32(baseId, 6), RATE, '0');

        [accruedArt] = rateAtMaturity.gt(ZERO_BN)
          ? calcAccruedDebt(rate, rateAtMaturity, art)
          : calcAccruedDebt(rate, rate, art);
      } else {
        rate = BigNumber.from('1');
        rateAtMaturity = BigNumber.from('1');
        accruedArt = art;
      }
      const ilkKey = unstable_serialize(genKey(ilkId));
      const baseKey = unstable_serialize(genKey(baseId));

      let ilk: IAsset | undefined;
      let base: IAsset | undefined;

      const cachedIlk = cache.get(unstable_serialize(ilkKey));
      if (cachedIlk) {
        ilk = cachedIlk;
      } else {
        ilk = await getAsset(ilkId);
        mutate(ilkKey, ilk, { revalidate: false });
      }

      const cachedBase = cache.get(unstable_serialize(baseKey));
      if (cachedBase) {
        base = cachedBase;
      } else {
        base = await getAsset(baseId);
        mutate(baseKey, base, { revalidate: false });
      }

      return {
        id,
        baseId: baseId!,
        displayName: generateVaultName(id),
        isActive: owner === account,
        owner, // refreshed in case owner has been updated
        isWitchOwner: Witch.address === owner, // check if witch is the owner (in liquidation process)
        hasBeenLiquidated,
        seriesId, // refreshed in case seriesId has been updated
        ilkId, // refreshed in case ilkId has been updated
        ink: {
          value: ink,
          formatted: formatUnits(ink, ilk?.decimals), // for display purposes only
        },
        art: {
          value: art,
          formatted: formatUnits(art, base?.decimals), // for display purposes only
        },
        accruedArt: {
          value: accruedArt,
          formatted: formatUnits(accruedArt, base?.decimals), // display purposes
        },
        isVaultMature,
        rateAtMaturity,
        rate: {
          value: rate,
          formatted: formatUnits(rate, 18), // always 18 decimals when getting rate from rate oracle,
        },
      };
    },
    [Cauldron, Witch, account, cache, chainId, contracts, genKey, getAsset, isMature, multicall, mutate]
  );

  const key = useMemo(() => (account && id ? ['vault', id, account] : null), [account, id]);

  const { data, error, isValidating } = useSWRImmutable(key, () => getVault(id!));

  return {
    data,
    isLoading: (!data && !error) || isValidating,
    error,
    key,
    getVault,
  };
};

export default useVault;
