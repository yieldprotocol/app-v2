// HOOKS
import { useRemoveCollateralVR } from './useRemoveCollateralVR';
import { useRemoveCollateralFR } from './useRemoveCollateralFR';

export const useRemoveCollateral = (isVRVault: boolean) => {
  const removeCollateralVR = useRemoveCollateralVR();
  const removeCollateralFR = useRemoveCollateralFR();

  return isVRVault ? removeCollateralVR : removeCollateralFR;
};
