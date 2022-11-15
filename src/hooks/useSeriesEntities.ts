import useSWRImmutable from 'swr/immutable';
import { Block } from '@ethersproject/providers';
import { calculateAPR, floorDecimal, sellFYToken, toBn } from '@yield-protocol/ui-math';
import { format } from 'date-fns';
import Decimal from 'decimal.js';
import { BigNumber } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import request from 'graphql-request';
import { useCallback, useContext, useMemo } from 'react';
import { ETH_BASED_ASSETS } from '../config/assets';
import { arbitrumColorMap, ethereumColorMap } from '../config/colors';
import { SERIES_1, SERIES_42161 } from '../config/series';
import { SettingsContext } from '../contexts/SettingsContext';
import { Cauldron, FYToken__factory, Pool__factory } from '../contracts';
import { ISeries, ISeriesDynamic } from '../types';
import { getSeason, nameFromMaturity, SeasonType } from '../utils/appUtils';
import { EULER_SUPGRAPH_ENDPOINT } from '../utils/constants';
import useChainId from './useChainId';
import useContracts, { ContractNames } from './useContracts';
import useDefaultProvider from './useDefaultProvider';
import useTimeTillMaturity from './useTimeTillMaturity';
import { useAccount } from 'wagmi';

const mapify = (obj: Object) =>
  [...Object.keys(obj)].reduce((map, key) => {
    return map.set(key, (obj as any)[key]);
  }, new Map());

const useSeriesEntities = () => {
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext);
  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();
  const { address: account } = useAccount();
  const provider = useDefaultProvider();
  const chainId = useChainId();
  const contracts = useContracts();
  const Cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron | undefined;

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

  // gets a single series non-dynamic
  const getSeriesEntity = useCallback(
    async (id: string): Promise<ISeries> => {
      const seriesMap = chainId === 1 ? SERIES_1 : SERIES_42161;
      if (!Cauldron) throw new Error('no cauldron detected');

      const seriesEntity = seriesMap.get(id);
      if (!seriesEntity) throw new Error(`no series with ${id} in series config`);

      const { fyTokenAddress, poolAddress } = seriesEntity;

      const poolContract = Pool__factory.connect(poolAddress, provider);
      const fyTokenContract = FYToken__factory.connect(fyTokenAddress, provider);

      const [
        { maturity, baseId },
        name,
        symbol,
        version,
        decimals,
        poolName,
        poolVersion,
        poolSymbol,
        baseAddress,
        sharesAddress,
      ] = await Promise.all([
        Cauldron.series(id),
        fyTokenContract.name(),
        fyTokenContract.symbol(),
        fyTokenContract.version(),
        fyTokenContract.decimals(),
        poolContract.name(),
        poolContract.version(),
        poolContract.symbol(),
        poolContract.base(),
        poolContract.sharesToken(),
      ]);

      const seasonColorMap = [1, 4, 5, 42].includes(chainId) ? ethereumColorMap : arbitrumColorMap;
      const season = getSeason(maturity);
      const oppSeason = (_season: SeasonType) => getSeason(maturity + 23670000);
      const [startColor, endColor, textColor] = seasonColorMap.get(season)!;
      const [oppStartColor, oppEndColor, oppTextColor] = seasonColorMap.get(oppSeason(season))!;

      return {
        id,
        baseId,
        maturity,
        name,
        symbol,
        version,
        address: fyTokenAddress,
        fyTokenAddress,
        decimals,
        poolAddress,
        poolVersion,
        poolName,
        poolSymbol,
        baseAddress,
        sharesAddress,
        fullDate: format(new Date(maturity * 1000), 'dd MMMM yyyy'),
        displayName: format(new Date(maturity * 1000), 'dd MMM yyyy'),
        displayNameMobile: `${nameFromMaturity(maturity, 'MMM yyyy')}`,

        season,
        startColor,
        endColor,
        color: `linear-gradient(${startColor}, ${endColor})`,
        textColor,

        oppStartColor,
        oppEndColor,
        oppTextColor,
      };
    },
    [Cauldron, chainId, provider]
  );

  // gets a single series
  const getSeriesEntityDynamic = useCallback(
    async (id: string): Promise<ISeriesDynamic> => {
      const seriesEntity = await getSeriesEntity(id);
      const { maturity, baseId, sharesAddress, decimals } = seriesEntity;
      const poolContract = Pool__factory.connect(seriesEntity.poolAddress, provider);
      const fyTokenContract = FYToken__factory.connect(seriesEntity.fyTokenAddress, provider);
      const [ts, g1, g2, sharesReserves, fyTokenReserves, totalSupply, fyTokenRealReserves, c, mu, currentSharePrice] =
        await Promise.all([
          poolContract.ts(),
          poolContract.g1(),
          poolContract.g2(),
          poolContract.getSharesBalance(),
          poolContract.getFYTokenBalance(),
          poolContract.totalSupply(),
          fyTokenContract.balanceOf(seriesEntity.poolAddress),

          poolContract.getSharesBalance(),
          poolContract.getC(),
          poolContract.mu(),
          poolContract.getCurrentSharePrice(),
        ]);

      // convert base amounts to shares amounts (baseAmount is wad)
      const getShares = (baseAmount: BigNumber) =>
        toBn(new Decimal(baseAmount.toString()).mul(10 ** decimals).div(new Decimal(currentSharePrice?.toString()!)));

      // convert shares amounts to base amounts
      const getBase = (sharesAmount: BigNumber) =>
        toBn(new Decimal(sharesAmount.toString()).mul(new Decimal(currentSharePrice?.toString()!)).div(10 ** decimals));

      const rateCheckAmount = parseUnits(ETH_BASED_ASSETS.includes(baseId) ? '.001' : '1', decimals);

      /* Calculates the base/fyToken unit selling price */
      const _sellRate = sellFYToken(
        sharesReserves,
        fyTokenReserves,
        rateCheckAmount,
        getTimeTillMaturity(maturity),
        ts,
        g2,
        decimals,
        c,
        mu
      );

      const apr = calculateAPR(floorDecimal(_sellRate), rateCheckAmount, maturity) || '0';
      const poolAPY = await getPoolAPY(sharesAddress);

      let currentInvariant: BigNumber | undefined;
      let initInvariant: BigNumber | undefined;
      let startBlock: Block | undefined;

      try {
        // get pool init block
        const gmFilter = poolContract.filters.gm();
        const gm = (await poolContract.queryFilter(gmFilter))[0];
        startBlock = await gm.getBlock();

        currentInvariant = await poolContract.invariant();
        initInvariant = await poolContract.invariant({ blockTag: startBlock.number });
      } catch (e) {
        diagnostics && console.log('Could not get current and init invariant for series', seriesEntity.id);
      }

      return {
        ...seriesEntity,
        ts: BigNumber.from(ts),
        g1,
        g2,
        c,
        mu,
        sharesReserves: {
          value: sharesReserves,
          formatted: formatUnits(sharesReserves, decimals),
        },
        fyTokenReserves: {
          value: fyTokenReserves,
          formatted: formatUnits(fyTokenReserves, decimals),
        },
        fyTokenRealReserves: {
          value: fyTokenRealReserves,
          formatted: formatUnits(fyTokenRealReserves, decimals),
        },
        totalSupply: {
          value: totalSupply,
          formatted: formatUnits(totalSupply, decimals),
        },
        apr,
        poolAPY,
        getBase,
        getShares,
        seriesIsMature: isMature(maturity),
        poolContract,
        fyTokenContract,
        currentInvariant,
        initInvariant,
        startBlock,
      };
    },
    [diagnostics, getPoolAPY, getSeriesEntity, getTimeTillMaturity, isMature, provider]
  );

  // returns a mapping from series entity id to series entity
  const getSeriesEntities = (chainId: number) => {
    const seriesMap = chainId === 1 ? SERIES_1 : SERIES_42161;
    return [...seriesMap.keys()].reduce(async (acc, id) => {
      const seriesEntity = await getSeriesEntity(id);
      return { ...(await acc), [id]: { ...seriesEntity } };
    }, Promise.resolve<{ [id: string]: ISeries }>({}));
  };

  const key = useMemo(() => (chainId ? ['seriesEntities', chainId, account] : null), [account, chainId]);

  const { data, error } = useSWRImmutable(key, () => mapify(getSeriesEntities(chainId)) as Map<string, ISeries>);

  return { data, error, isLoading: !data && !error, getSeriesEntity, getSeriesEntityDynamic };
};

export default useSeriesEntities;
