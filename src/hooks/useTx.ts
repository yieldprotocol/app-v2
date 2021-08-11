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
}

/* useTx hook returns the tx status, and redirects to home after success if shouldRedirect is specified */
/* the return tx looks like any object of {txCode, isPending, isSuccess, isFailed, isRejected} */
export const useTx = (actionCode: ActionCodes, shouldRedirect: boolean = false) => {
  /* STATE FROM CONTEXT */
  const { txState: transactions } = useContext(TxContext);
  const {
    userState: { selectedVaultId, selectedSeriesId },
    userActions,
  } = useContext(UserContext);

  const history = useHistory();
  const INITIAL_STATE = { txCode: null, pending: false, success: false, failed: false, rejected: false, txHash: null };
  const [tx, setTx] = useState<ITx>(INITIAL_STATE);

  useEffect(() => {
    const txCode = selectedVaultId ? getTxCode(actionCode, selectedVaultId!) : getTxCode(actionCode, selectedSeriesId!);
    const txHash = transactions.processes?.get(txCode);
    setTx((t) => ({ ...INITIAL_STATE, txCode, txHash }));

    let status;
    if (transactions.transactions.has(txHash)) {
      status = transactions.transactions.get(txHash).status;
    }

    switch (status) {
      case TxState.PENDING:
        setTx((t) => ({ ...t, pending: true }));
        break;
      case TxState.SUCCESSFUL:
        setTx((t) => ({ ...t, success: true }));
        break;
      case TxState.FAILED:
        setTx((t) => ({ ...t, failed: true }));
        break;
      case TxState.REJECTED:
        setTx((t) => ({ ...t, rejected: true }));
        break;
    }

    if (status === TxState.SUCCESSFUL && shouldRedirect) {
      history.push('/');
      userActions.setSelectedVault(null);
    }
  }, [
    actionCode,
    shouldRedirect,
    selectedSeriesId,
    selectedVaultId,
    transactions.processes,
    transactions.transactions,
    tx.txHash,
    history,
    userActions,
  ]);

  return { tx };
};
