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
  const { userState } = useContext(UserContext);

  const isActionAllowed = (action: ActionCodes, series?: ISeries): boolean => {
    const seriesToUse = series || userState.selectedSeries;

    if (seriesToUse) {
      if (seriesToUse.allowActions.includes('allow_all') || seriesToUse.allowActions.includes(action)) {return true}
      else {
        toast.warn(`Action temporarily not allowed on this series.`);
        return false;
      }
    }
    return false; // deny action by default if conditions are not met
  };

  return { isActionAllowed };
};

export default useAllowAction;
