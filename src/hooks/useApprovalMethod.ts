import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { ApprovalType } from '../types';

export const useApprovalMethod = (): ApprovalType => {
  const {
    settingsState: { approvalMethod },
  } = useContext(SettingsContext);

  const {
    chainState: {
      connection: { connectionName },
    },
  } = useContext(ChainContext);

  const [approvalMethodToUse, setApprovalMethodToUse] = useState<ApprovalType>(ApprovalType.SIG);

  useEffect(() => {
    if (connectionName !== 'metamask' || approvalMethod === ApprovalType.TX ) {
      setApprovalMethodToUse(ApprovalType.TX);
    } else {
      setApprovalMethodToUse(ApprovalType.SIG);
    }
  }, [approvalMethod, setApprovalMethodToUse, connectionName]);

  return approvalMethodToUse;
};
