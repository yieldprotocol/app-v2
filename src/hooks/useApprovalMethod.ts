import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ApprovalType } from '../types';

export const useApprovalMethod = (): ApprovalType => {
  const {
    userState: { approvalMethod, selectedIlkId },
  } = useContext(UserContext);

  const {
    chainActions: { isConnected },
  } = useContext(ChainContext);

  const [approvalMethodToUse, setApprovalMethodToUse] = useState<ApprovalType>(ApprovalType.SIG);

  useEffect(() => {

    if (approvalMethod === ApprovalType.TX) {
      /* if user selected apporvals always use them: */ 
      setApprovalMethodToUse(ApprovalType.TX);
    } else if (
      /* else check other conditions to see if to use apporvals by tx */
      isConnected('ledgerWithMetamask') // Ledger with MetaMask connected
      // selectedIlkId === '0x303300000000' // is the asset WBTC
    ) {
      setApprovalMethodToUse(ApprovalType.TX);
    } else {
      /* if none of the conditions are met, use sigs */
      setApprovalMethodToUse(ApprovalType.SIG);
    }
  }, [approvalMethod, isConnected, selectedIlkId, setApprovalMethodToUse]);

  return approvalMethodToUse;
};
