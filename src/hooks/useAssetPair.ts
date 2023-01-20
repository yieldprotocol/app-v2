import { useContext, useEffect, useState } from 'react';
import { IAsset, IAssetPair, IAssetRoot } from '../types';
import { BigNumber, ethers } from 'ethers';
import useSWRImmutable from 'swr/immutable';
import useSWR from 'swr';
import { useAccount, useChainId } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';

import { bytesToBytes32, decimal18ToDecimalN, WAD_BN } from '@yield-protocol/ui-math';
import { ORACLE_INFO } from '../config/oracles';
import useContracts, { ContractNames } from './useContracts';
import { UserContext } from '../contexts/UserContext';

// This hook is used to get the asset pair info for a given base and collateral
export const useAssetPair = (base?: IAssetRoot, collateral?: IAssetRoot) => {
  /* CONTEXT STATE */
  const {
    userState: { assetMap },
  } = useContext(UserContext);

  /* HOOKS */
  const chainId = useChainId();
  const contracts = useContracts();
  const Cauldron = contracts.get(ContractNames.CAULDRON);

  /* GET PAIR INFO */
  const getAssetPairGroup = async (base: IAssetRoot, ilkList: IAssetRoot[]): Promise<IAssetPair | null> => {
    ilkList.map(() => {});
    return null;
  };

  /* GET PAIR INFO */
  const getAssetPair = async ([baseId, ilkId]: [string, string]): Promise<IAssetPair | null> => {
    const oracleName = ORACLE_INFO.get(chainId)?.get(baseId)?.get(ilkId);
    const PriceOracle = contracts.get(oracleName!);

    const _base = assetMap.get(baseId);
    const _ilk = assetMap.get(ilkId);

    /* if all the parts are there update the pairInfo */
    if (Cauldron && PriceOracle && _base && _ilk) {
      console.log('Getting Asset Pair Info: ', baseId, ilkId);

      /* Get debt params and spot ratios */
      const [{ max, min, sum, dec }, { ratio }] = await Promise.all([
        Cauldron.debt(baseId, ilkId),
        Cauldron.spotOracles(baseId, ilkId),
      ]);

      /* get pricing if available */
      let price: BigNumber;
      try {
        // eslint-disable-next-line prefer-const
        [price] = await PriceOracle.peek(
          bytesToBytes32(ilkId, 6),
          bytesToBytes32(baseId, 6),
          decimal18ToDecimalN(WAD_BN, _ilk.decimals)
        );
      } catch (error) {
        console.log('Error getting pricing for: ', baseId, ilkId, error);
        price = ethers.constants.Zero;
      }

      return {
        baseId: baseId,
        ilkId: ilkId,
        limitDecimals: dec,
        minDebtLimit: BigNumber.from(min).mul(BigNumber.from('10').pow(dec)), // NB use limit decimals here > might not be same as base/ilk decimals
        maxDebtLimit: max.mul(BigNumber.from('10').pow(dec)), // NB use limit decimals here > might not be same as base/ilk decimals
        pairTotalDebt: sum,
        pairPrice: price, // value of 1 ilk (1x10**n) in terms of base.
        minRatio: parseFloat(ethers.utils.formatUnits(ratio, 6)), // pre-format ratio
        baseDecimals: _base.decimals,
        oracle: oracleName || '',
      };
    }
    return null;
  };

  // This function is used to generate the key for the useSWR hook
  const keyFunc = () => {
    if (base && collateral) {
      return [`${base.id + collateral.id}`];
    }
    // if (base && collateralList && collateralList.length > 1) {
    //   collateralList.forEach(async ()=>{
    //   })
    // }
    return null;
  };

  // This function is used to generate the key for the useSWR hook
  const groupKeyFunc = () => {
    // if ( base && collateral ) {
    //   return [ `${base.id+ collateral.id}`]
    // }
    // if (base && collateralList && collateralList.length > 1) {
    //   collateralList.forEach(async ()=>{
    //   })
    // }
    return null;
  };

  const { data: assetPair, error } = useSWR(keyFunc, getAssetPair, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const { data: groupPairData, error: groupError } = useSWR(groupKeyFunc, getAssetPairGroup, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    assetPair,
    isLoading: !assetPair && !error,
    key: keyFunc(),
  };
};
