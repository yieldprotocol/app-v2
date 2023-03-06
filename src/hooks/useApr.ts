import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { sellBase, buyBase, calculateAPR } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS } from '../config/assets';
import { ActionType } from '../types';
import { cleanValue } from '../utils/appUtils';
import useTimeTillMaturity from './useTimeTillMaturity';
import useSeriesEntities from './useSeriesEntities';

/* APR hook estimates borrow and lend APR's for a specific series entity */
export const useApr = (input: string | undefined, actionType: ActionType, seriesId: string) => {
  const {
    seriesEntity: { data: seriesEntity },
  } = useSeriesEntities(seriesId);
  const { getTimeTillMaturity } = useTimeTillMaturity();

  /* Make sure there won't be an underflow */
  const _fallbackInput = ETH_BASED_ASSETS.includes(seriesEntity?.baseId!) ? '0.01' : '1';
  const _input = Number(input) === 0 ? _fallbackInput : cleanValue(input, seriesEntity?.decimals);

  /* LOCAL STATE */
  const [apr, setApr] = useState<string | undefined>(seriesEntity ? seriesEntity.apr : '0');

  useEffect(() => {
    if (!seriesEntity) throw new Error(`seriesEntity with id ${seriesId} is undefined`);

    let preview: ethers.BigNumber | Error = ethers.constants.Zero;

    const { sharesReserves, fyTokenReserves, decimals, getShares, maturity, ts, g1, g2, c, mu } = seriesEntity;
    const baseAmount = ethers.utils.parseUnits(_input, decimals);

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
    _apr && setApr(cleanValue(_apr, 2));
  }, [_input, actionType, getTimeTillMaturity, seriesEntity, seriesId]);

  return { apr };
};
