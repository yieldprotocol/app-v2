// HOOKS
import { useRepayDebtVR } from './useRepayDebtVR';
import { useRepayDebtFR } from './useRepayDebtFR';

// CONTEXTS
import { useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';

export const useRepayDebt = () => {
  const { userState } = useContext(UserContext);
  const { selectedSeries } = userState;

  const repayDebtVR = useRepayDebtVR();
  const repayDebtFR = useRepayDebtFR();

  return selectedSeries ? repayDebtFR : repayDebtVR;
};
