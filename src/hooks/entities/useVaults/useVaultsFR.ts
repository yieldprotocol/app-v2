import useSWR from 'swr';
import { IVault } from '../../../types';
import { useCallback, useContext, useMemo } from 'react';
import contractAddresses, { ContractNames } from '../../../config/contracts';
import {
  Cauldron,
  Cauldron__factory,
  CompoundMultiOracle__factory,
  WitchV2__factory,
  Witch__factory,
} from '../../../contracts';
import useFork from '../../useFork';
import useDefaultProvider from '../../useDefaultProvider';
import { MulticallContext } from '../../../contexts/MutlicallContext';
import { ChainContext } from '../../../contexts/ChainContext';
import { formatUnits } from 'ethers/lib/utils.js';
import { ZERO_BN, bytesToBytes32, calcAccruedDebt } from '@yield-protocol/ui-math';
import { RATE } from '../../../utils/constants';
import { cleanValue, generateVaultName } from '../../../utils/appUtils';
import useAccountPlus from '../../useAccountPlus';
import useChainId from '../../useChainId';
import { BigNumber } from 'ethers';
import useTimeTillMaturity from '../../useTimeTillMaturity';

const useVaultsFR = () => {
  const { address: account } = useAccountPlus();
  const { multicall, forkMulticall } = useContext(MulticallContext);
  const {
    chainState: { assetRootMap, seriesRootMap },
  } = useContext(ChainContext);
  const chainId = useChainId();
  const provider = useDefaultProvider();
  const { provider: forkProvider, useForkedEnv, forkStartBlock, forkUrl } = useFork();
  const { isMature } = useTimeTillMaturity();

  // cauldron
  const cauldronAddr = contractAddresses.addresses.get(chainId)?.get(ContractNames.CAULDRON);
  const cauldron = multicall?.wrap(Cauldron__factory.connect(cauldronAddr!, provider));
  const forkCauldron = forkMulticall?.wrap(Cauldron__factory.connect(cauldronAddr!, forkProvider!));
  // cauldron to use when fetching a vault's data
  const cauldronToUse = useForkedEnv ? forkCauldron! : cauldron;

  // witch
  const witchAddr = contractAddresses.addresses.get(chainId)?.get(ContractNames.WITCHV2);
  const witch = multicall?.wrap(WitchV2__factory.connect(witchAddr!, provider));
  const forkWitch = forkMulticall?.wrap(WitchV2__factory.connect(witchAddr!, forkProvider!));
  // witchV2 to use when fetching a vault's data
  const witchToUse = useForkedEnv ? forkWitch! : witch;

  // witchV1
  const witchV1Addr = contractAddresses.addresses.get(chainId)?.get(ContractNames.WITCH);
  const witchV1 = multicall?.wrap(Witch__factory.connect(witchV1Addr!, provider));
  const forkWitchV1 = forkMulticall?.wrap(Witch__factory.connect(witchV1Addr!, forkProvider!));
  // witch to use when fetching a vault's data
  const witchV1ToUse = useForkedEnv ? forkWitchV1! : witchV1;

  const getVaultIds = useCallback(
    async (cauldron: Cauldron, fromBlock?: number | string): Promise<string[]> => {
      const builtEvents = await cauldron.queryFilter(cauldron.filters.VaultBuilt(null, account), fromBlock);
      const receivedEvents = await cauldron.queryFilter(cauldron.filters.VaultGiven(null, account), fromBlock);
      return [...new Set([...builtEvents.map((e) => e.args.vaultId), ...receivedEvents.map((e) => e.args.vaultId)])];
    },
    [account]
  );

  const getVault = useCallback(
    async (id: string) => {
      if (!cauldronToUse || !witchToUse || !witchV1ToUse || !assetRootMap || !account) return;

      const [[art, ink], [owner, seriesId, ilkId]] = await Promise.all([
        cauldronToUse.balances(id),
        cauldronToUse.vaults(id),
      ]);

      const ilk = assetRootMap.get(ilkId);
      const series = seriesRootMap.get(seriesId);
      const base = assetRootMap.get(series?.baseId!);
      if (!ilk || !base || !series) return;

      const isVaultMature = isMature(series?.maturity!);

      const liquidationEvents = !useForkedEnv
        ? await Promise.all([
            witchV1ToUse.queryFilter(witchV1ToUse.filters.Bought(bytesToBytes32(id, 12), null, null, null)),
            witchToUse.queryFilter(witchToUse.filters.Bought(bytesToBytes32(id, 12), null, null, null)),
          ])
        : [];
      const hasBeenLiquidated = liquidationEvents.flat().length > 0;

      let accruedArt: BigNumber;
      let rateAtMaturity: BigNumber;
      let rate: BigNumber;

      if (isVaultMature) {
        const rateOracleAddr = await cauldronToUse.lendingOracles(base.id);
        const RateOracle = CompoundMultiOracle__factory.connect(rateOracleAddr, provider); // using compount multi here, but all rate oracles follow the same func sig methodology

        rateAtMaturity = await cauldronToUse.ratesAtMaturity(seriesId);
        [rate] = await RateOracle.peek(bytesToBytes32(base.id, 6), RATE, '0');

        [accruedArt] = rateAtMaturity.gt(ZERO_BN)
          ? calcAccruedDebt(rate, rateAtMaturity, art)
          : calcAccruedDebt(rate, rate, art);
      } else {
        rate = BigNumber.from('1');
        rateAtMaturity = BigNumber.from('1');
        accruedArt = art;
      }

      return {
        id,
        art,
        art_: cleanValue(formatUnits(art, base.decimals), base.digitFormat),
        ink,
        ink_: cleanValue(formatUnits(ink, ilk.decimals), ilk.digitFormat),
        owner,
        seriesId,
        baseId: base.id,
        ilkId,
        rate,
        rate_: formatUnits(rate, 18),
        hasBeenLiquidated,
        isWitchOwner: witchToUse.address === owner || witchV1ToUse.address === owner, // check if witch is the owner (in liquidation process)
        accruedArt,
        accruedArt_: cleanValue(formatUnits(accruedArt, base.decimals), base.digitFormat),
        isActive: owner.toLowerCase() === account.toLowerCase(), // refreshed in case owner has been updated
        displayName: generateVaultName(id),
        decimals: base.decimals,
      } as IVault;
    },
    [account, assetRootMap, cauldronToUse, isMature, provider, seriesRootMap, useForkedEnv, witchToUse, witchV1ToUse]
  );

  const getVaults = useCallback(async () => {
    if (!cauldron) return;

    console.log('getting vaults in useVaultsFR');

    // default provider vault ids
    const vaultIds = await getVaultIds(cauldron);

    // fork provider vault ids
    const forkVaultIds = useForkedEnv && forkCauldron ? await getVaultIds(forkCauldron, forkStartBlock) : [];

    // both fork and non-fork vault ids
    const allIds = [...new Set([...vaultIds, ...forkVaultIds])];

    const vaults = await allIds.reduce(async (acc, id) => {
      const vault = await getVault(id);
      return vault ? (await acc).set(id, vault) : await acc;
    }, Promise.resolve(new Map<string, IVault>()));

    return vaults;
  }, [cauldron, forkCauldron, forkStartBlock, getVault, getVaultIds, useForkedEnv]);

  // not adding the contracts as deps because they are causing infinite renders
  const key = useMemo(
    () => ['vaultsFR', account, forkStartBlock, useForkedEnv, assetRootMap, seriesRootMap, forkUrl],
    [account, forkStartBlock, useForkedEnv, assetRootMap, seriesRootMap, forkUrl]
  );

  const { data, error, isLoading, isValidating } = useSWR(key, getVaults, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    shouldRetryOnError: false,
  });

  return { data, error, isLoading: isLoading || isValidating, key };
};

export default useVaultsFR;
