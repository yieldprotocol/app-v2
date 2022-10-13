import Decimal from 'decimal.js';
import { ethers, EventFilter } from 'ethers';
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
import { calculateAPR, ONE_DEC, SECONDS_PER_YEAR } from '@yield-protocol/ui-math';
import { formatUnits } from 'ethers/lib/utils';

interface IReturns {
  sharesAPY: string;
  fyTokenAPY: string;
  feesAPY: string;
  totalAPY: string;
}

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
 * @param input amount of base to use when providing liquidity
 * @param strategy
 * @returns {IStrategyReturns}
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
     * @param tokenAddr the shares token address of the pool
     * Calculates the apy of the shares value in the pool
     * @returns {Promise<number>} shares apy proportion of LP returns
     */
    const _calcSharesAPY = async () => {
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
      const poolView = PoolView__factory.connect(yieldEnv.addresses[chainId]['PoolView'], provider);

      // get current invariant
      const currentInvariant = await poolView.invariant(series.poolAddress);

      // get init invariant
      const initInvariant = ethers.utils.parseUnits('1', 18);

      // get pool init timestamp
      const gmFilter = series.poolContract.filters.gm();
      const gm = (await series.poolContract.queryFilter(gmFilter))[0];
      const gmTimestamp = (await gm.getBlock()).timestamp;

      if (!gmTimestamp) return 0;
      const res = +calculateAPR(initInvariant, currentInvariant, NOW + 2, gmTimestamp); // using now + 2 to get through maturity > now logic in calculateAPR func

      return isNaN(res) ? 0 : res;
    };

    const _calcTotalAPY = async () => {
      // forward looking returns
      const sharesAPYForward = await _calcSharesAPY();
      const fyTokenAPYForward = await _calcFyTokenAPY();
      const feesAPYForward = await _calcFeesAPY();
      const totalAPYForward = sharesAPYForward + fyTokenAPYForward + feesAPYForward;

      setReturnsForward({
        sharesAPY: cleanValue(sharesAPYForward.toString(), 1),
        fyTokenAPY: cleanValue(fyTokenAPYForward.toString(), 1),
        feesAPY: cleanValue(feesAPYForward.toString(), 1),
        totalAPY: cleanValue(totalAPYForward.toString(), 1),
      });
    };

    if (series) {
      _calcTotalAPY();
    }
  }, [NOW, borrowApr, chainId, diagnostics, lendApr, provider, series]);

  return { returnsForward };
};

export default useStrategyReturns;
