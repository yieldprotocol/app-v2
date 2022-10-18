import Decimal from 'decimal.js';
import { BigNumber } from 'ethers';
import request from 'graphql-request';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { ActionType, ISettingsContext, IUserContext } from '../types';
import { cleanValue } from '../utils/appUtils';
import { EULER_SUPGRAPH_ENDPOINT } from '../utils/constants';
import { useApr } from './useApr';
import { ONE_DEC as ONE, SECONDS_PER_YEAR, ZERO_DEC as ZERO } from '@yield-protocol/ui-math';
import { WETH } from '../config/assets';
import { parseUnits } from 'ethers/lib/utils';
import { UserContext } from '../contexts/UserContext';
import { useDebounce } from './generalHooks';

interface IReturns {
  sharesAPY?: string;
  fyTokenAPY?: string;
  feesAPY?: string;
  totalAPY: string | undefined;
}

interface IStrategyReturns {
  returnsForward: IReturns;
  returnsBackward: IReturns;
  returns: IReturns;
  loading: boolean;
}

interface EulerRes {
  eulerMarketStore: {
    markets: {
      supplyAPY: string;
    }[];
  };
}

// calculateAPR func from yieldMath, but without the maturity greater than now check
const calculateAPR = (
  tradeValue: BigNumber | string,
  amount: BigNumber | string,
  maturity: number,
  fromDate: number = Math.round(new Date().getTime() / 1000) // if not provided, defaults to current time.
): string | undefined => {
  const tradeValue_ = new Decimal(tradeValue.toString());
  const amount_ = new Decimal(amount.toString());

  const secsToMaturity = maturity - fromDate;
  const propOfYear = new Decimal(secsToMaturity / SECONDS_PER_YEAR);
  const priceRatio = amount_.div(tradeValue_);
  const powRatio = ONE.div(propOfYear);
  const apr = priceRatio.pow(powRatio).sub(ONE);

  if (apr.gt(ZERO) && apr.lt(100)) {
    return apr.mul(100).toFixed();
  }
  return undefined;
};

/**
 *
 * Returns are LP returns per share
 * Returns are estimated using "forward-looking" and "backward-looking" methodologies:
 *
 * Forward-looking:
 *
 * a = pool share's estimated current apy
 * b = number of shares in pool
 * c = current share price in base
 * d = lp token total supply
 * e = fyToken interest rate
 * f = estimated value of fyTokens in pool in base
 * g = total estimated base value of pool b * c + f
 *
 * estimated apy =    shares apy       + fyToken apy + fees apy
 * estimated apy = a * ((b * c) / g)   +   f / g     + fees apy
 *
 *
 * Backward-looking:
 *
 * value = each strategy token's value in base
 * a = strategy LP token balance
 * b = strategy total supply
 * c = shares value in base of pool
 * d = estimated fyToken value of pool
 * e = total LP token (pool) supply
 *
 * value =  a / b * (c + d) / e
 * estimated apy = value plugged into apy calculation func
 *
 *
 * @param input amount of base to use when providing liquidity
 * @returns {IStrategyReturns} use "returns" property for visualization (the higher apy of the two "returnsForward" and "returnsBackward" properties)
 */
const useStrategyReturns = (input: string | undefined, digits = 1): IStrategyReturns => {
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    userState: { selectedStrategy },
  } = useContext(UserContext) as IUserContext;

  const strategy = selectedStrategy;
  const series = selectedStrategy?.currentSeries!;

  const inputToUse = useDebounce(cleanValue(input || '1', series.decimals), 1000);
  const [loading, setLoading] = useState(false);

  const [returnsForward, setReturnsForward] = useState<IReturns>();
  const [returnsBackward, setReturnsBackward] = useState<IReturns>();

  const { apr: borrowApy } = useApr(inputToUse, ActionType.BORROW, series);
  const { apr: lendApy } = useApr(inputToUse, ActionType.LEND, series);

  const NOW = useMemo(() => Math.round(new Date().getTime() / 1000), []);

  /**
   *
   * @returns {Promise<number>} fyToken price in base, where 1 is at par with base
   */
  const getFyTokenPrice = useCallback(
    async (valuedAtOne = false) => {
      if (series) {
        const input = parseUnits(inputToUse, series.decimals);

        let fyTokenValOfInput: BigNumber;

        try {
          fyTokenValOfInput = await series.poolContract.sellFYTokenPreview(input);
        } catch (e) {
          diagnostics && console.log('Could not estimate fyToken price');
          fyTokenValOfInput = parseUnits('1', series.decimals);
        }
        return valuedAtOne ? 1 : +fyTokenValOfInput / +input;
      }

      return 1;
    },
    [diagnostics, inputToUse, series]
  );

  /**
   * Calculate the total base value of the pool
   * total = shares value in base + fyToken value in base
   *
   * @returns {Promise<number>} total base value of pool
   */
  const getPoolBaseValue = useCallback(
    async (fyTokenValAtOne = false) => {
      if (!series) return;

      const sharesBaseVal = +series.getBase(series.sharesReserves);
      const fyTokenPrice = await getFyTokenPrice(fyTokenValAtOne);
      const fyTokenBaseVal = +series.fyTokenRealReserves * fyTokenPrice;

      return sharesBaseVal + fyTokenBaseVal;
    },
    [getFyTokenPrice, series]
  );

  /**
   *
   * @returns euler supply apy from subgraph
   */
  const getEulerPoolAPY = useCallback(async () => {
    if (!series) return;

    const query = `
    query ($address: Bytes!) {
      eulerMarketStore(id: "euler-market-store") {
        markets(where:{eTokenAddress:$address}) {
          supplyAPY
         } 
      }
    }
  `;

    try {
      const {
        eulerMarketStore: { markets },
      } = await request<EulerRes>(EULER_SUPGRAPH_ENDPOINT, query, { address: series.sharesAddress });
      return (+markets[0].supplyAPY * 100) / 1e27;
    } catch (error) {
      diagnostics && console.log(`could not get pool apy for pool with shares token: ${series.sharesAddress}`, error);
      return undefined;
    }
  }, [diagnostics, series]);

  /**
   * Calculates estimated apy from shares portion of pool
   * @returns shares apy of pool
   */
  const getSharesAPY = useCallback(async () => {
    if (!series) return 0;

    const apy = await getEulerPoolAPY();
    const poolBaseValue = await getPoolBaseValue();

    if (apy && poolBaseValue) {
      const sharesBaseVal = +series.getBase(series.sharesReserves);
      const sharesValRatio = sharesBaseVal / poolBaseValue;

      return apy * sharesValRatio;
    }

    return 0;
  }, [getEulerPoolAPY, getPoolBaseValue, series]);

  /**
   * Caculate (estimate) how much fees are accrued to LP's using invariant func
   * @returns {Promise<number>}
   */
  const getFeesAPY = useCallback(async (): Promise<number> => {
    if (!series) return 0;

    // get pool init timestamp
    const gmFilter = series.poolContract.filters.gm();
    const gm = (await series.poolContract.queryFilter(gmFilter))[0];
    const gmBlock = await gm.getBlock();
    const gmTimestamp = gmBlock.timestamp;

    if (!gmTimestamp) return 0;

    // get current invariant using new tv pool contract func
    let currentInvariant: BigNumber | undefined;
    let initInvariant: BigNumber | undefined;

    try {
      currentInvariant = await series.poolContract.invariant();
      initInvariant = await series.poolContract.invariant({ blockTag: gmBlock.number });
    } catch (e) {
      console.log('Could not get current and init invariant');
    }

    if (!currentInvariant || !initInvariant) return 0;

    // get apy estimate
    const res = calculateAPR(initInvariant, currentInvariant, NOW, gmTimestamp);

    if (isNaN(+res!)) {
      return 0;
    }

    return +res!;
  }, [NOW, series]);

  /**
   * Calculate (estimate) how much interest would be captured by LP position using market rates and fyToken proportion of the pool
   * @returns {Promise<number>} estimated fyToken interest from LP position
   */
  const getFyTokenAPY = useCallback(async (): Promise<number> => {
    if (!series) return 0;

    const poolBaseValue = await getPoolBaseValue();
    if (!poolBaseValue) return 0;

    const fyTokenRealReserves = +series.fyTokenRealReserves;

    // the average of the borrow and lend apr's
    const marketInterestRate = (+borrowApy! + +lendApy!) / 2;

    const fyTokenPrice = await getFyTokenPrice();

    // how much fyToken in base the pool is comprised of
    const fyTokenValRatio = (fyTokenRealReserves * fyTokenPrice) / poolBaseValue;

    return marketInterestRate * fyTokenValRatio;
  }, [borrowApy, getFyTokenPrice, getPoolBaseValue, lendApy, series]);

  /* Set Returns Forward state */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const sharesAPY = await getSharesAPY();
      const feesAPY = await getFeesAPY();
      const fyTokenAPY = await getFyTokenAPY();

      setReturnsForward({
        sharesAPY: cleanValue(sharesAPY.toString(), digits),
        fyTokenAPY: cleanValue(fyTokenAPY.toString(), digits),
        feesAPY: cleanValue(feesAPY.toString(), digits),
        totalAPY: cleanValue((sharesAPY + feesAPY + fyTokenAPY).toString(), digits),
      });

      setLoading(false);
    })();
  }, [getSharesAPY, getFeesAPY, getFyTokenAPY, digits]);

  /* Set Returns Backward state */
  useEffect(() => {
    const _calcTotalAPYBackward = async () => {
      if (!series || !strategy) return;

      const strategyLpBalance = +strategy?.strategyPoolBalance!;
      const strategyTotalSupply = +strategy?.strategyTotalSupply!;
      const poolTotalSupply = +series.totalSupply;
      const poolBaseValue = await getPoolBaseValue(true);
      if (!poolBaseValue) return;

      const strategyLpBalSupplyRatio = strategyLpBalance / strategyTotalSupply;

      // get strategy created timestamp using first StartPool event as proxy
      const filter = strategy.strategyContract.filters.PoolStarted();
      const timestamp = (await (await strategy.strategyContract.queryFilter(filter))[0].getBlock()).timestamp;

      const value = strategyLpBalSupplyRatio * (poolBaseValue / poolTotalSupply);
      const apy = calculateAPR('1', value.toString(), NOW, timestamp);

      setReturnsBackward({
        totalAPY: cleanValue(apy, digits),
      });
    };

    _calcTotalAPYBackward();
  }, [NOW, getPoolBaseValue, series, strategy, digits]);

  useEffect(() => {
    console.log('🦄 ~ file: useStrategyReturns.ts ~ line 111 ~ useStrategyReturns ~ returnsBackward', returnsBackward);
  }, [returnsBackward]);

  return {
    returnsForward,
    returnsBackward,
    returns: +returnsForward?.totalAPY! >= +returnsBackward?.totalAPY! ? returnsForward : returnsBackward,
    loading,
  } as IStrategyReturns;
};

export default useStrategyReturns;
