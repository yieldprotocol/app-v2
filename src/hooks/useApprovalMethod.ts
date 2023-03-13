import { useContext, useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { ChainContext } from '../contexts/ChainContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { ApprovalType } from '../types';
import useAccountPlus from './useAccountPlus';

export const useApprovalMethod = (): ApprovalType => {
  const {
    settingsState: { approvalMethod, useMockedUser },
  } = useContext(SettingsContext);

  const { connector: activeConnector } = useAccountPlus();
  const [approvalMethodToUse, setApprovalMethodToUse] = useState<ApprovalType>(ApprovalType.SIG);

  useEffect(() => {
    if (activeConnector && activeConnector.name !== 'MetaMask' || approvalMethod === ApprovalType.TX || useMockedUser ) {
      setApprovalMethodToUse(ApprovalType.TX);
    } else {
      setApprovalMethodToUse(ApprovalType.SIG);
    }
  }, [approvalMethod, setApprovalMethodToUse, activeConnector]);

  return approvalMethodToUse;
};
