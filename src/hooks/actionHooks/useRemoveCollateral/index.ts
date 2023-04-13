// HOOKS
import { useRemoveCollateralVR } from './useRemoveCollateralVR';
import { useRemoveCollateralFR } from './useRemoveCollateralFR';

export const useRemoveCollateral = (isVRVault: boolean) => {
  const baseHook = isVRVault ? useRemoveCollateralVR : useRemoveCollateralFR;

  return baseHook();
};
