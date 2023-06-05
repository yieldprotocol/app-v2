import { useContext } from 'react';
import { toast } from 'react-toastify';
import { UserContext } from '../contexts/UserContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { ActionCodes, ISeries } from '../types';
import { actionControlMapping } from '../utils/appUtils';

/**
 * This function/hook is used to determine if a user is allowed to perform an action on a particular series.
 * @param series
 * @param action
 * @returns boolean
 */
const useAllowAction = () => {
  const { userState } = useContext(UserContext);
  const { settingsState } = useContext(SettingsContext);

  const isActionAllowed = (action: ActionCodes, series?: ISeries): boolean => {
    const seriesToUse = series || userState.selectedSeries;

    if (seriesToUse) {
      const actionAllowedBySeries =
        seriesToUse.allowActions.includes('allow_all') || seriesToUse.allowActions.includes(action);
      const actionAllowedByFeature = settingsState.featureControls[actionControlMapping[action]];

      if (actionAllowedBySeries && actionAllowedByFeature) {
        return true;
      }

      // Show the proper warning message based on the condition that was not met
      toast.warn(
        actionAllowedBySeries ? `Action temporarily restricted.` : `Action temporarily not allowed on this series.`
      );
    }
    return false; // deny action by default if conditions are not met
  };

  return { isActionAllowed };
};

export default useAllowAction;
