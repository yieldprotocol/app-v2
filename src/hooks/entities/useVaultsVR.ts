import useSWR from 'swr';
import { IVault } from '../../types';
import { useCallback, useContext, useMemo } from 'react';
import useContracts from '../useContracts';
import { ContractNames } from '../../config/contracts';
import { CompositeMultiOracle, CompoundMultiOracle__factory, VRCauldron, VRWitch } from '../../contracts';
import useFork from '../useFork';
import useDefaultProvider from '../useDefaultProvider';
import { MulticallContext } from '../../contexts/MutlicallContext';
import { ChainContext } from '../../contexts/ChainContext';
import { formatUnits } from 'ethers/lib/utils.js';
import { bytesToBytes32 } from '@yield-protocol/ui-math';
import { RATE } from '../../utils/constants';
import { cleanValue, generateVaultName } from '../../utils/appUtils';
import useAccountPlus from '../useAccountPlus';

const useVaultsVR = () => {
  const { address: account } = useAccountPlus();
  const { multicall, forkMulticall } = useContext(MulticallContext);
  const {
    chainState: { assetRootMap },
  } = useContext(ChainContext);
  const contracts = useContracts();
  const provider = useDefaultProvider();
  const { provider: forkProvider, useForkedEnv, forkStartBlock } = useFork();

  const _cauldron = contracts?.get(ContractNames.VR_CAULDRON) as VRCauldron | undefined;
  const _witch = contracts?.get(ContractNames.VR_WITCH) as VRWitch | undefined;

  const cauldron = multicall?.wrap(_cauldron!);
  const witch = multicall?.wrap(_witch!);
  const forkCauldron = forkMulticall?.wrap(_cauldron!);
  const forkWitch = forkMulticall?.wrap(_witch!);
  const cauldronToUse = useForkedEnv ? forkCauldron! : cauldron;
  const witchToUse = useForkedEnv ? forkWitch! : witch;

  const getVaultIds = async (cauldron: VRCauldron, fromBlock?: number | string): Promise<string[]> => {
    const builtEvents = await cauldron.queryFilter(cauldron.filters.VaultBuilt(), fromBlock);
    const receivedEvents = await cauldron.queryFilter(cauldron.filters.VaultGiven(), fromBlock);
    return [...new Set([...builtEvents.map((e) => e.args.vaultId), ...receivedEvents.map((e) => e.args.vaultId)])];
  };

  const getVault = useCallback(
    async (id: string): Promise<IVault | undefined> => {
      if (!cauldronToUse || !witchToUse) return;

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
        isActive: owner.toLowerCase() === account?.toLowerCase(), // refreshed in case owner has been updated
        displayName: generateVaultName(id),
        decimals: base.decimals,
      };
    },
    [account, assetRootMap, cauldronToUse, useForkedEnv, witchToUse]
  );

  const getVaults = useCallback(async () => {
    if (!cauldron) return;
    if (!forkCauldron && useForkedEnv) return;

    console.log('getting vaults in useVaultsVR');

    // default provider vault ids
    const vaultIds = await getVaultIds(cauldron, forkStartBlock);

    // fork provider vault ids
    const forkVaultIds = !useForkedEnv ? [] : await getVaultIds(forkCauldron!, forkStartBlock);

    // both fork and non-fork vault ids
    const allIds = [...new Set([...vaultIds, ...forkVaultIds])];

    const vaults = await allIds.reduce(
      async (acc, id) => (await acc).set(id, await getVault(id)),
      Promise.resolve(new Map<string, IVault | undefined>())
    );

    return vaults;
  }, [cauldron, forkCauldron, forkStartBlock, getVault, useForkedEnv]);

  const key = useMemo(
    () => ['vaults', cauldron, forkCauldron, forkStartBlock, getVault, useForkedEnv],
    [cauldron, forkCauldron, forkStartBlock, getVault, useForkedEnv]
  );

  const { data, error, isLoading } = useSWR(key, getVaults, { revalidateOnFocus: false });

  return { data, error, isLoading };
};

export default useVaultsVR;
