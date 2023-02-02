import { useContext, useEffect, useState } from 'react';
import { ISeries } from '../types';
import useSWR, { Middleware, SWRHook } from 'swr';
import { useChainId } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';

import useContracts, { ContractNames } from './useContracts';

// This hook is used to get the asset pair info for a given base and collateral
export const useSeries = ( seriesId: string| undefined ) => {
  
  /* CONTEXT STATE */
  const {
    chainState: { seriesRootMap },
  } = useContext(ChainContext);

  /* HOOKS */
  const chainId = useChainId();
  const contracts = useContracts();
  const Cauldron = contracts.get(ContractNames.CAULDRON);

  /* LOCAL STATE */

  /* GET ALL SERIES INFO */
  // const getAllSeriesInfo = async (): Promise<Map<string, ISeries> | null> => {
  const getAllSeriesInfo = async () => {
    console.log( 'getting All series dAta' )

    const newMap = seriesRootMap
    // return [...seriesRootMap.values()].reduce(async (acc, seriesEntity) => {
    //   const fyTokenContract = FYToken__factory.connect(seriesEntity.address, provider);
    //   const fyTokenBalance = account ? await fyTokenContract.balanceOf(account) : ethers.constants.Zero;

    //   return (await acc).set(seriesEntity.id, {
    //     ...seriesEntity,
    //     fyTokenBalance: { value: fyTokenBalance, formatted: formatUnits(fyTokenBalance, seriesEntity.decimals) },
    //   });
     
    return newMap;
  }

  /* GET SERIES INFO */
  // const getSeriesInfo = async ([baseId, ilkId]: [string, string]): Promise<ISeries | null> => {
  const getSeriesInfo = async ([seriesId]: [string]) => {

    if (seriesId === 'bypass' ) return allSeriesInfo;


    const series =  allSeriesInfo?.get(seriesId);
    console.log( 'getting series dAta for: ', series, series )
    
    return series

  };

  // This function is used to generate the key for the useSWR hook
  const seriesKeyFn = () => {
    const series = allSeriesInfo?.get(seriesId!)
    // getdynnmic () 
    return series ? [series] : ['bypass'];
  };

  // mai entry  hook
  const { data: seriesInfo, error } = useSWR(seriesKeyFn, getSeriesInfo, {
    // use: [someMiddleWare],
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const { data: allSeriesInfo, error: allSeriesError } = useSWR( 'allSeriesInfo' , getAllSeriesInfo, {
    // use: [ someMiddleWare ],
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    data: seriesInfo,
    isLoading: !seriesInfo && !error,
    // key: pairKeyFn(),
  };
};

export default useSeries;
