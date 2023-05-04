import { ethers, BigNumber } from 'ethers';
import { useCallback, useContext, useEffect, useState } from 'react';
import { sellBase, buyBase, calculateAPR, bytesToBytes32 } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS } from '../config/assets';
import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries } from '../types';
import { cleanValue } from '../utils/appUtils';
import useTimeTillMaturity from './useTimeTillMaturity';
import { useProvider } from 'wagmi';

import { VRCauldron, VRInterestRateOracle__factory } from '../contracts';
import useContracts from './useContracts';
import { ContractNames } from '../config/contracts';
import { RATE } from '../utils/constants';
import { formatUnits } from 'ethers/lib/utils.js';

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
      const getRateVR = async (baseId: string) => {
        try {
          const VRCauldron = contracts?.get(ContractNames.VR_CAULDRON) as VRCauldron;
          const interestRateOracleAddr = await VRCauldron.rateOracles(baseId);
          const interestRateOracle = VRInterestRateOracle__factory.connect(interestRateOracleAddr, provider);
          console.log('INTEREST RATE ORACLE', interestRateOracleAddr, interestRateOracle);

          // TODO figure out if this is how to call oracle for lend and borrow
          if (actionType === 'LEND') {
            return (await interestRateOracle.peek(bytesToBytes32(baseId, 6), RATE, '0')).accumulated;
          }

          if (actionType === 'BORROW') {
            return (
              await interestRateOracle.peek(
                bytesToBytes32(baseId, 6),
                bytesToBytes32('0x434849000000', 6), // TODO - make this a constant
                '0'
              )
            ).accumulated;
          }
        } catch (e) {
          console.log(`Error getting vr APY for base with id: ${baseId}:`, e);
          return undefined;
        }
      };

      const _rate = await getRateVR(base.id);
      if (!_rate) return;

      // format rate
      const rate = cleanValue(formatUnits(_rate, 18), 2); // always 18 decimals when getting rate from rate oracle
      setApr(rate);
    })();
  }, [actionType, base, contracts, provider]);

  return { apr };
};
