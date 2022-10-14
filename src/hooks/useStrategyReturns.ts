import Decimal from 'decimal.js';
import { BigNumber, ethers, EventFilter } from 'ethers';
import request from 'graphql-request';
import yieldEnv from './../contexts/yieldEnv.json';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { PoolView__factory } from '../contracts';
import { ActionType, IChainContext, ISettingsContext, IStrategy } from '../types';
import { cleanValue } from '../utils/appUtils';
import { EULER_SUPGRAPH_ENDPOINT } from '../utils/constants';
import { useApr } from './useApr';
import { ONE_DEC as ONE, SECONDS_PER_YEAR, ZERO_DEC as ZERO } from '@yield-protocol/ui-math';

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
}

// calculateAPR func from yieldMath, but without the maturity greater than now check
const _calculateAPR = (
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
 * f = number of fyTokens in pool
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
 * c = shares value of pool
 * d = fyToken value of pool
 * e = total LP token (pool) supply
 *
 * value =  a / b * (c + d) / e
 * estimated apy = value plugged into apy calculation func
 *
 *
 * @param input amount of base to use when providing liquidity
 * @param strategy
 * @returns {IStrategyReturns} use "returns" property for visualization (the higher apy of the two "returnsForward" and "returnsBackward" properties)
 */
const useStrategyReturns = (input: string | undefined, strategy: IStrategy | undefined) => {
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    chainState: {
      connection: { chainId, provider },
    },
  } = useContext(ChainContext) as IChainContext;

  const series = strategy?.currentSeries!;

  const [returnsForward, setReturnsForward] = useState<IReturns>();
  const [returnsBackward, setReturnsBackward] = useState<IReturns>();

  const { apr: borrowApr } = useApr(input, ActionType.BORROW, series);
  const { apr: lendApr } = useApr(input, ActionType.LEND, series);

  const NOW = useMemo(() => Math.round(new Date().getTime() / 1000), []);

  useEffect(() => {
    const _getEulerPoolAPY = async (sharesTokenAddr: string) => {
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
    };

    const _getPoolBaseValue = () => {
      const sharesBaseVal = series.getBase(series.sharesReserves);
      const fyTokenBaseVal = series.fyTokenRealReserves;
      return sharesBaseVal.add(fyTokenBaseVal);
    };

    /**
     * Calculates the apy of the shares value in the pool
     * @returns {Promise<number>} shares apy proportion of LP returns
     */
    const _calcSharesAPY = async (): Promise<number> => {
      const apy = Number(await _getEulerPoolAPY(series.sharesAddress));

      if (apy) {
        const sharesBaseVal = series.getBase(series.sharesReserves);
        const sharesValRatio = Number(
          new Decimal(sharesBaseVal.toString()).div(new Decimal(_getPoolBaseValue().toString()))
        );

        return apy * sharesValRatio;
      }

      return 0;
    };

    const _calcFyTokenAPY = () => {
      const marketInterestRate = (+borrowApr + +lendApr) / 2;
      const fyTokenRealReserves = series.fyTokenRealReserves;
      const fyTokenValRatio = +new Decimal(fyTokenRealReserves.toString()).div(
        new Decimal(_getPoolBaseValue().toString())
      );
      return marketInterestRate * fyTokenValRatio;
    };

    const _calcFeesAPY = async () => {
      // get current invariant using new tv pool contracat func, else try to get from PoolView contract (old and potentially incorrect methodology)
      let currentInvariant: BigNumber | undefined;
      let initInvariant: BigNumber | undefined;

      try {
        currentInvariant = await series.poolContract.invariant();
        initInvariant = ethers.utils.parseUnits('1', series.decimals);
      } catch (e) {
        const poolView = PoolView__factory.connect(yieldEnv.addresses[chainId]['PoolView'], provider);
        currentInvariant = await poolView.invariant(series.poolAddress);
        // init invariant is always 18 decimals when using old methodology
        initInvariant = ethers.utils.parseUnits('1', 18);
      }

      if (!currentInvariant || !initInvariant) return 0;

      // get pool init timestamp
      const gmFilter = series.poolContract.filters.gm();
      const gm = (await series.poolContract.queryFilter(gmFilter))[0];
      const gmTimestamp = (await gm.getBlock()).timestamp;

      if (!gmTimestamp) return 0;

      // get apy estimate
      const res = +_calculateAPR(initInvariant, currentInvariant, NOW, gmTimestamp);

      return isNaN(res) ? 0 : res;
    };

    const _calcTotalAPYForward = async () => {
      // forward looking returns
      const sharesAPYForward = await _calcSharesAPY();
      const fyTokenAPYForward = _calcFyTokenAPY();
      const feesAPYForward = await _calcFeesAPY();
      const totalAPYForward = sharesAPYForward + fyTokenAPYForward + feesAPYForward;

      setReturnsForward({
        sharesAPY: cleanValue(sharesAPYForward.toString(), 1),
        fyTokenAPY: cleanValue(fyTokenAPYForward.toString(), 1),
        feesAPY: cleanValue(feesAPYForward.toString(), 1),
        totalAPY: cleanValue(totalAPYForward.toString(), 1),
      });
    };

    const _calcTotalAPYBackward = async () => {
      if (!strategy) return;

      const strategyLpBalance = strategy.strategyPoolBalance;
      const strategyTotalSupply = strategy.strategyTotalSupply;
      const poolTotalSupply = new Decimal(series.totalSupply.toString());
      const poolBaseValue = new Decimal(_getPoolBaseValue().toString());

      const strategyLpBalSupplyRatio = new Decimal(strategyLpBalance.toString()).div(
        new Decimal(strategyTotalSupply.toString())
      );

      // get strategy created timestamp using first StartPool event as proxy
      const filter = strategy.strategyContract.filters.PoolStarted();
      const timestamp = (await (await strategy.strategyContract.queryFilter(filter))[0].getBlock()).timestamp;

      const value = strategyLpBalSupplyRatio.mul(poolBaseValue.div(poolTotalSupply));
      const apy = _calculateAPR(ONE.toString(), value.toString(), NOW, timestamp);

      setReturnsBackward({
        sharesAPY: '0',
        fyTokenAPY: '0',
        feesAPY: '0',
        totalAPY: cleanValue(apy, 1),
      });
    };

    if (series) {
      _calcTotalAPYForward();
      _calcTotalAPYBackward();
    }
  }, [NOW, borrowApr, chainId, diagnostics, lendApr, provider, series, strategy]);

  return {
    returnsForward,
    returnsBackward,
    returns: +returnsForward?.totalAPY > +returnsBackward?.totalAPY ? returnsForward : returnsBackward,
  } as IStrategyReturns;
};

export default useStrategyReturns;
