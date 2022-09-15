import { useContext, useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { ApprovalType } from '../types';

export const useApprovalMethod = (): ApprovalType => {
  const {
    settingsState: { approvalMethod },
  } = useContext(SettingsContext);

  const { connector: activeConnector, isConnected } = useAccount()

  const [approvalMethodToUse, setApprovalMethodToUse] = useState<ApprovalType>(ApprovalType.SIG);

  useEffect(() => {
    if (activeConnector && activeConnector.name !== 'metaMask' || approvalMethod === ApprovalType.TX ) {
      setApprovalMethodToUse(ApprovalType.TX);
    } else {
      setApprovalMethodToUse(ApprovalType.SIG);
    }
  }, [approvalMethod, setApprovalMethodToUse, activeConnector]);

  return approvalMethodToUse;
};
