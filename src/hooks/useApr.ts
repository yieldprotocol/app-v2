import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries, IUserContext } from '../types';
import { cleanValue } from '../utils/appUtils';
import { secondsToFrom, sellBase, buyBase, calculateAPR } from '../utils/yieldMath';

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useApr = (input: string | undefined, actionType: ActionType, series: ISeries | undefined) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { seriesMap, selectedSeriesId, selectedBaseId } = userState;
  const selectedSeries = series || seriesMap.get(selectedSeriesId!);

  /* LOCAL STATE */
  const [apr, setApr] = useState<string | undefined>();

  useEffect(() => {
    let preview: ethers.BigNumber | Error = ethers.constants.Zero;
    if (selectedSeries) {
      const baseAmount = ethers.utils.parseUnits(input || '1', selectedSeries.decimals);
      const { baseReserves, fyTokenReserves, maturity } = selectedSeries;
      const ttm = secondsToFrom(maturity.toString());

      if (actionType === 'LEND') preview = sellBase(baseReserves, fyTokenReserves, baseAmount, ttm, selectedSeries.decimals);
      if (actionType === 'BORROW') preview = buyBase(baseReserves, fyTokenReserves, baseAmount, ttm, selectedSeries.decimals);

      const _apr = calculateAPR(baseAmount, preview, selectedSeries?.maturity);
      _apr ? setApr(cleanValue(_apr, 2)) : setApr(selectedSeries.apr);
    } else {
      // setApr(selectedSeries.APR)
      // selectedSeries?.APR && setApr(selectedSeries.APR);
    }
  }, [selectedSeries, input, actionType]);

  /* Get the min APR from all the series */
  const aprArray = Array.from(seriesMap.values())
    .filter((x: ISeries) => x.baseId === selectedBaseId)
    .map((x: ISeries) => parseFloat(x.apr));
  const minApr = aprArray.length && Math.min(...aprArray);
  const maxApr = aprArray.length && Math.min(...aprArray);

  return { apr, minApr, maxApr };
};
