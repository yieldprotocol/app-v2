import { useContext, useEffect, useState } from 'react';
import { useConnect } from 'wagmi';
import { SettingsContext } from '../contexts/SettingsContext';
import { ApprovalType } from '../types';

export const useApprovalMethod = (): ApprovalType => {
  const { activeConnector } = useConnect();
  const {
    settingsState: { approvalMethod },
  } = useContext(SettingsContext);

  const [approvalMethodToUse, setApprovalMethodToUse] = useState<ApprovalType>(ApprovalType.SIG);

  useEffect(() => {
    if (activeConnector.name !== 'MetaMask' || approvalMethod === ApprovalType.TX) {
      setApprovalMethodToUse(ApprovalType.TX);
    } else {
      setApprovalMethodToUse(ApprovalType.SIG);
    }
  }, [approvalMethod, setApprovalMethodToUse, activeConnector.name]);

  return approvalMethodToUse;
};
