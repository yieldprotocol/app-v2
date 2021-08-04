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
}

/* useTx hook returns the tx status, and redirects to home after success if shouldRedirect is specified */
/* the return tx looks like any object of {txCode, isPending, isSuccess, isFailed, isRejected} */
export const useTx = (actionCode: ActionCodes, shouldRedirect: boolean = false) => {
  /* STATE FROM CONTEXT */
  const { txState: transactions } = useContext(TxContext);
  const {
    userState: { selectedVaultId, selectedSeriesId },
  } = useContext(UserContext);

  const history = useHistory();
  const INITIAL_STATE = { txCode: null, pending: false, success: false, failed: false, rejected: false };
  const [tx, setTx] = useState<ITx>(INITIAL_STATE);

  useEffect(() => {
    const txCode = selectedVaultId ? getTxCode(actionCode, selectedVaultId!) : getTxCode(actionCode, selectedSeriesId!);
    setTx({ ...INITIAL_STATE, txCode });
    const txHash = transactions.processes?.get(txCode);

    let status;
    if (transactions.transactions.has(txHash)) {
      status = transactions.transactions.get(txHash).status;
    }

    switch (status) {
      case TxState.PENDING:
        setTx({ ...tx, pending: true });
        break;
      case TxState.SUCCESSFUL:
        setTx({ ...tx, success: true });
        break;
      case TxState.FAILED:
        setTx({ ...tx, failed: true });
        break;
      case TxState.REJECTED:
        setTx({ ...tx, rejected: true });
        break;
    }
  }, [
    selectedSeriesId,
    actionCode,
    selectedVaultId,
    transactions.processes,
    transactions.transactions,
    shouldRedirect,
  ]);

  useEffect(() => {
    tx.success && shouldRedirect && history.push('/');
  }, [tx.success, shouldRedirect, history]);

  return { tx };
};
