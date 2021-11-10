import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { UserContext } from '../contexts/UserContext';
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

    // if (approvalMethod === ApprovalType.TX) {
    //   /* if user selected apporvals always use them: */
    //   setApprovalMethodToUse(ApprovalType.TX);
    // } else if (
    //   /* else check other conditions to see if to use apporvals by tx */
    //   connectionName !== 'metamask' // Ledger with MetaMask connected
    // ) {
    //   setApprovalMethodToUse(ApprovalType.TX);
    // } else {
    //   /* if none of the conditions are met, use sigs */
    //   setApprovalMethodToUse(ApprovalType.SIG);
    // }
  }, [approvalMethod, setApprovalMethodToUse, connectionName]);

  return approvalMethodToUse;
};
