import { useCallback, useContext, useMemo } from 'react';
import { IAssetPair } from '../../../types';
import { BigNumber, ethers } from 'ethers';
import useSWR from 'swr';
import { bytesToBytes32, decimal18ToDecimalN, WAD_BN } from '@yield-protocol/ui-math';
import useContracts from '../../useContracts';
import { Cauldron, CompositeMultiOracle__factory, VRCauldron } from '../../../contracts';
import { UserContext } from '../../../contexts/UserContext';
import { ContractNames } from '../../../config/contracts';
import useFork from '../../useFork';
import { SettingsContext } from '../../../contexts/SettingsContext';
import { MulticallContext } from '../../../contexts/MutlicallContext';

// This hook is used to get the asset pair info for a given base and collateral (ilk)
const useAssetPair = (baseId?: string, ilkId?: string) => {
  /* CONTEXT STATE */
  const { multicall, forkMulticall } = useContext(MulticallContext);
  const {
    userState: { selectedVR },
  } = useContext(UserContext);
  const {
    userState: { assetMap },
  } = useContext(UserContext);

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  /* HOOKS */
  const contracts = useContracts();
  const { useForkedEnv, forkUrl } = useFork();

  /* GET PAIR INFO */
  const getAssetPair = useCallback(
    async (baseId: string, ilkId: string, isVR = false): Promise<IAssetPair | undefined> => {
      const _cauldron = contracts?.get(isVR ? ContractNames.VR_CAULDRON : ContractNames.CAULDRON) as
        | VRCauldron
        | Cauldron
        | undefined;

      const cauldron = (useForkedEnv ? forkMulticall : multicall)?.wrap(_cauldron!);

      if (!cauldron || !assetMap) return;

      const _base = assetMap.get(baseId);
      const _ilk = assetMap.get(ilkId);

      if (!_base || !_ilk) {
        return undefined;
      }

      const [oracleAddr] = await cauldron.spotOracles(baseId, ilkId);

      if (oracleAddr === ethers.constants.AddressZero) {
        throw new Error(`no oracle set for base: ${baseId} and ilk: ${ilkId}}`);
      }

      const oracleContract = CompositeMultiOracle__factory.connect(oracleAddr, cauldron.provider); // using the composite multi oracle but all oracles should have the same interface

      diagnostics && console.log('Getting Asset Pair Info: ', baseId, ilkId);

      /* Get debt params and spot ratios */
      const [{ max, min, sum, dec }, { ratio }] = await Promise.all([
        cauldron.debt(baseId, ilkId),
        cauldron.spotOracles(baseId, ilkId),
      ]);

      /* get pricing if available */
      let price: BigNumber;
      try {
        [price] = await oracleContract.peek(
          bytesToBytes32(ilkId, 6),
          bytesToBytes32(baseId, 6),
          decimal18ToDecimalN(WAD_BN, _ilk.decimals)
        );
      } catch (error) {
        console.log('Error getting pricing for: ', baseId, ilkId, error);
        price = ethers.constants.Zero;
      }

      return {
        baseId,
        ilkId,
        limitDecimals: dec,
        minDebtLimit: BigNumber.from(min).mul(BigNumber.from('10').pow(dec)), // NB use limit decimals here > might not be same as base/ilk decimals
        maxDebtLimit: max.mul(BigNumber.from('10').pow(dec)), // NB use limit decimals here > might not be same as base/ilk decimals
        pairTotalDebt: sum,
        pairPrice: price, // value of 1 ilk (1x10**n) in terms of base.
        minRatio: parseFloat(ethers.utils.formatUnits(ratio, 6)), // pre-format ratio
        baseDecimals: _base.decimals,
      };
    },
    [assetMap, contracts, diagnostics, forkMulticall, multicall, useForkedEnv]
  );

  // This function is used to generate the key for the useSWR hook
  const genKey = useCallback(
    (baseId: string, ilkId: string, isVR = false) => [
      'assetPair',
      baseId,
      ilkId,
      isVR,
      assetMap,
      diagnostics,
      useForkedEnv,
      forkUrl,
    ],
    [assetMap, diagnostics, forkUrl, useForkedEnv]
  );
  const key = useMemo(
    () => (baseId && ilkId ? genKey(baseId!, ilkId!, selectedVR) : null),
    [baseId, genKey, ilkId, selectedVR]
  );

  const { data, error, isLoading } = useSWR(key, () => getAssetPair(baseId!, ilkId!, selectedVR), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  return {
    data,
    error,
    isLoading,
    getAssetPair,
    genKey,
  };
};

export default useAssetPair;
