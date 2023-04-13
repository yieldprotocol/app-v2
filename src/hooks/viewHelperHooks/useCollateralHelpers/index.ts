import { useCollateralHelpersFR } from './useCollateralHelpersFR'; // TODO update exports
import { useCollateralHelpersVR } from './useCollateralHelpersVR'; // TODO update exports

/* TYPES */
import { IAssetPair, IVault } from '../../../types';

export const useCollateralHelpers = (
  debtInput: string | undefined,
  collInput: string | undefined,
  vault: IVault | undefined,
  assetPairInfo: IAssetPair | undefined | null,
  isVariableRate: boolean | undefined | null
) => {
  const baseHook = isVariableRate ? useCollateralHelpersVR : useCollateralHelpersFR;

  return baseHook(debtInput, collInput, vault, assetPairInfo);
};
