import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { sellBase, buyBase, calculateAPR } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS } from '../config/assets';
import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries } from '../types';
import { cleanValue } from '../utils/appUtils';
import useTimeTillMaturity from './useTimeTillMaturity';
import useSeriesEntity from './useSeriesEntity';

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useApr = (input: string | undefined, actionType: ActionType, series: ISeries | null) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext);
  const { selectedSeries, selectedBase } = userState;
  const { data: seriesEntity } = useSeriesEntity(series?.id);

  /* HOOKS */
  const { getTimeTillMaturity } = useTimeTillMaturity();

  const _selectedSeries = series || selectedSeries;
  /* Make sure there won't be an underflow */
  const _fallbackInput = ETH_BASED_ASSETS.includes(series?.baseId!) ? '.001' : '1';
  const _input = Number(input) === 0 ? _fallbackInput : cleanValue(input, _selectedSeries?.decimals);

  /* LOCAL STATE */
  const [apr, setApr] = useState<string | undefined>();

  useEffect(() => {
    if (!seriesEntity) return;

    const { sharesReserves, fyTokenReserves, ts, g1, g2, decimals, c, mu, maturity, getShares, apr } = seriesEntity;

    const baseAmount = ethers.utils.parseUnits(_input || _fallbackInput, decimals);

    let preview: ethers.BigNumber | Error = ethers.constants.Zero;

    if (actionType === 'LEND')
      preview = sellBase(
        sharesReserves.value,
        fyTokenReserves.value,
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
        sharesReserves.value,
        fyTokenReserves.value,
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
  }, [_fallbackInput, _input, actionType, getTimeTillMaturity, seriesEntity]);

  return { apr };
};
