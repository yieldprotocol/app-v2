import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ISeries, IUserContext, IUserContextState, IVault } from '../types';

/* Provides input validation for each ActionCode */
export const useInputValidation = (
  input: string | undefined,
  actionCode: ActionCodes,
  series: ISeries | null,
  limits: (number | string | undefined)[],
  vault?: IVault | undefined
) => {
  /* STATE FROM CONTEXT */
  const { userState }: { userState: IUserContextState } = useContext(UserContext) as IUserContext;
  const { assetMap, selectedSeries, selectedBase, activeAccount } = userState;
  const _selectedSeries = series || selectedSeries;
  const _selectedBase = assetMap.get(series?.baseId!) || selectedBase;

  /* LOCAL STATE */
  const [inputError, setInputError] = useState<string | null>();
  // const [inputWarning, setInputWarning] = useState<string | null>();
  // const [inputDisabled, setInputDisabled] = useState<boolean | null>();

  useEffect(() => {
    if (activeAccount && (input || input === '')) {
      const _inputAsFloat = parseFloat(input);
      const aboveMax: boolean = !!limits[1] && _inputAsFloat > parseFloat(limits[1].toString());
      const belowMin: boolean = !!limits[0] && _inputAsFloat < parseFloat(limits[0].toString());

      // General input validation here:
      if (parseFloat(input) < 0 && actionCode !== ActionCodes.TRANSFER_VAULT) {
        setInputError('Amount should be expressed as a positive value');
      } else if (
        parseFloat(input) === 0 &&
        actionCode !== ActionCodes.ADD_COLLATERAL &&
        actionCode !== ActionCodes.ROLL_DEBT
      ) {
        setInputError('Transaction amount should be greater than 0');
      } else if (aboveMax) {
        setInputError('Amount exceeds available balance');
      } else setInputError(null);

      // Action specific rules: - or message customising/Overriding:
      switch (actionCode) {
        case ActionCodes.BORROW:
          input &&
            _selectedSeries &&
            ethers.utils.parseUnits(input, _selectedSeries.decimals).gt(_selectedSeries.sharesReserves) &&
            setInputError(`Amount exceeds the ${_selectedBase?.symbol} currently available in pool`);
          aboveMax && setInputError('Exceeds the max allowable debt for this series');
          belowMin &&
            setInputError(`A minimum debt of ${limits[0]} ${_selectedBase?.symbol} is required for this series`);
          break;

        case ActionCodes.REPAY:
        case ActionCodes.ROLL_DEBT:
          /* set dust limit Error between 0 and dustLimit */
          limits[0] &&
            _inputAsFloat > parseFloat(limits[0].toString()) &&
            setInputError('Remaining debt will be below the required minimum');

          /* token balance value */
          aboveMax && setInputError('Amount exceeds token balance');
          break;

        case ActionCodes.ADD_COLLATERAL:
          belowMin && setInputError('Undercollateralized');
          break;

        case ActionCodes.REMOVE_COLLATERAL:
          belowMin && setInputError('Vault will be undercollateralized');
          aboveMax && setInputError('Vault will be undercollateralized');
          break;

        case ActionCodes.TRANSFER_VAULT:
          input && !ethers.utils.isAddress(input) && setInputError('Not a valid Address');
          break;

        case ActionCodes.ROLL_POSITION:
          aboveMax && setInputError('Rolling is limited by protocol liquidity');
          break;

        case ActionCodes.LEND:
          aboveMax && setInputError('Amount exceeds the maximum you can lend');
          belowMin && setInputError('Amount should be expressed as a positive value');
          break;

        case ActionCodes.ADD_LIQUIDITY:
        case ActionCodes.CLOSE_POSITION:
        case ActionCodes.REMOVE_LIQUIDITY:
        case ActionCodes.ROLL_LIQUIDITY:
          aboveMax && setInputError('Amount exceeds available balance');
          belowMin && setInputError('Amount should be expressed as a positive value');
          break;

        default:
          setInputError(null);
          break;
      }
    } else setInputError(null);
  }, [actionCode, activeAccount, input, limits, _selectedBase?.symbol, _selectedSeries]);

  return {
    inputError,
    // inputWarning,
    // inputDisabled,
  };
};
