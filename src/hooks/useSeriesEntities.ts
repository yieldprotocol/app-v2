import { toBn } from '@yield-protocol/ui-math';
import { format } from 'date-fns';
import Decimal from 'decimal.js';
import { BigNumber, ethers } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils.js';
import request, { gql } from 'graphql-request';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { useAccount, useChainId, useProvider } from 'wagmi';
import { arbitrumColorMap, ethereumColorMap } from '../config/colors';
import { FYToken__factory, Pool__factory } from '../contracts';
import { ISeries, ISeriesRoot } from '../types';
import { getSeason, nameFromMaturity, SeasonType } from '../utils/appUtils';
import { EULER_SUPGRAPH_ENDPOINT } from '../utils/constants';
import useSubgraph from './useSubgraph';

interface GraphSeriesEntitiesRes {
  seriesEntities: {
    id: string;
    maturity: number;
    matured: boolean;
    baseAsset: {
      assetId: string;
      id: string;
    };
    fyToken: {
      id: string;
      pools: {
        id: string;
        ts: string;
        g1: string;
        g2: string;
        mu: string | null;
        c: string | null;
        sharesToken: string;
        borrowAPR: number;
        lendAPR: number;
        feeAPR: number;
      }[];
      name: string;
      decimals: number;
      symbol: string;
    };
  }[];
}

export const useSeriesEntities = (seriesId?: string | null) => {
  const chainId = useChainId();
  const provider = useProvider();
  const { address: account } = useAccount();
  const { subgraphUrl } = useSubgraph();
  const DEFAULT_SWR_KEY = useMemo(() => ['seriesEntities', chainId], [chainId]);
  const seasonColorMap = [1, 4, 5, 42].includes(chainId) ? ethereumColorMap : arbitrumColorMap;

  const getPoolSharesAPY = useCallback(async (sharesTokenAddr: string) => {
    const query = `
    query ($address: Bytes!) {
      eulerMarketStore(id: "euler-market-store") {
        markets(where:{eTokenAddress:$address}) {
          supplyAPY
         } 
      }
    }
  `;
    interface EulerRes {
      eulerMarketStore: {
        markets: {
          supplyAPY: string;
        }[];
      };
    }

    try {
      const {
        eulerMarketStore: { markets },
      } = await request<EulerRes>(EULER_SUPGRAPH_ENDPOINT, query, { address: sharesTokenAddr });
      return ((+markets[0].supplyAPY * 100) / 1e27).toString();
    } catch (error) {
      console.log(`could not get pool apy for pool with shares token: ${sharesTokenAddr}`, error);
      return '0';
    }
  }, []);

  const getSeriesEntities = useCallback(async (): Promise<Map<string, ISeriesRoot>> => {
    const query = gql`
      {
        seriesEntities {
          id
          maturity
          matured
          baseAsset {
            id
            assetId
          }
          fyToken {
            id
            decimals
            symbol
            pools {
              id
              ts
              g1
              g2
              mu
              c
              sharesToken
              borrowAPR
              lendAPR
              feeAPR
            }
          }
        }
      }
    `;
    const { seriesEntities } = await request<GraphSeriesEntitiesRes>(subgraphUrl, query);

    return seriesEntities.reduce(async (acc, seriesEntity) => {
      const {
        id,
        maturity,
        matured: seriesIsMature,
        baseAsset: { assetId: baseId, id: baseAddress },
        fyToken,
      } = seriesEntity;
      const { id: fyTokenAddress, decimals: fyTokenDecimals, symbol: fyTokenSymbol } = fyToken;
      const { id: poolAddress, sharesToken, borrowAPR, lendAPR, feeAPR, ts, g1, g2, c, mu } = fyToken.pools[0];
      const poolSymbol = `${fyTokenSymbol}LP`;
      const poolVersion = '1';
      const poolName = `${fyTokenSymbol} LP`;

      const season = getSeason(maturity);
      const oppSeason = (_season: SeasonType) => getSeason(maturity + 23670000);
      const [startColor, endColor, textColor] = seasonColorMap.get(season)!;
      const [oppStartColor, oppEndColor] = seasonColorMap.get(oppSeason(season))!;

      const poolContract = Pool__factory.connect(poolAddress, provider);
      const fyTokenContract = FYToken__factory.connect(fyTokenAddress, provider);

      let fyTokenBalance = ethers.constants.Zero;
      if (account) {
        fyTokenBalance = await fyTokenContract.balanceOf(account);
      }

      const data: ISeriesRoot = {
        name: poolName,
        version: poolVersion, // TODO: should be fyToken version for signing
        address: fyTokenAddress, // for signing
        symbol: fyTokenSymbol,
        id,
        maturity,
        seriesIsMature,
        showSeries: true,
        decimals: fyTokenDecimals,

        fullDate: format(new Date(maturity * 1000), 'dd MMMM yyyy'),
        displayName: format(new Date(maturity * 1000), 'dd MMM yyyy'),
        displayNameMobile: `${nameFromMaturity(maturity, 'MMM yyyy')}`,

        poolAddress,
        poolName,
        poolVersion,
        poolSymbol,

        baseId,
        baseAddress,
        sharesTokenAddress: sharesToken,
        fyTokenAddress,

        color: `linear-gradient(${startColor}, ${endColor})`,
        textColor,
        startColor,
        endColor,

        oppStartColor,
        oppEndColor,

        borrowAPR: borrowAPR.toString(),
        lendAPR: lendAPR.toString(),
        feeAPY: feeAPR.toString(),
        poolSharesAPY: sharesToken === baseAddress ? '0' : await getPoolSharesAPY(sharesToken),

        ts,
        g1,
        g2,
        c: c ?? undefined,
        mu: mu ?? undefined,
        poolContract,
        fyTokenContract,

        fyTokenBalance,
        fyTokenBalance_: formatUnits(fyTokenBalance, fyTokenDecimals),
      };

      return (await acc).set(id.toLowerCase(), data);
    }, Promise.resolve(new Map<string, ISeriesRoot>()));
  }, [account, getPoolSharesAPY, provider, seasonColorMap, subgraphUrl]);

  const { data: seriesEntities, error: seriesEntitiesError } = useSWR(DEFAULT_SWR_KEY, getSeriesEntities, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // This function is used to generate the key for the main useSWR hook below
  const genKey = useCallback(
    (seriesId: string) => [...DEFAULT_SWR_KEY, seriesEntities, seriesId],
    [DEFAULT_SWR_KEY, seriesEntities]
  );

  // gets a specific series entity
  const getSeriesEntity = async (seriesId: string | null | undefined): Promise<ISeries | undefined> => {
    if (!seriesId || !seriesEntities) return undefined;

    console.log('getting series entity data for series with id: ', seriesId);
    const seriesEntity = seriesEntities.get(seriesId);

    if (!seriesEntity) return undefined;

    const { poolContract, fyTokenContract, decimals, poolAddress } = seriesEntity;

    const [baseReserves, fyTokenReserves, fyTokenRealReserves, fyTokenBalance] = await Promise.all([
      poolContract.getBaseBalance(),
      poolContract.getFYTokenBalance(),
      fyTokenContract.balanceOf(poolAddress),
      account ? fyTokenContract.balanceOf(account) : ethers.constants.Zero,
    ]);

    let sharesReserves: BigNumber | undefined;
    let currentSharePrice: BigNumber;

    try {
      [sharesReserves, currentSharePrice] = await Promise.all([
        poolContract.getSharesBalance(),
        poolContract.getCurrentSharePrice(),
      ]);
    } catch (e) {
      sharesReserves = baseReserves;
      currentSharePrice = parseUnits('1', decimals);
    }

    // convert base amounts to shares amounts (baseAmount is wad)
    const getShares = (baseAmount: BigNumber) =>
      toBn(
        new Decimal(baseAmount.toString())
          .mul(10 ** seriesEntity.decimals)
          .div(new Decimal(currentSharePrice.toString()))
      );

    // convert shares amounts to base amounts
    const getBase = (sharesAmount: BigNumber) =>
      toBn(
        new Decimal(sharesAmount.toString())
          .mul(new Decimal(currentSharePrice.toString()))
          .div(10 ** seriesEntity.decimals)
      );

    // get dynamic series entity data
    const data: ISeries = {
      ...seriesEntity,
      sharesReserves,
      fyTokenReserves,
      fyTokenRealReserves,
      fyTokenBalance,
      fyTokenBalance_: formatUnits(fyTokenBalance, decimals),

      getShares,
      getBase,
    };

    return data;
  };

  const { data, error } = useSWR(seriesId ? () => genKey(seriesId) : null, () => getSeriesEntity(seriesId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    seriesEntities: {
      data: seriesEntities,
      error: seriesEntitiesError,
      isLoading: !seriesEntities && !seriesEntitiesError,
    },
    seriesEntity: {
      data,
      error,
      isLoading: !data && !error,
    },
    genKey,
  };
};

export default useSeriesEntities;
