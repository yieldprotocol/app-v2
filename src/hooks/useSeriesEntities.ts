import { Block } from '@ethersproject/providers';
import { calculateAPR, divDecimal, floorDecimal, mulDecimal, sellFYToken, toBn } from '@yield-protocol/ui-math';
import { format } from 'date-fns';
import Decimal from 'decimal.js';
import { BigNumber, ethers } from 'ethers';
import request from 'graphql-request';
import { useCallback, useContext, useMemo } from 'react';
import useSWR from 'swr';
import { useChainId, useAccount } from 'wagmi';
import { ETH_BASED_ASSETS } from '../config/assets';
import { arbitrumColorMap, ethereumColorMap } from '../config/colors';
import { ISeriesStatic, SERIES } from '../config/series';
import { SettingsContext } from '../contexts/SettingsContext';
import { FYToken__factory, Pool__factory } from '../contracts';
import { ISeries, ISeriesRoot } from '../types';
import { getSeason, nameFromMaturity, SeasonType } from '../utils/appUtils';
import { EULER_SUPGRAPH_ENDPOINT } from '../utils/constants';
import useContracts, { ContractNames } from './useContracts';
import useDefaultProvider from './useDefaultProvider';
import useTimeTillMaturity from './useTimeTillMaturity';

export interface SeriesEntitiesRoot {
  [seriesId: string]: ISeriesRoot;
}

export interface SeriesEntitiesData {
  seriesEntities: SeriesEntitiesRoot | undefined;
  seriesEntity: ISeries | undefined;
}

export const unMapify = (map: Map<string, any>) =>
  [...map.keys()].reduce((obj, key) => {
    return { ...obj, [key]: map.get(key) };
  }, {});

export const useSeriesEntities = (seriesId: string | undefined) => {
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);

  const contracts = useContracts();
  const chainId = useChainId();
  const provider = useDefaultProvider();
  const { address: account } = useAccount();
  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();
  const DEFAULT_SWR_KEY = useMemo(() => ['seriesEntities', chainId], [chainId]);

  const getPoolAPY = useCallback(
    async (sharesTokenAddr: string) => {
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
        diagnostics && console.log(`could not get pool apy for pool with shares token: ${sharesTokenAddr}`, error);
        return undefined;
      }
    },
    [diagnostics]
  );

  const getSeriesEntities = () => {
    console.log('getting all series data');
    const seriesEntities = SERIES.get(chainId);

    if (seriesEntities) {
      return [...seriesEntities.values()].reduce((acc, seriesEntity) => {
        const { maturity } = seriesEntity;
        const seasonColorMap = chainId === 1 ? ethereumColorMap : arbitrumColorMap;
        const season = getSeason(maturity);
        const oppSeason = (_season: SeasonType) => getSeason(maturity + 23670000);
        const [startColor, endColor, textColor] = seasonColorMap.get(season)!;
        const [oppStartColor, oppEndColor] = seasonColorMap.get(oppSeason(season))!;

        return {
          ...acc,
          [seriesEntity.id]: {
            ...seriesEntity,
            seriesIsMature: isMature(maturity),
            fullDate: format(new Date(maturity * 1000), 'dd MMMM yyyy'),
            displayName: format(new Date(maturity * 1000), 'dd MMM yyyy'),
            displayNameMobile: `${nameFromMaturity(maturity, 'MMM yyyy')}`,
            name: nameFromMaturity(seriesEntity.maturity),
            season,
            startColor,
            endColor,
            textColor,
            oppStartColor,
            oppEndColor,
            color: `linear-gradient(${startColor}, ${endColor})`,
          },
        };
      }, {} as SeriesEntitiesRoot);
    }

    return undefined;
  };

  const getSeriesEntity = useCallback(
    async (seriesMap: SeriesEntitiesRoot, seriesId: string): Promise<ISeries | undefined> => {
      const seriesEntity = seriesMap[seriesId];
      if (!seriesEntity) return undefined;

      const poolContract = Pool__factory.connect(seriesEntity.poolAddress, provider);
      const cauldron = contracts?.get(ContractNames.CAULDRON);

      const fyTokenAddr = await poolContract.fyToken();
      const fyTokenContract = FYToken__factory.connect(fyTokenAddr, provider);

      const [
        { baseId },
        name,
        symbol,
        version,
        decimals,
        poolName,
        poolVersion,
        poolSymbol,
        baseReserves,
        fyTokenReserves,
        totalSupply,
        fyTokenRealReserves,
        baseAddress,
      ] = await Promise.all([
        cauldron?.series(seriesId),
        fyTokenContract.name(),
        fyTokenContract.symbol(),
        fyTokenContract.version(),
        fyTokenContract.decimals(),
        poolContract.name(),
        poolContract.version(),
        poolContract.symbol(),
        poolContract.getBaseBalance(),
        poolContract.getFYTokenBalance(),
        poolContract.totalSupply(),
        fyTokenContract.balanceOf(seriesEntity.poolAddress),
        poolContract.baseToken(),
      ]);

      let sharesReserves: BigNumber | undefined;
      let c: BigNumber | undefined;
      let mu: BigNumber | undefined;
      let currentSharePrice: BigNumber | undefined;
      let sharesAddress: string | undefined;

      try {
        [sharesReserves, c, mu, currentSharePrice, sharesAddress] = await Promise.all([
          poolContract.getSharesBalance(),
          poolContract.getC(),
          poolContract.mu(),
          poolContract.getCurrentSharePrice(),
          poolContract.sharesToken(),
        ]);
      } catch (error) {
        sharesReserves = baseReserves;
        currentSharePrice = ethers.utils.parseUnits('1', seriesEntity.decimals);
        sharesAddress = baseAddress;
        diagnostics && console.log('Using old pool contract that does not include c, mu, and shares');
      }

      // convert base amounts to shares amounts (baseAmount is wad)
      const getShares = (baseAmount: BigNumber) =>
        toBn(
          new Decimal(baseAmount.toString())
            .mul(10 ** seriesEntity.decimals)
            .div(new Decimal(currentSharePrice?.toString()!))
        );

      // convert shares amounts to base amounts
      const getBase = (sharesAmount: BigNumber) =>
        toBn(
          new Decimal(sharesAmount.toString())
            .mul(new Decimal(currentSharePrice?.toString()!))
            .div(10 ** seriesEntity.decimals)
        );

      const rateCheckAmount = ethers.utils.parseUnits(
        ETH_BASED_ASSETS.includes(seriesEntity.baseId) ? '.001' : '1',
        seriesEntity.decimals
      );

      /* Calculates the base/fyToken unit selling price */
      const _sellRate = sellFYToken(
        sharesReserves,
        fyTokenReserves,
        rateCheckAmount,
        getTimeTillMaturity(seriesEntity.maturity),
        seriesEntity.ts,
        seriesEntity.g2,
        seriesEntity.decimals,
        c,
        mu
      );

      const apr = calculateAPR(floorDecimal(_sellRate), rateCheckAmount, seriesEntity.maturity) || '0';
      const poolAPY = sharesAddress ? await getPoolAPY(sharesAddress) : undefined;

      let currentInvariant: BigNumber | undefined;
      let initInvariant: BigNumber | undefined;
      let poolStartBlock: Block | undefined;

      try {
        // get pool init block
        const gmFilter = poolContract.filters.gm();
        const gm = await poolContract.queryFilter(gmFilter);
        poolStartBlock = await gm[0].getBlock();
        console.log('poolStartBlock:', poolStartBlock.number);
        currentInvariant = await poolContract.invariant();
        initInvariant = await poolContract.invariant({ blockTag: poolStartBlock.number });
      } catch (e) {
        diagnostics && console.log('Could not get current and init invariant for series', seriesEntity.id);
      }

      const publicData: ISeries = {
        ...seriesEntity,
        baseId,
        name,
        symbol,
        version,
        decimals,
        poolName,
        poolVersion,
        poolSymbol,
        sharesReserves,
        sharesReserves_: ethers.utils.formatUnits(sharesReserves, seriesEntity.decimals),
        fyTokenReserves,
        fyTokenRealReserves,
        totalSupply,
        totalSupply_: ethers.utils.formatUnits(totalSupply, seriesEntity.decimals),
        apr: `${Number(apr).toFixed(2)}`,
        c,
        mu,
        poolAPY,
        getShares,
        getBase,
        sharesAddress,
        currentInvariant,
        initInvariant,
        startBlock: poolStartBlock!,

        fyTokenContract,
        poolContract,
      };

      if (account) {
        const [poolTokens, fyTokenBalance] = await Promise.all([
          poolContract.balanceOf(account),
          fyTokenContract.balanceOf(account),
        ]);

        const poolPercent = mulDecimal(divDecimal(poolTokens, publicData.totalSupply), '100');

        return {
          ...publicData,
          poolTokens,
          fyTokenBalance,
          poolTokens_: ethers.utils.formatUnits(poolTokens, seriesEntity.decimals),
          fyTokenBalance_: ethers.utils.formatUnits(fyTokenBalance, seriesEntity.decimals),
          poolPercent,
        };
      }

      return publicData;
    },
    [account, contracts, diagnostics, getPoolAPY, getTimeTillMaturity, provider]
  );

  const { data: seriesEntities } = useSWR(DEFAULT_SWR_KEY, getSeriesEntities, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // This function is used to generate the key for the main useSWR hook below
  const genKey = useCallback(() => {
    if (seriesId) {
      return [...DEFAULT_SWR_KEY, seriesEntities, seriesId];
    }

    return DEFAULT_SWR_KEY;
  }, [DEFAULT_SWR_KEY, seriesEntities, seriesId]);

  // gets a specific series entity or all series entities if no seriesId is provided
  const main = async () => {
    if (!seriesId) return seriesEntities;

    console.log('getting series entity data for series with id: ', seriesId);
    // get dynamic series entity data
    return seriesEntities![seriesId] ? getSeriesEntity(seriesEntities!, seriesId) : undefined;
  };

  // main entry hook that returns either a specific series entity's data, or all series entities' data if no seriesId is provided
  const { data, error } = useSWR(genKey, main, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    data: { seriesEntities: data, seriesEntity: data } as SeriesEntitiesData,
    error,
    isLoading: !data && !error,
    genKey,
  };
};

export default useSeriesEntities;
