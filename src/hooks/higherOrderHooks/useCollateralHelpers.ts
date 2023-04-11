/* HOOKS */
import { useCollateralHelpersFixedRate } from '../viewHelperHooks/useCollateralHelpersFixedRate';
import { useCollateralHelpersVariableRate } from '../viewHelperHooks/useCollateralHelpersVariableRate';

/* TYPES */
import { IAssetPair, IVault } from '../../types';

export const useCollateralHelpers = (
  debtInput: string | undefined,
  collInput: string | undefined,
  vault: IVault | undefined,
  assetPairInfo: IAssetPair | undefined | null,
  isVariableRate: boolean | undefined | null
) => {
  const baseHook = isVariableRate ? useCollateralHelpersVariableRate : useCollateralHelpersFixedRate;

  return baseHook(debtInput, collInput, vault, assetPairInfo);
};
