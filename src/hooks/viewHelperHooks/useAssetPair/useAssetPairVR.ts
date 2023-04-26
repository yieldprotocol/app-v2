import { useCallback, useContext } from 'react';
import { IAssetPair } from '../../../types';
import { BigNumber, ethers } from 'ethers';
import useSWR from 'swr';
import { bytesToBytes32, decimal18ToDecimalN, WAD_BN } from '@yield-protocol/ui-math';
import useContracts from '../../useContracts';
import { VRCauldron, CompositeMultiOracle__factory } from '../../../contracts';
import useChainId from '../../useChainId';
import { UserContext } from '../../../contexts/UserContext';
import { ContractNames } from '../../../config/contracts';
import useFork from '../../useFork';
import useDefaultProvider from '../../useDefaultProvider';
import { SettingsContext } from '../../../contexts/SettingsContext';

// This hook is used to get the asset pair info for a given base and collateral (ilk)
const useAssetPairVR = (baseId?: string, ilkId?: string) => {
  console.log('useAssetPairVariableRate args: ', baseId, ilkId);

  /* CONTEXT STATE */
  const {
    userState: { assetMap },
  } = useContext(UserContext);

  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const chainId = useChainId();

  /* HOOKS */
  const provider = useDefaultProvider();
  const { useForkedEnv, provider: forkProvider, forkUrl, forkStartBlock } = useFork();
  const contracts = useContracts();

  /* GET PAIR INFO */
  const getAssetPair = async (baseId: string, ilkId: string): Promise<IAssetPair | undefined> => {
    const Cauldron = contracts?.get(ContractNames.VR_CAULDRON) as VRCauldron;

    const _base = assetMap.get(baseId);
    const _ilk = assetMap.get(ilkId);

    if (!_base || !_ilk) {
      return undefined;
    }

    const [oracleAddr] = await Cauldron.spotOracles(baseId, ilkId);

    if (oracleAddr === ethers.constants.AddressZero) {
      throw new Error(`no oracle set for base: ${baseId} and ilk: ${ilkId}}`);
    }

    const oracleContract = CompositeMultiOracle__factory.connect(oracleAddr, provider); // using the composite multi oracle but all oracles should have the same interface

    diagnostics && console.log('Getting Asset Pair Info VR: ', baseId, ilkId);

    /* Get debt params and spot ratios */
    const [{ max, min, sum, dec }, { ratio }] = await Promise.all([
      Cauldron.debt(baseId, ilkId),
      Cauldron.spotOracles(baseId, ilkId),
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
  };

  // This function is used to generate the key for the useSWR hook
  const genKey = useCallback(
    (baseId: string, ilkId: string) => {
      return ['assetPair', chainId, baseId, ilkId];
    },
    [chainId]
  );

  const { data, error } = useSWR(
    baseId && ilkId ? () => genKey(baseId, ilkId) : null,
    () => getAssetPair(baseId!, ilkId!),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    getAssetPair,
    genKey,
  };
};

export default useAssetPairVR;
