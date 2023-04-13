// HOOKS
import { useBorrowFR } from './useBorrowFR';
import { useBorrowVR } from './useBorrowVR';

// CONTEXTS
import { useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';

export const useBorrow = () => {
  const { userState } = useContext(UserContext);
  const { selectedVR } = userState;

  const baseHook = selectedVR ? useBorrowVR : useBorrowFR;

  return baseHook();
};
