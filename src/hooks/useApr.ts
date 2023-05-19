import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { sellBase, buyBase, calculateAPR } from '@yield-protocol/ui-math';
import { ETH_BASED_ASSETS } from '../config/assets';
import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries } from '../types';
import { cleanValue } from '../utils/appUtils';
import useTimeTillMaturity from './useTimeTillMaturity';

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useApr = (input: string | undefined, actionType: ActionType, series: ISeries | null) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext);
  const { seriesMap, selectedSeries, selectedBase } = userState;

  /* HOOKS */
  const { getTimeTillMaturity, isMature } = useTimeTillMaturity();

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
      console.log('baseAmount FR', baseAmount, baseAmount.toString(), _fallbackInput, _input);
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
