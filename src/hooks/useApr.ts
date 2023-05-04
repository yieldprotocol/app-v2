import { ethers, BigNumber } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { sellBase, buyBase, calculateAPR, bytesToBytes32 } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS } from '../config/assets';
import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries } from '../types';
import { cleanValue } from '../utils/appUtils';
import useTimeTillMaturity from './useTimeTillMaturity';
import { useProvider } from 'wagmi';
import * as contractTypes from '../contracts';

import { VRInterestRateOracle__factory } from '../contracts';
import useContracts from './useContracts';
import { ContractNames } from '../config/contracts';
import { RATE, ZERO_BN, CHI } from '../utils/constants';
import { useConvertValue } from './useConvertValue';
import useFork from './useFork';
import { formatUnits } from 'ethers/lib/utils.js';

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useApr = (input: string | undefined, actionType: ActionType, series: ISeries | null) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext);
  const { seriesMap, selectedSeries, selectedBase } = userState;

  /* HOOKS */
  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();
  const provider = useProvider();
  const contracts = useContracts();
  const { useForkedEnv, forkStartBlock } = useFork();

  const _selectedSeries = series || selectedSeries;
  /* Make sure there won't be an underflow */
  const _fallbackInput = ETH_BASED_ASSETS.includes(series?.baseId! || selectedBase?.id!) ? '0.01' : '1';
  const _input = Number(input) === 0 ? _fallbackInput : cleanValue(input, _selectedSeries?.decimals);

  /* LOCAL STATE */
  const [apr, setApr] = useState<string | undefined>();

  useEffect(() => {
    let preview: ethers.BigNumber | Error = ethers.constants.Zero;
    if (_selectedSeries) {
      const { sharesReserves, fyTokenReserves } = _selectedSeries;
      const baseAmount = ethers.utils.parseUnits(_input || _fallbackInput, _selectedSeries.decimals);

      if (actionType === 'LEND')
        preview = sellBase(
          sharesReserves,
          fyTokenReserves,
          _selectedSeries.getShares(baseAmount), // convert input from base to shares
          getTimeTillMaturity(_selectedSeries.maturity),
          _selectedSeries.ts,
          _selectedSeries.g1,
          _selectedSeries.decimals,
          _selectedSeries.c,
          _selectedSeries.mu
        );

      if (actionType === 'BORROW')
        preview = buyBase(
          sharesReserves,
          fyTokenReserves,
          _selectedSeries.getShares(baseAmount), // convert input from base to shares
          getTimeTillMaturity(_selectedSeries.maturity),
          _selectedSeries.ts,
          _selectedSeries.g2,
          _selectedSeries.decimals,
          _selectedSeries.c,
          _selectedSeries.mu
        );

      // figure out what to do with negative apr on borrow for tv series
      const _apr = calculateAPR(baseAmount, preview, _selectedSeries.maturity);
      _apr ? setApr(cleanValue(_apr, 2)) : setApr(_selectedSeries.apr);
    } else if (selectedBase) {
      /* logic for VR */
      const baseAmount = ethers.utils.parseUnits(_input || _fallbackInput, selectedBase.decimals);

      const now = Date.now() + 20000;
      // trying to call interest rate oracle
      // const interestRateOracleAddr = '0xa60eb553b65284e3a221b958c9115d8e558289bf';

      const getAPY = async () => {
        try {
          const VRCauldron = contracts?.get(ContractNames.VR_CAULDRON) as contractTypes.VRCauldron;
          const interestRateOracleAddr = await VRCauldron.rateOracles(selectedBase.id);
          const interestRateOracle = VRInterestRateOracle__factory.connect(interestRateOracleAddr, provider);
          const joinAddress = selectedBase.joinAddressVR;
          console.log('INTEREST RATE ORACLE', interestRateOracleAddr, interestRateOracle);

          let rate: any = ethers.constants.Zero; // TODO - fix this type

          if (actionType === 'LEND') {
            rate = await interestRateOracle.peek(bytesToBytes32(selectedBase.id, 6), RATE, '0');
          }

          if (actionType === 'BORROW') {
            rate = await interestRateOracle.peek(
              bytesToBytes32(selectedBase.id, 6),
              bytesToBytes32('0x434849000000', 6), // TODO - make this a constant
              '0'
            );
          }

          console.log('rate in useAPR', rate);

          return rate;
        } catch (e) {
          console.log(`Error getting APY for ${selectedBase.symbol}:`, e);
          return ethers.constants.Zero;
        }
      };

      getAPY().then((res) => {
        const rate = res.accumulated
          ? formatUnits(BigNumber.from(res.accumulated.toHexString()), selectedBase.decimals)
          : ethers.constants.Zero;

        setApr(rate.toString());
      });
    }
  }, [_selectedSeries, _input, actionType, _fallbackInput, getTimeTillMaturity]);

  /* Get the min APR from all the series */
  const aprArray = Array.from(seriesMap?.values()!)
    .filter((x: ISeries) => x.baseId === selectedBase?.proxyId)
    .map((x: ISeries) => parseFloat(x.apr));
  const minApr = aprArray.length && Math.min(...aprArray);
  const maxApr = aprArray.length && Math.min(...aprArray);

  return { apr, minApr, maxApr };
};
