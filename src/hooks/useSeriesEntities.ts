import { divDecimal, mulDecimal, toBn } from '@yield-protocol/ui-math';
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
        mu: string;
        c: string;
        currentSharePrice: string;
        sharesToken: string;
        borrowAPY: number;
        feeAPY: number;
      }[];
      name: string;
      decimals: number;
      symbol: string;
    };
  }[];
}

export const useSeriesEntities = (seriesId?: string) => {
  const chainId = useChainId();
  const provider = useProvider();
  const { address: account } = useAccount();
  const { subgraphUrl } = useSubgraph();
  const DEFAULT_SWR_KEY = useMemo(() => ['seriesEntities', chainId], [chainId]);

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

  const getSeriesEntities = useCallback(
    async (chain: number): Promise<Map<string, ISeriesRoot>> => {
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
                currentSharePrice
                sharesToken
                borrowAPY
                feeAPY
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
        const { id: poolAddress, sharesToken, borrowAPY, feeAPY, ts, g1, g2, c, mu } = fyToken.pools[0];
        const poolSymbol = `${fyTokenSymbol}LP`;
        const poolVersion = '1';
        const poolName = `${fyTokenSymbol} LP`;

        const seasonColorMap = [1, 4, 5, 42].includes(chain) ? ethereumColorMap : arbitrumColorMap;
        const season = getSeason(maturity);
        const oppSeason = (_season: SeasonType) => getSeason(maturity + 23670000);
        const [startColor, endColor, textColor] = seasonColorMap.get(season)!;
        const [oppStartColor, oppEndColor] = seasonColorMap.get(oppSeason(season))!;

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

          apr: borrowAPY.toString(),
          feeAPY: feeAPY.toString(),
          poolSharesAPY: await getPoolSharesAPY(sharesToken),

          ts,
          g1,
          g2,
          c,
          mu,
        };

        return (await acc).set(id, data);
      }, Promise.resolve(new Map<string, ISeriesRoot>()));
    },
    [getPoolSharesAPY, subgraphUrl]
  );

  const { data: seriesEntities } = useSWR(DEFAULT_SWR_KEY, getSeriesEntities, {
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
  const getSeriesEntity = async (seriesId: string | undefined): Promise<ISeries | undefined> => {
    if (!seriesId) return undefined;

    console.log('getting series entity data for series with id: ', seriesId);
    const seriesEntity = seriesEntities?.get(seriesId);

    if (!seriesEntity) return undefined;

    const poolContract = Pool__factory.connect(seriesEntity.poolAddress, provider);
    const fyTokenContract = FYToken__factory.connect(seriesEntity.fyTokenAddress, provider);

    const [baseReserves, fyTokenReserves, totalSupply, fyTokenRealReserves] = await Promise.all([
      poolContract.getBaseBalance(),
      poolContract.getFYTokenBalance(),
      poolContract.totalSupply(),
      fyTokenContract.balanceOf(seriesEntity.poolAddress),
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
      currentSharePrice = parseUnits('1', seriesEntity.decimals);
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

    let poolTokens = ethers.constants.Zero;
    let fyTokenBalance = ethers.constants.Zero;

    if (account) {
      [poolTokens, fyTokenBalance] = await Promise.all([
        poolContract.balanceOf(account),
        fyTokenContract.balanceOf(account),
      ]);
    }

    // get dynamic series entity data
    const data: ISeries = {
      ...seriesEntity,
      sharesReserves,
      sharesReserves_: formatUnits(sharesReserves, seriesEntity.decimals),
      fyTokenReserves,
      fyTokenRealReserves,
      totalSupply,
      totalSupply_: formatUnits(totalSupply, seriesEntity.decimals),

      poolTokens,
      poolTokens_: formatUnits(poolTokens, seriesEntity.decimals),
      fyTokenBalance,
      fyTokenBalance_: formatUnits(fyTokenBalance, seriesEntity.decimals),

      poolPercent: mulDecimal(divDecimal(poolTokens, totalSupply), '100'),

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
