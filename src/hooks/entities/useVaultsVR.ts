import useSWR from 'swr';
import { IVault } from '../../types';
import { useCallback, useContext, useMemo } from 'react';
import contractAddresses, { ContractNames } from '../../config/contracts';
import { CompoundMultiOracle__factory, VRCauldron, VRCauldron__factory, VRWitch__factory } from '../../contracts';
import useFork from '../useFork';
import useDefaultProvider from '../useDefaultProvider';
import { MulticallContext } from '../../contexts/MutlicallContext';
import { ChainContext } from '../../contexts/ChainContext';
import { formatUnits } from 'ethers/lib/utils.js';
import { bytesToBytes32 } from '@yield-protocol/ui-math';
import { RATE } from '../../utils/constants';
import { cleanValue, generateVaultName } from '../../utils/appUtils';
import useAccountPlus from '../useAccountPlus';
import useChainId from '../useChainId';

const useVaultsVR = () => {
  const { address: account } = useAccountPlus();
  const { multicall, forkMulticall } = useContext(MulticallContext);
  const {
    chainState: { assetRootMap },
  } = useContext(ChainContext);
  const chainId = useChainId();
  const provider = useDefaultProvider();
  const { provider: forkProvider, useForkedEnv, forkStartBlock } = useFork();

  const cauldronAddr = contractAddresses.addresses.get(chainId)?.get(ContractNames.VR_CAULDRON);
  const cauldron = useMemo(
    () => (cauldronAddr ? multicall?.wrap(VRCauldron__factory.connect(cauldronAddr, provider)) : undefined),
    [cauldronAddr, multicall, provider]
  );
  const forkCauldron = useMemo(
    () =>
      cauldronAddr && forkProvider
        ? forkMulticall?.wrap(VRCauldron__factory.connect(cauldronAddr, forkProvider))
        : undefined,
    [cauldronAddr, forkMulticall, forkProvider]
  );
  // cauldron to use when fetching a vault's data
  const cauldronToUse = useForkedEnv ? forkCauldron! : cauldron;

  const witchAddr = contractAddresses.addresses.get(chainId)?.get(ContractNames.VR_WITCH);
  const witch = useMemo(
    () => (witchAddr ? multicall?.wrap(VRWitch__factory.connect(witchAddr, provider)) : undefined),
    [multicall, provider, witchAddr]
  );
  const forkWitch = useMemo(
    () =>
      cauldronAddr && forkProvider
        ? forkMulticall?.wrap(VRWitch__factory.connect(cauldronAddr, forkProvider))
        : undefined,
    [cauldronAddr, forkMulticall, forkProvider]
  );
  // witch to use when fetching a vault's data
  const witchToUse = useForkedEnv ? forkWitch! : witch;

  const getVaultIds = async (cauldron: VRCauldron, fromBlock?: number | string): Promise<string[]> => {
    const builtEvents = await cauldron.queryFilter(cauldron.filters.VaultBuilt(), fromBlock);
    const receivedEvents = await cauldron.queryFilter(cauldron.filters.VaultGiven(), fromBlock);
    return [...new Set([...builtEvents.map((e) => e.args.vaultId), ...receivedEvents.map((e) => e.args.vaultId)])];
  };

  const getVault = useCallback(
    async (id: string) => {
      if (!cauldronToUse || !witchToUse || !assetRootMap || !account) return;

      const [[art, ink], [owner, baseId, ilkId]] = await Promise.all([
        cauldronToUse.balances(id),
        cauldronToUse.vaults(id),
      ]);

      const ilk = assetRootMap.get(ilkId);
      const base = assetRootMap.get(baseId);
      if (!ilk || !base) return;

      const liquidationEvents = !useForkedEnv
        ? await witchToUse.queryFilter(witchToUse.filters.Bought(bytesToBytes32(id, 12), null, null, null))
        : [];
      const hasBeenLiquidated = liquidationEvents.flat().length > 0;

      const rateOracleAddr = await cauldronToUse.rateOracles(baseId);
      const RateOracle = CompoundMultiOracle__factory.connect(rateOracleAddr, cauldronToUse.provider);
      const [rate] = await RateOracle.peek(bytesToBytes32(baseId, 6), RATE, '0');
      const art_ = cleanValue(formatUnits(art, base.decimals), base.digitFormat);

      return {
        id,
        art,
        art_,
        ink,
        ink_: cleanValue(formatUnits(ink, ilk.decimals), ilk.digitFormat),
        owner,
        baseId,
        ilkId,
        rate,
        rate_: formatUnits(rate, 18),
        hasBeenLiquidated,
        isWitchOwner: witchToUse.address === owner, // check if witch is the owner (in liquidation process)
        accruedArt: art, // vr accrued art is the art
        accruedArt_: art_,
        isActive: owner.toLowerCase() === account.toLowerCase(), // refreshed in case owner has been updated
        displayName: generateVaultName(id),
        decimals: base.decimals,
      } as IVault;
    },
    [account, assetRootMap, cauldronToUse, useForkedEnv, witchToUse]
  );

  const getVaults = useCallback(async () => {
    if (!cauldron) return;

    console.log('getting vaults in useVaultsVR');

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
  }, [cauldron, forkCauldron, forkStartBlock, getVault, useForkedEnv]);

  // not adding the contracts as deps because they are causing infinite renders
  const key = useMemo(
    () => ['vaultsVR', account, forkStartBlock, useForkedEnv, assetRootMap],
    [account, forkStartBlock, useForkedEnv, assetRootMap]
  );

  const { data, error, isLoading } = useSWR(key, getVaults, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    shouldRetryOnError: false,
  });

  return { data, error, isLoading, key };
};

export default useVaultsVR;
