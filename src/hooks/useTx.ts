import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, TxState } from '../types';
import { getTxCode } from '../utils/appUtils';

interface ITx {
  txCode: any;
  pending: boolean;
  success: boolean;
  failed: boolean;
  rejected: boolean;
  txHash: any;
  processActive: boolean;
}

/* useTx hook returns the tx status, and redirects to home after success if shouldRedirect is specified */
/* the return tx looks like any object of {txCode, isPending, isSuccess, isFailed, isRejected} */
export const useTx = (
  actionCode: ActionCodes,
  seriesOrVaultId: string|undefined,
  shouldRedirect: boolean = false
) => {

  /* STATE FROM CONTEXT */
  const {
    txState: { transactions, processes },
  } = useContext(TxContext);
  const {
    // userState: { selectedVaultId, selectedSeriesId },
    userActions,
  } = useContext(UserContext);

  const history = useHistory();

  const INITIAL_STATE = {
    txCode: undefined,
    pending: false,
    success: false,
    failed: false,
    rejected: false,
    txHash: undefined,
    processActive: false,
  };

  const [tx, setTx] = useState<ITx>(INITIAL_STATE);
  const [txCode, setTxCode] = useState<string>();
  const [txHash, setTxHash] = useState<string>();
  const [processActive, setProcessActive] = useState<boolean>(false);

  const resetTx = () => {
    setTx(INITIAL_STATE);
  };

  useEffect(() => {
    seriesOrVaultId ? setTxCode(getTxCode(actionCode, seriesOrVaultId)) : setTxCode(undefined)
  }, [actionCode, seriesOrVaultId]);

  useEffect(() => {
    txCode && setTxHash(processes.get(txCode)?.hash!);
  }, [processes, txCode, processActive]);

  useEffect(() => {
      processes.has(txCode) && 
      processes.get(txCode).status === 'ACTIVE' 
      ? setProcessActive(true) 
      : setProcessActive(false);
  }, [processes, txCode]);

  // useEffect(()=>{
  //   setTx((t) => ({ ...t, txCode, txHash, processActive }));
  // },[txCode, txHash, processActive])

  useEffect(() => {

    setTx((t) => ({ ...t, txCode, processActive }));

    let status;
    if (transactions.has(txHash)) {
      status = transactions.get(txHash).status;
    }
    switch (status) {
      case TxState.PENDING:
        setTx((t) => ({ ...t, pending: true, txHash, processActive }));
        break;
      case TxState.SUCCESSFUL:
        setTx((t) => ({ ...t, success: true, pending: false, processActive }));
        break;
      case TxState.FAILED:
        setTx((t) => ({ ...t, failed: true, pending: false, processActive }));
        break;
      case TxState.REJECTED:
        setTx((t) => ({ ...t, rejected: true, pending: false, processActive }));
        break;
    }
  }, [transactions, txHash, txCode, processActive]);

  useEffect(() => {
    tx.success && shouldRedirect && history.push('/') && userActions.setSelectedVault(null);
  }, [tx.success, shouldRedirect, history, userActions]);

  return { tx, resetTx };
};
