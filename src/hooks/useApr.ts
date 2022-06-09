import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { ETH_BASED_ASSETS } from '../config/assets';
import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries, IUserContext, IUserContextState } from '../types';
import { cleanValue } from '../utils/appUtils';
import { sellBase, buyBase, calculateAPR } from '../utils/yieldMath';

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useApr = (input: string | undefined, actionType: ActionType, series: ISeries | null) => {
  /* STATE FROM CONTEXT */
  const { userState }: { userState: IUserContextState } = useContext(UserContext) as IUserContext;
  const { seriesMap, selectedSeries, selectedBase } = userState;

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
      const { baseReserves, fyTokenReserves } = _selectedSeries;
      if (actionType === 'LEND')
        preview = sellBase(
          baseReserves,
          fyTokenReserves,
          baseAmount,
          _selectedSeries.getTimeTillMaturity(),
          _selectedSeries.ts,
          _selectedSeries.g1,
          _selectedSeries.decimals
        );
      if (actionType === 'BORROW')
        preview = buyBase(
          baseReserves,
          fyTokenReserves,
          baseAmount,
          _selectedSeries.getTimeTillMaturity(),
          _selectedSeries.ts,
          _selectedSeries.g2,
          _selectedSeries.decimals
        );
      const _apr = calculateAPR(baseAmount, preview, _selectedSeries?.maturity);
      _apr ? setApr(cleanValue(_apr, 2)) : setApr(_selectedSeries.apr);
    }
  }, [_selectedSeries, _input, actionType, _fallbackInput]);

  /* Get the min APR from all the series */
  const aprArray = Array.from(seriesMap.values())
    .filter((x: ISeries) => x.baseId === selectedBase?.proxyId)
    .map((x: ISeries) => parseFloat(x.apr));
  const minApr = aprArray.length && Math.min(...aprArray);
  const maxApr = aprArray.length && Math.min(...aprArray);

  return { apr, minApr, maxApr };
};
