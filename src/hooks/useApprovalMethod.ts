import { useContext, useMemo } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { ApprovalType } from '../types';

export const useApprovalMethod = (): ApprovalType => {
  const {
    settingsState: { approvalMethod, useMockedUser },
  } = useContext(SettingsContext);

  return useMemo(
    () => (approvalMethod === ApprovalType.TX || useMockedUser ? ApprovalType.TX : ApprovalType.SIG),
    [approvalMethod, useMockedUser]
  );
};
