import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, ISeries, IUserContext } from '../types';
import { cleanValue } from '../utils/appUtils';
import { secondsToFrom, sellBase, buyBase, calculateAPR } from '../utils/yieldMath';

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useInputValidation = (
  input: string | undefined,
  actionCode: ActionCodes,
  series: ISeries | undefined,
  limits: (number | string | undefined)[]
) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { assetMap, seriesMap, selectedSeriesId, selectedBaseId, activeAccount } = userState;
  const selectedSeries = series || seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(series?.baseId!) || assetMap.get(selectedBaseId!);

  /* LOCAL STATE */
  const [inputError, setInputError] = useState<string | null>();
  const [inputWarning, setInputWarning] = useState<string | null>();
  const [inputDisabled, setInputDisabled] = useState<string | null>();

  useEffect(() => {


    if (activeAccount && (input || input === '')) {

      const aboveMax : boolean = !!limits[1] && parseFloat(input) > parseFloat(limits[1].toString());
      const belowMin : boolean = !!limits[0] && parseFloat(input) < parseFloat(limits[0].toString()); 

      // General input validation here: 
      if (parseFloat(input) < 0) {
        setInputError('Amount should be expressed as a positive value')
      } else setInputError(null);

      if (aboveMax) {
        setInputError('Amount exceeds available balance')
      } else setInputError(null);


      // Action specific rules: - or message customising: 

      /* BORROWING INPUT SECTION */
      if (actionCode === ActionCodes.BORROW) {
        input && selectedSeries && ethers.utils.parseEther(input).gt(selectedSeries.baseReserves) && 
        setInputError(`Amount exceeds the ${selectedBase?.symbol} currently available in pool`);
      };

      if (actionCode === ActionCodes.REPAY || actionCode === ActionCodes.ROLL_DEBT ) {
        aboveMax && setInputError('Amount exceeds your current debt')
      };

      if (actionCode === ActionCodes.ADD_COLLATERAL) {
        // limits[1] && parseFloat(input) > parseFloat(limits[1].toString()) && 
        // setInputError('Amount exceeds balance');
      };

      if (actionCode === ActionCodes.REMOVE_COLLATERAL) {
        // limits[1] && parseFloat(input) > parseFloat(limits[1].toString()) && 
        // setInputError('Amount exceeds balance');
      };


      /* LEND SECTION */
      if (actionCode === ActionCodes.LEND) {
        // limits[1] && parseFloat(input) > parseFloat(limits[1].toString()) && 
        // setInputError('Amount exceeds balance');
      };
 
      if (actionCode === ActionCodes.CLOSE_POSITION) {
        // limits[1] && parseFloat(input) > parseFloat(limits[1].toString()) && setInputError('Amount exceeds available fyToken balance');
        // !selectedSeries && setInputError('No base series selected');
      };

      if (actionCode === ActionCodes.ROLL_POSITION) {
        // limits[1] && parseFloat(input) > parseFloat(limits[1].toString()) && setInputError('Amount exceeds available fyToken balance');
        // !selectedSeries && setInputError('No base series selected');
      };

      /* POOL SECTION */ 
      if (actionCode === ActionCodes.ADD_LIQUIDITY) {
        // limits[1] && parseFloat(input) > parseFloat(limits[1].toString()) && 
        // setInputError('Amount exceeds balance');
      };

      if (actionCode === ActionCodes.REMOVE_LIQUIDITY || actionCode === ActionCodes.ROLL_LIQUIDITY) {
        aboveMax && setInputError('Amount exceeds liquidity token balance')
      };


    }  else setInputError(null);

  }, [actionCode, activeAccount, input, limits, selectedBase?.symbol, selectedSeries]);

  return {
    inputError,
    inputWarning,
    inputDisabled,
  };
};
