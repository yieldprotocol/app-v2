import { useContext } from 'react';
import { IAssetPair } from '../types';
import { BigNumber, ethers } from 'ethers';
import useSWR from 'swr';
import { useProvider } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';

import { bytesToBytes32, decimal18ToDecimalN, WAD_BN } from '@yield-protocol/ui-math';
import useContracts, { ContractNames } from './useContracts';
import { Cauldron, CompositeMultiOracle__factory } from '../contracts';

// This hook is used to get the asset pair info for a given base and collateral (ilk)
const useAssetPair = (baseId?: string, ilkId?: string) => {
  /* CONTEXT STATE */
  const {
    chainState: { assetRootMap },
  } = useContext(ChainContext);

  /* HOOKS */
  const provider = useProvider();
  const contracts = useContracts();
  const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron;

  /* GET PAIR INFO */
  const getAssetPair = async (baseId: string, ilkId: string): Promise<IAssetPair | undefined> => {
    const _base = assetRootMap.get(baseId);
    const _ilk = assetRootMap.get(ilkId);

    if (!_base || !_ilk) {
      return undefined;
    }

    const [oracleAddr] = await Cauldron.spotOracles(baseId, ilkId);
    console.log('🦄 ~ file: useAssetPair.ts:34 ~ getAssetPair ~ oracleAddr', oracleAddr);

    if (oracleAddr === ethers.constants.AddressZero) {
      throw new Error(`no oracle set for base: ${baseId} and ilk: ${ilkId}}`);
    }

    const oracleContract = CompositeMultiOracle__factory.connect(oracleAddr, provider); // using the composite multi oracle but all oracles should have the same interface

    console.log('Getting Asset Pair Info: ', baseId, ilkId);

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
  const genKey = (baseId: string, ilkId: string) => {
    return ['assetPair', baseId, ilkId];
  };

  const { data: assetPair, error } = useSWR(
    baseId && ilkId ? () => genKey(baseId, ilkId) : null,
    () => getAssetPair(baseId!, ilkId!),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    assetPair,
    isLoading: !assetPair && !error,
    genKey,
  };
};

export default useAssetPair;
