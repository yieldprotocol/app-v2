import { useCallback, useContext, useEffect, useMemo } from 'react';
import { IAsset, IAssetPair } from '../types';
import { BigNumber, ethers } from 'ethers';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

import { bytesToBytes32, decimal18ToDecimalN, WAD_BN } from '@yield-protocol/ui-math';
import useContracts, { ContractNames } from './useContracts';
import { Cauldron, CompositeMultiOracle__factory } from '../contracts';
import useChainId from './useChainId';
import { UserContext } from '../contexts/UserContext';
import { stETH, wstETH } from '../config/assets';
import useFork from './useFork';
import { JsonRpcProvider, Provider } from '@ethersproject/providers';
import useDefaultProvider from './useDefaultProvider';

// This hook is used to get the asset pair info for a given base and collateral (ilk)
const useAssetPair = (baseId?: string, ilkId?: string, seriesId?: string) => {
  /* CONTEXT STATE */
  const {
    userState: { assetMap },
  } = useContext(UserContext);
  const chainId = useChainId();

  /* HOOKS */
  const provider = useDefaultProvider();
  const { useForkedEnv, provider: forkProvider, forkUrl } = useFork();
  const contracts = useContracts();

  /* GET PAIR INFO */
  const getAssetPair = async (baseId: string, ilkId: string): Promise<IAssetPair | undefined> => {
    const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron;

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

  const getSeriesEntityIlks = useCallback(async () => {
    if (!seriesId) return undefined;

    console.log('getting series ilks for: ', seriesId);

    const getIlkAddedEvents = async (provider: JsonRpcProvider | Provider, seriesId: string) => {
      const cauldron = contracts.get(ContractNames.CAULDRON)?.connect(provider) as Cauldron;
      try {
        return await cauldron.queryFilter(cauldron.filters.IlkAdded(bytesToBytes32(seriesId, 6)), 'earliest');
      } catch (e) {
        console.log('error getting ilk added events: ', e);
        return [];
      }
    };

    let ilkAddedEvents = new Set(await getIlkAddedEvents(provider, seriesId));

    // get cauldron ilkAdded events for this series id using fork env
    if (useForkedEnv && forkProvider) {
      ilkAddedEvents = new Set([...ilkAddedEvents, ...(await getIlkAddedEvents(forkProvider, seriesId))]);
    }

    return [...ilkAddedEvents.values()].reduce((acc, { args: { ilkId } }) => {
      const asset = assetMap.get(ilkId.toLowerCase());
      if (!asset) return acc;

      // handle/add stETH if wstETH; it's wrapped to wstETH by default and doesn't have an addIlk event
      return asset.id.toLowerCase() === wstETH.toLowerCase()
        ? [...acc, asset, assetMap.get(stETH.toLowerCase())!]
        : [...acc, asset];
    }, [] as IAsset[]);
  }, [assetMap, contracts, forkProvider, provider, seriesId, useForkedEnv]);

  const { data: validIlks, error: validIlksError } = useSWRImmutable(
    seriesId ? ['seriesIlks', chainId, useForkedEnv, forkUrl, seriesId] : null,
    getSeriesEntityIlks,
    {
      shouldRetryOnError: false,
    }
  );

  useEffect(() => {
    console.log(['seriesIlks', chainId, useForkedEnv, forkUrl, seriesId]);
  }, [chainId, forkUrl, seriesId, useForkedEnv]);

  return {
    data,
    error,
    isLoading: !data && !error,
    getAssetPair,
    genKey,
    validIlks,
    validIlksLoading: !validIlks && !validIlksError,
  };
};

export default useAssetPair;
