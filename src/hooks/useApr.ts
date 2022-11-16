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
  const _fallbackInput = ETH_BASED_ASSETS.includes(series?.baseId!) ? '.001' : '1';
  const _input = Number(input) === 0 ? _fallbackInput : cleanValue(input, _selectedSeries?.decimals);

  /* LOCAL STATE */
  const [apr, setApr] = useState<string | undefined>();

  useEffect(() => {
    let preview: ethers.BigNumber | Error = ethers.constants.Zero;
    if (_selectedSeries) {
      const baseAmount = ethers.utils.parseUnits(_input || _fallbackInput, _selectedSeries.decimals);
      const { sharesReserves, fyTokenReserves } = _selectedSeries;

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
    }
  }, [_selectedSeries, _input, actionType, _fallbackInput, getTimeTillMaturity]);

  return { apr };
};
