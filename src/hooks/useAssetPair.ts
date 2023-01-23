import { useContext, useEffect, useState } from 'react';
import { IAsset, IAssetPair, IAssetRoot } from '../types';
import { BigNumber, ethers } from 'ethers';
import useSWRImmutable from 'swr/immutable';
import useSWR, { Middleware, SWRHook } from 'swr';
import { useAccount, useChainId } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';

import { bytesToBytes32, decimal18ToDecimalN, WAD_BN } from '@yield-protocol/ui-math';
import { ORACLE_INFO } from '../config/oracles';
import useContracts, { ContractNames } from './useContracts';

import { ENS, FRAX, USDC, WETH } from '../config/assets';

// This hook is used to get the asset pair info for a given base and collateral
export const useAssetPairs = (base?: string, collaterals: (string | undefined)[] = []) => {
  /* CONTEXT STATE */
  const {
    chainState: { assetRootMap },
  } = useContext(ChainContext);

  /* HOOKS */
  const chainId = useChainId();
  const contracts = useContracts();
  const Cauldron = contracts.get(ContractNames.CAULDRON);

  /* LOCAL STATE */
  // const [_base, setBase] = useState<string| undefined>();
  // // const [_collateral, setCollateral] = useState< ( string | undefined )[] | undefined>(collaterals);
  // const [_collateral, setCollateral] = useState<string[]>([]);
  // keep state up to date
  // useEffect(()=>{ setBase(base) }, [base])
  // useEffect(()=>{ setCollateral(collaterals) }, [collaterals])

  /* GET PAIR INFO */
  const getAssetPair = async ([baseId, ilkId]: [string, string]): Promise<IAssetPair | null> => {
    const oracleName = ORACLE_INFO.get(chainId)?.get(baseId)?.get(ilkId);
    const PriceOracle = contracts.get(oracleName!);
    const _base = assetRootMap.get(baseId);
    const _ilk = assetRootMap.get(ilkId);

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
    if (base && collaterals[0]) {
      return [base, collaterals[0]];
    }
    return null;
  };

  const serialize: Middleware = (useSWRNext: SWRHook) => (key, fetcher, config) => {
    
    console.log(key);

    [USDC,[WETH, ENS, FRAX]][1].forEach((a) => {
      console.log(a)
      
      useSWRNext([a], getAssetPair, config);
      useSWRNext([a], getAssetPair, config);
      useSWRNext([a], getAssetPair, config);
    });
    
    // // Serialize the key.
    // const serializedKey = Array.isArray(key) ? JSON.stringify(key) : key;
    // // Pass the serialized key, and unserialize it in fetcher.
    // return useSWRNext(serializedKey, (k: any) => fetcher(...JSON.parse(k)), config);
    return useSWRNext(keyFunc, getAssetPair, config);
    
  };

  const { data: pairInfo, error } = useSWR(keyFunc, getAssetPair, {
    use: [serialize],
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // function myMiddleware (useSWRNext) {
  //   return (key, fetcher, config) => {
  //     // Before hook runs...
  //     // Handle the next middleware, or the `useSWR` hook if this is the last one.
  //     const swr = useSWRNext(key, fetcher, config)
  //     // After hook runs...
  //     return swr
  //   }
  // }

  // const { data: assetPairs, error: groupError } = useSWR(groupKeyFunc, getAssetPairGroup, {
  //   revalidateIfStale: false,
  //   revalidateOnFocus: false,
  //   revalidateOnReconnect: false,
  // });

  return {
    assetPairs: [pairInfo],
    isLoading: !pairInfo && !error,
    key: keyFunc(),
  };
};
