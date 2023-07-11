import { useContext } from 'react';
import { toast } from 'react-toastify';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ISeries } from '../types';

/**
 * This function/hook is used to determine if a user is allowed to perform an action on a particular series.
 * @param series
 * @param action
 * @returns boolean
 */
const useAllowAction = () => {
  const isActionAllowed = (action: ActionCodes, series: ISeries) => {
    if (series.allowActions.includes('allow_all') || series.allowActions.includes(action)) return true;

    toast.warn(`Action temporarily not allowed on this series.`);
    return false;
  };

  return { isActionAllowed };
};

export default useAllowAction;
