import Decimal from 'decimal.js';
import { BigNumber, ethers } from 'ethers';
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
import { WETH } from '../config/assets';
import { parseUnits } from 'ethers/lib/utils';

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
 * @param strategy
 * @returns {IStrategyReturns} use "returns" property for visualization (the higher apy of the two "returnsForward" and "returnsBackward" properties)
 */
const useStrategyReturns = (input: string | undefined, strategy: IStrategy | undefined): IStrategyReturns => {
  const {
    settingsState: { diagnostics },
  } = useContext(SettingsContext) as ISettingsContext;

  const {
    chainState: {
      connection: { chainId, provider },
    },
  } = useContext(ChainContext) as IChainContext;

  const series = strategy?.currentSeries!;

  const [inputToUse, setInputToUse] = useState(strategy?.baseId === WETH ? '.1' : '100');
  const [returnsForward, setReturnsForward] = useState<IReturns>();
  const [returnsBackward, setReturnsBackward] = useState<IReturns>();

  const { apr: borrowApy } = useApr(inputToUse, ActionType.BORROW, series);
  const { apr: lendApy } = useApr(inputToUse, ActionType.LEND, series);

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

    /**
     *
     * @returns {Promise<number>} fyToken price in base
     */
    const _getFyTokenPrice = async (valuedAtOne = false): Promise<number> => {
      const input = parseUnits(inputToUse, series.decimals);

      let fyTokenValOfInput: BigNumber;

      try {
        fyTokenValOfInput = await series.poolContract.sellFYTokenPreview(input);
      } catch (e) {
        diagnostics && console.log('Could not estimate fyToken price');
        fyTokenValOfInput = parseUnits('1', series.decimals);
      }
      return valuedAtOne ? 1 : +fyTokenValOfInput / +input;
    };

    /**
     * Calculate the total base value of the pool
     * total = shares value in base + fyToken value in base
     *
     * @returns {Promise<number>} total base value of pool
     */
    const _getPoolBaseValue = async (fyTokenValAtOne = false): Promise<number> => {
      const sharesBaseVal = +series.getBase(series.sharesReserves);
      const fyTokenPrice = await _getFyTokenPrice(fyTokenValAtOne);
      const fyTokenBaseVal = +series.fyTokenRealReserves * fyTokenPrice;

      return sharesBaseVal + fyTokenBaseVal;
    };

    /**
     * Calculates the apy of the shares value in the pool
     * i.e: if shares make up 50% of the pool's total base value
     * and the shares APY is 10%, then return 5% (10 * .5)
     * @returns {Promise<number>} shares apy
     */
    const _calcSharesAPY = async (): Promise<number> => {
      const apy = +(await _getEulerPoolAPY(series.sharesAddress));
      const poolBaseValue = await _getPoolBaseValue();

      if (apy) {
        const sharesBaseVal = +series.getBase(series.sharesReserves);
        const sharesValRatio = sharesBaseVal / poolBaseValue;

        return apy * sharesValRatio;
      }

      return 0;
    };

    /**
     * Calculate (estimate) how much interest would be captured by LP position using market rates and fyToken proportion of the pool
     * @returns {Promise<number>} estimated fyToken interest from LP position
     */
    const _calcFyTokenAPY = async (): Promise<number> => {
      const poolBaseValue = await _getPoolBaseValue();
      const fyTokenRealReserves = +series.fyTokenRealReserves;

      // the average of the borrow and lend apr's
      const marketInterestRate = (+borrowApy + +lendApy) / 2;

      const fyTokenPrice = await _getFyTokenPrice();

      // how much fyToken in base the pool is comprised of
      const fyTokenValRatio = (fyTokenRealReserves * fyTokenPrice) / poolBaseValue;

      return marketInterestRate * fyTokenValRatio;
    };

    /**
     * Caculate (estimate) how much fees are accrued to LP's using invariant func
     * @returns {Promise<number>}
     */
    const _calcFeesAPY = async (): Promise<number> => {
      // get pool init timestamp
      const gmFilter = series.poolContract.filters.gm();
      const gm = (await series.poolContract.queryFilter(gmFilter))[0];
      const gmBlock = await gm.getBlock();
      const gmTimestamp = gmBlock.timestamp;

      if (!gmTimestamp) return 0;

      // get current invariant using new tv pool contracat func, else try to get from PoolView contract (old and potentially incorrect methodology)
      let currentInvariant: BigNumber | undefined;
      let initInvariant: BigNumber | undefined;

      try {
        currentInvariant = await series.poolContract.invariant();
        initInvariant = await series.poolContract.invariant({ blockTag: gmBlock.number });
      } catch (e) {
        if (chainId) {
          const poolView = PoolView__factory.connect(yieldEnv.addresses[chainId]['PoolView'], provider);
          currentInvariant = await poolView.invariant(series.poolAddress);
          // init invariant is always 18 decimals when using old methodology
          initInvariant = ethers.utils.parseUnits('1', 18);
        }
      }

      if (!currentInvariant || !initInvariant) return 0;

      // get apy estimate
      const res = +_calculateAPR(initInvariant, currentInvariant, NOW, gmTimestamp);

      return isNaN(res) ? 0 : res;
    };

    const _calcTotalAPYForward = async (digits: number) => {
      const sharesAPYForward = await _calcSharesAPY();
      const fyTokenAPYForward = await _calcFyTokenAPY();
      const feesAPYForward = await _calcFeesAPY();
      const totalAPYForward = sharesAPYForward + fyTokenAPYForward + feesAPYForward;

      setReturnsForward({
        sharesAPY: cleanValue(sharesAPYForward.toString(), digits),
        fyTokenAPY: cleanValue(fyTokenAPYForward.toString(), digits),
        feesAPY: cleanValue(feesAPYForward.toString(), digits),
        totalAPY: cleanValue(totalAPYForward.toString(), digits),
      });
    };

    const _calcTotalAPYBackward = async (digits: number) => {
      if (!strategy) return;

      const strategyLpBalance = +strategy.strategyPoolBalance;
      const strategyTotalSupply = +strategy.strategyTotalSupply;
      const poolTotalSupply = +series.totalSupply;
      const poolBaseValue = await _getPoolBaseValue(true);

      const strategyLpBalSupplyRatio = strategyLpBalance / strategyTotalSupply;

      // get strategy created timestamp using first StartPool event as proxy
      const filter = strategy.strategyContract.filters.PoolStarted();
      const timestamp = (await (await strategy.strategyContract.queryFilter(filter))[0].getBlock()).timestamp;

      const value = strategyLpBalSupplyRatio * (poolBaseValue / poolTotalSupply);
      const apy = _calculateAPR('1', value.toString(), NOW, timestamp);

      setReturnsBackward({
        totalAPY: cleanValue(apy, digits),
      });
    };

    if (series) {
      _calcTotalAPYForward(1);
      _calcTotalAPYBackward(1);
    }
  }, [NOW, borrowApy, chainId, diagnostics, inputToUse, lendApy, provider, series, strategy]);

  // handle input changes
  useEffect(() => {
    input && setInputToUse(input);
  }, [input]);

  return {
    returnsForward,
    returnsBackward,
    returns: +returnsForward?.totalAPY >= +returnsBackward?.totalAPY ? returnsForward : returnsBackward,
  } as IStrategyReturns;
};

export default useStrategyReturns;
