import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { useChainId } from 'wagmi';
import { SERIES } from '../config/series';
import { FYToken__factory, Pool__factory } from '../contracts';
import { ISeries, ISeriesRoot } from '../types';

export const useSeriesEntities = (seriesId: string | undefined) => {
  const chainId = useChainId();
  const DEFAULT_SWR_KEY = useMemo(() => ['seriesEntities', chainId], [chainId]);

  const _getSeriesEntities = useCallback(async () => {
    const seriesMap = SERIES.get(chainId);
    if (!seriesMap) throw new Error('no series config detected');
    return seriesMap;
  }, [chainId]);

  const getSeriesEntities = async () => {
    console.log('getting all series data');
    const seriesEntities = _getSeriesEntities();
    // add some dynamic data if necessary
    return seriesEntities;
  };

  /* Updates the series with relevant *user* data */
  const getSeriesEntityDynamic = useCallback(
    async (seriesMap: Map<string, ISeriesRoot>, seriesId: string) => {
      const poolContract = Pool__factory.connect(seriesMap.get(seriesId)?.poolAddress, provider);
      const fyTokenContract = FYToken__factory.connect(seriesMap.get(seriesId)?.fyToken, provider);
          const [baseReserves, fyTokenReserves, totalSupply, fyTokenRealReserves] = await Promise.all([
            poolContract.getBaseBalance(),
            poolContract.getFYTokenBalance(),
            poolContract.totalSupply(),
            fyTokenContract.balanceOf(series.poolAddress),
          ]);

          let sharesReserves: BigNumber | undefined;
          let c: BigNumber | undefined;
          let mu: BigNumber | undefined;
          let currentSharePrice: BigNumber | undefined;
          let sharesAddress: string | undefined;

          try {
            [sharesReserves, c, mu, currentSharePrice, sharesAddress] = await Promise.all([
              series.poolContract.getSharesBalance(),
              series.poolContract.getC(),
              series.poolContract.mu(),
              series.poolContract.getCurrentSharePrice(),
              series.poolContract.sharesToken(),
            ]);
          } catch (error) {
            sharesReserves = baseReserves;
            currentSharePrice = ethers.utils.parseUnits('1', series.decimals);
            sharesAddress = assetRootMap.get(series.baseId)!.address;
            diagnostics && console.log('Using old pool contract that does not include c, mu, and shares');
          }

          // convert base amounts to shares amounts (baseAmount is wad)
          const getShares = (baseAmount: BigNumber) =>
            toBn(
              new Decimal(baseAmount.toString())
                .mul(10 ** series.decimals)
                .div(new Decimal(currentSharePrice?.toString()!))
            );

          // convert shares amounts to base amounts
          const getBase = (sharesAmount: BigNumber) =>
            toBn(
              new Decimal(sharesAmount.toString())
                .mul(new Decimal(currentSharePrice?.toString()!))
                .div(10 ** series.decimals)
            );

          const rateCheckAmount = ethers.utils.parseUnits(
            ETH_BASED_ASSETS.includes(series.baseId) ? '.001' : '1',
            series.decimals
          );

          /* Calculates the base/fyToken unit selling price */
          const _sellRate = sellFYToken(
            sharesReserves,
            fyTokenReserves,
            rateCheckAmount,
            getTimeTillMaturity(series.maturity),
            series.ts,
            series.g2,
            series.decimals,
            c,
            mu
          );

          const apr = calculateAPR(floorDecimal(_sellRate), rateCheckAmount, series.maturity) || '0';
          const poolAPY = sharesAddress ? await getPoolAPY(sharesAddress) : undefined;

          // some logic to decide if the series is shown or not
          // const showSeries = series.maturity !== 1672412400;
          const showSeries = true;

          let currentInvariant: BigNumber | undefined;
          let initInvariant: BigNumber | undefined;
          let poolStartBlock: Block | undefined;

          try {
            // get pool init block
            const gmFilter = series.poolContract.filters.gm();
            const gm = await series.poolContract.queryFilter(gmFilter);
            poolStartBlock = await gm[0].getBlock();
            console.log('poolStartBlock:', poolStartBlock.number);
            currentInvariant = await series.poolContract.invariant();
            initInvariant = await series.poolContract.invariant({ blockTag: poolStartBlock.number });
          } catch (e) {
            diagnostics && console.log('Could not get current and init invariant for series', series.id);
          }

          return {
            ...series,
            sharesReserves,
            sharesReserves_: ethers.utils.formatUnits(sharesReserves, series.decimals),
            fyTokenReserves,
            fyTokenRealReserves,
            totalSupply,
            totalSupply_: ethers.utils.formatUnits(totalSupply, series.decimals),
            apr: `${Number(apr).toFixed(2)}`,
            seriesIsMature: isMature(series.maturity),
            c,
            mu,
            poolAPY,
            getShares,
            getBase,
            showSeries,
            sharesAddress,
            currentInvariant,
            initInvariant,
            startBlock: poolStartBlock!,
          };
        }
      }
      if (account) {
        _accountData = await Promise.all(
          _publicData.map(async (series): Promise<ISeries> => {
            /* Get all the data simultanenously in a promise.all */
            const [poolTokens, fyTokenBalance] = await Promise.all([
              series.poolContract.balanceOf(account),
              series.fyTokenContract.balanceOf(account),
            ]);

            const poolPercent = mulDecimal(divDecimal(poolTokens, series.totalSupply), '100');
            return {
              ...series,
              poolTokens,
              fyTokenBalance,
              poolTokens_: ethers.utils.formatUnits(poolTokens, series.decimals),
              fyTokenBalance_: ethers.utils.formatUnits(fyTokenBalance, series.decimals),
              poolPercent,
            };
          })
        );
      }

    }
    , [])


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
    // return getSeriesEntityDynamic(seriesId);
    return seriesEntities?.has(seriesId) ? seriesEntities.get(seriesId) : undefined;
  };

  // main entry hook that returns either a specific series entity's data, or all series entities' data if no seriesId is provided
  const { data, error } = useSWR(genKey, main, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    data,
    error,
    isLoading: !data && !error,
    genKey,
  };
};

export default useSeriesEntities;
