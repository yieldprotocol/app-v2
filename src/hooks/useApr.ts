import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { sellBase, buyBase, calculateAPR } from '@yield-protocol/ui-math';

import { ActionType } from '../types';
import { cleanValue } from '../utils/appUtils';
import useTimeTillMaturity from './useTimeTillMaturity';
import useSeriesEntities from './useSeriesEntities';

/* APR hook estimates borrow and lend APR's for a specific series entity */
export const useApr = (input: string | undefined, actionType: ActionType, seriesId: string | null | undefined) => {
  const {
    seriesEntity: { data: seriesEntity },
  } = useSeriesEntities(seriesId);
  const { getTimeTillMaturity } = useTimeTillMaturity();

  /* LOCAL STATE */
  const [apr, setApr] = useState<string | undefined>(() =>
    cleanValue(actionType === ActionType.LEND ? seriesEntity?.lendAPR : seriesEntity?.borrowAPR, 2)
  );

  useEffect(() => {
    if (!input || input === '') return;
    if (!seriesEntity) return;

    /* Make sure there won't be an underflow */
    const _input = cleanValue(input, seriesEntity.decimals);

    let preview: ethers.BigNumber | Error = ethers.constants.Zero;

    const { sharesReserves, fyTokenReserves, decimals, getShares, maturity, ts, g1, g2, c, mu } = seriesEntity;
    const baseAmount = ethers.utils.parseUnits(_input, decimals);

    if (actionType === ActionType.LEND) {
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
    }

    if (actionType === ActionType.BORROW) {
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
    }

    // figure out what to do with negative apr on borrow for tv series
    const _apr = calculateAPR(baseAmount, preview, maturity);

    _apr && setApr(cleanValue(_apr, 2));
  }, [actionType, getTimeTillMaturity, input, seriesEntity]);

  return { apr };
};
