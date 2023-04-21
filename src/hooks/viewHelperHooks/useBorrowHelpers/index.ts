// Hooks
import { useBorrowHelpersFR } from './useBorrowHelpersFR';
import { useBorrowHelpersVR } from './useBorrowHelpersVR';

// Contexts
import { useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';

// Types
import { IVault, ISeries, IAssetPair } from '../../../types';

export const useBorrowHelpers = (
  input: string | undefined,
  collateralInput: string | undefined,
  vault: IVault | undefined,
  assetPairInfo: IAssetPair | null | undefined,
  futureSeries: ISeries | null = null // Future or rollToSeries
) => {
  const { userState } = useContext(UserContext);
  const { selectedVR } = userState;

  const borrowHelpersVR = useBorrowHelpersVR(input, collateralInput, vault, assetPairInfo);
  const borrowHelpersFR = useBorrowHelpersFR(input, collateralInput, vault, assetPairInfo, futureSeries);

  return selectedVR ? borrowHelpersVR : borrowHelpersFR;
};
