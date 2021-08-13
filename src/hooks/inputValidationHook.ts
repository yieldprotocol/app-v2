import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ISeries, IUserContext, IVault } from '../types';

/* APR hook calculatess APR, min and max aprs for selected series and BORROW or LEND type */
export const useInputValidation = (
  input: string | undefined,
  actionCode: ActionCodes,
  series: ISeries | undefined,
  limits: (number | string | undefined)[],
  vault?: IVault | undefined
) => {
  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { assetMap, seriesMap, selectedSeriesId, selectedBaseId, activeAccount } = userState;
  const selectedSeries = series || seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(series?.baseId!) || assetMap.get(selectedBaseId!);

  /* LOCAL STATE */
  const [inputError, setInputError] = useState<string | null>();
  const [inputWarning, setInputWarning] = useState<string | null>();
  const [inputDisabled, setInputDisabled] = useState<boolean | null>();

  useEffect(() => {
    if (activeAccount && (input || input === '')) {
      const aboveMax: boolean = !!limits[1] && parseFloat(input) > parseFloat(limits[1].toString());
      const belowMin: boolean = !!limits[0] && parseFloat(input) < parseFloat(limits[0].toString());

      // General input validation here:
      if (parseFloat(input) < 0) {
        setInputError('Amount should be expressed as a positive value');
      } else if (aboveMax) {
        setInputError('Amount exceeds available balance');
      } else setInputError(null);

      // Action specific rules: - or message customising/Overriding:

      switch (actionCode) {

        case ActionCodes.BORROW : 
          input && selectedSeries && ethers.utils.parseEther(input).gt(selectedSeries.baseReserves) &&
          setInputError(`Amount exceeds the ${selectedBase?.symbol} currently available in pool`);
          break;

        case (ActionCodes.REPAY || ActionCodes.ROLL_DEBT) :
          aboveMax && setInputError('Amount exceeds your current debt');
          break;

        case ActionCodes.ADD_COLLATERAL:
          belowMin && setInputError('Undercollateralized');
          break;

        case ActionCodes.REMOVE_COLLATERAL:
          aboveMax && setInputError('Vault will be undercollateralised ');
          break;

        case ActionCodes.TRANSFER_VAULT: 
          input && !ethers.utils.isAddress(input) && setInputError('Not a valid Address');
          break;

        default: 
          setInputError(null); 
          break;
      }

    } else setInputError(null);

  }, [actionCode, activeAccount, input, limits, selectedBase?.symbol, selectedSeries ]);

  return {
    inputError,
    inputWarning,
    inputDisabled,
  };
};
