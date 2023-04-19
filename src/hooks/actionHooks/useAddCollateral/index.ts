// Hooks
import { useAddCollateralVR } from './useAddCollateralVR';
import { useAddCollateralFR } from './useAddCollateralFR';

// Contexts
import { useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';

export const useAddCollateral = () => {
  const { userState } = useContext(UserContext);
  const { selectedSeries } = userState;

  const baseHook = selectedSeries ? useAddCollateralFR : useAddCollateralVR;

  return baseHook();
};
