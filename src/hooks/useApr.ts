import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { sellBase, buyBase, calculateAPR } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS } from '../config/assets';
import { ActionType } from '../types';
import { cleanValue } from '../utils/appUtils';
import useTimeTillMaturity from './useTimeTillMaturity';
import useSeriesEntity from './useSeriesEntity';

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useApr = (input: string | undefined, actionType: ActionType, seriesId: string) => {
  /* STATE FROM CONTEXT */
  const { data: seriesEntity } = useSeriesEntity(seriesId);

  /* HOOKS */
  const { getTimeTillMaturity } = useTimeTillMaturity();

  /* LOCAL STATE */
  const [apr, setApr] = useState<string | undefined>();

  useEffect(() => {
    if (!seriesEntity) return;

    /* Make sure there won't be an underflow */
    const _fallbackInput = ETH_BASED_ASSETS.includes(seriesEntity.baseId) ? '.001' : '1';
    const _input = Number(input) === 0 ? _fallbackInput : cleanValue(input, seriesEntity.decimals);

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
    _apr ? setApr(cleanValue(_apr, 2)) : setApr(cleanValue(apr, 2));
  }, [actionType, getTimeTillMaturity, input, seriesEntity]);

  return { apr };
};
