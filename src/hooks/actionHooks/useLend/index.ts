// HOOKS
import { useLendFR } from './useLendFR';
import { useLendVR } from './useLendVR';

// CONTEXTS
import { useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';

export const useLend = () => {
  console.log('useLend firing index.ts');
  const { userState } = useContext(UserContext);
  const { selectedVR } = userState;

  return selectedVR ? useLendVR() : useLendFR();
};
