// HOOKS
import { useLendFR } from './useLendFR';
import { useLendVR } from './useLendVR';

// CONTEXTS
import { useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';

export const useLend = () => {
  const lendFR = useLendFR();
  const lendVR = useLendVR();
  const { userState } = useContext(UserContext);
  const { selectedVR } = userState;

  return selectedVR ? lendVR : lendFR;
};

export default useLend;
