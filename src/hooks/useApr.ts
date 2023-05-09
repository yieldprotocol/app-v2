import { ethers, BigNumber } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { sellBase, buyBase, calculateAPR, bytesToBytes32, SECONDS_PER_YEAR } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS } from '../config/assets';
import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries } from '../types';
import { cleanValue } from '../utils/appUtils';
import useTimeTillMaturity from './useTimeTillMaturity';
import { useProvider } from 'wagmi';

import { VRCauldron, VRInterestRateOracle, VRInterestRateOracle__factory } from '../contracts';
import useContracts from './useContracts';
import { ContractNames } from '../config/contracts';
import { CHI, RATE } from '../utils/constants';
import { formatUnits } from 'ethers/lib/utils.js';

const calcAPR = (interestRateOracle: VRInterestRateOracle, baseId: string, kind: string) => {
  // compare last two events with accumulated and lastUpdateTimestamp
  const events = interestRateOracle.queryFilter(interestRateOracle.filters.RateUpdated(baseId, kind), 0, 'latest');
  const currentRate = events[events.length - 1];
  const lastRate = events[events.length - 2];
  const apr = calculateAPR(
    currentRate.accumulated,
    lastRate.accumulated,
    currentRate.lastUpdateTimestamp,
    lastRate.lastUpdateTimestamp
  );
  return apr;
};

/**
 * Calculate apr for a specified series or in the case of VR, a specified base
 * @param input the amount of base to use to calculate the apr
 * @param actionType  the action type (LEND or BORROW)
 * @param seriesOrBaseId the series or base id to use to calculate the apr
 * @returns apr
 */
export const useApr = (input: string | undefined, actionType: ActionType, seriesOrBaseId: string | undefined) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext);
  const { seriesMap, assetMap } = userState;

  /* HOOKS */
  const { getTimeTillMaturity } = useTimeTillMaturity();
  const provider = useProvider();
  const contracts = useContracts();

  // check if there is a series associated with the id (for fr calcs)
  const series = seriesMap.get(seriesOrBaseId!);

  // check if there is a base associated with the id (for vr calcs)
  const base = assetMap.get(seriesOrBaseId!);

  /* Make sure there won't be an underflow */
  const _fallbackInput = ETH_BASED_ASSETS.includes(series?.baseId || base?.id!) ? '0.01' : '1';
  const _input = Number(input) === 0 ? _fallbackInput : cleanValue(input, series ? series.decimals : base?.decimals);

  /* LOCAL STATE */
  const [apr, setApr] = useState<string>();

  const baseAmount = ethers.utils.parseUnits(_input || _fallbackInput, series ? series.decimals : base?.decimals);

  // fixed rate calculations
  useEffect(() => {
    if (!series) return;

    const { sharesReserves, fyTokenReserves, getShares, maturity, ts, g1, decimals, c, mu, g2, apr } = series;

    let preview: ethers.BigNumber | Error = ethers.constants.Zero;

    if (actionType === 'LEND')
      preview = sellBase(
        sharesReserves,
        fyTokenReserves,
        getShares(baseAmount), // convert input from base to shares
        getTimeTillMaturity(maturity),
        ts,
        g1,
        decimals,
        c,
        mu
      );

    if (actionType === 'BORROW')
      preview = buyBase(
        sharesReserves,
        fyTokenReserves,
        getShares(baseAmount), // convert input from base to shares
        getTimeTillMaturity(maturity),
        ts,
        g2,
        decimals,
        c,
        mu
      );

    // figure out what to do with negative apr on borrow for tv series
    const _apr = calculateAPR(baseAmount, preview, maturity);
    _apr ? setApr(cleanValue(_apr, 2)) : setApr(apr);
  }, [_fallbackInput, _input, actionType, baseAmount, getTimeTillMaturity, series]);

  // variable rate calculations
  useEffect(() => {
    if (!base) return;

    (async () => {
      // trying to get rate from interest rate oracle for vr calcs
      const getRate = async (baseId: string) => {
        try {
          const VRCauldron = contracts?.get(ContractNames.VR_CAULDRON) as VRCauldron;
          const interestRateOracleAddr = await VRCauldron.rateOracles(baseId);
          const interestRateOracle = VRInterestRateOracle__factory.connect(interestRateOracleAddr, provider);

          if (actionType === 'LEND') (await interestRateOracle.peek(bytesToBytes32(baseId, 6), RATE, '0')).accumulated;
          if (actionType === 'BORROW') (await interestRateOracle.peek(bytesToBytes32(baseId, 6), CHI, '0')).accumulated;
        } catch (e) {
          console.log(`Error getting vr APY for base with id: ${baseId}:`, e);
          return undefined;
        }
      };

      const _rate = await getRate(base.id);
      if (!_rate) return;

      // format rate
      const rate = cleanValue(formatUnits(_rate, 18), 2); // always 18 decimals when getting rate from rate oracle
      setApr(rate);
    })();
  }, [actionType, base, contracts, provider]);

  return { apr };
};
