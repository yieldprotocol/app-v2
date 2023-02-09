import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { sellBase, buyBase, calculateAPR } from '@yield-protocol/ui-math';

import { ETH_BASED_ASSETS } from '../config/assets';
import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries, ISeriesRoot } from '../types';
import { cleanValue } from '../utils/appUtils';
import useTimeTillMaturity from './useTimeTillMaturity';
import useSeriesEntities, { SeriesEntitiesRoot } from './useSeriesEntities';

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useApr = (input: string | undefined, actionType: ActionType, series: ISeries | ISeriesRoot | null) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext);
  const { selectedSeries } = userState;

  /* HOOKS */
  const { getTimeTillMaturity } = useTimeTillMaturity();

  const {
    data: { seriesEntity },
  } = useSeriesEntities(series?.id);
  console.log('🦄 ~ file: useApr.ts:25 ~ useApr ~ seriesEntity', seriesEntity);

  /* Make sure there won't be an underflow */
  const _fallbackInput = ETH_BASED_ASSETS.includes(series?.baseId!) ? '0.01' : '1';
  const _input = Number(input) === 0 ? _fallbackInput : cleanValue(input, seriesEntity?.decimals);

  /* LOCAL STATE */
  const [apr, setApr] = useState<string | undefined>();

  useEffect(() => {
    let preview: ethers.BigNumber | Error = ethers.constants.Zero;
    if (seriesEntity) {
      const baseAmount = ethers.utils.parseUnits(_input || _fallbackInput, seriesEntity.decimals);
      const { sharesReserves, fyTokenReserves } = seriesEntity;

      if (actionType === 'LEND')
        preview = sellBase(
          sharesReserves,
          fyTokenReserves,
          seriesEntity.getShares(baseAmount), // convert input from base to shares
          getTimeTillMaturity(seriesEntity.maturity),
          seriesEntity.ts,
          seriesEntity.g1,
          seriesEntity.decimals,
          seriesEntity.c,
          seriesEntity.mu
        );

      if (actionType === 'BORROW')
        preview = buyBase(
          sharesReserves,
          fyTokenReserves,
          seriesEntity.getShares(baseAmount), // convert input from base to shares
          getTimeTillMaturity(seriesEntity.maturity),
          seriesEntity.ts,
          seriesEntity.g2,
          seriesEntity.decimals,
          seriesEntity.c,
          seriesEntity.mu
        );

      // figure out what to do with negative apr on borrow for tv series
      const _apr = calculateAPR(baseAmount, preview, seriesEntity.maturity);
      _apr ? setApr(cleanValue(_apr, 2)) : setApr(seriesEntity.apr);
    }
  }, [seriesEntity, _input, actionType, _fallbackInput, getTimeTillMaturity]);

  return { apr };
};
