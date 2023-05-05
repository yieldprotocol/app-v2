// HOOKS
import { useRemoveCollateralVR } from './useRemoveCollateralVR';
import { useRemoveCollateralFR } from './useRemoveCollateralFR';

// CONTEXTS
import { UserContext } from '../../../contexts/UserContext';

import { useContext } from 'react';

export const useRemoveCollateral = () => {
  const {
    userState: { selectedVR },
  } = useContext(UserContext);

  const removeCollateralVR = useRemoveCollateralVR();
  const removeCollateralFR = useRemoveCollateralFR();

  return selectedVR ? removeCollateralVR : removeCollateralFR;
};
