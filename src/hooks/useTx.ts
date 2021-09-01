import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, TxState } from '../types';
import { getTxCode, getPositionPathPrefix, getVaultIdFromReceipt } from '../utils/appUtils';

interface ITx {
  txCode: any;
  pending: boolean;
  success: boolean;
  failed: boolean;
  rejected: boolean;
  txHash: any;
  processActive: boolean;
  positionPath: string | undefined;
}

/* useTx hook returns the tx status, and redirects to home after success if shouldRedirect is specified */
/* the return tx looks like any object of {txCode, isPending, isSuccess, isFailed, isRejected} */
export const useTx = (
  actionCode: ActionCodes,
  seriesOrVaultId: string | undefined,
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
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const history = useHistory();

  const INITIAL_STATE = {
    txCode: undefined,
    pending: false,
    success: false,
    failed: false,
    rejected: false,
    txHash: undefined,
    processActive: false,
    positionPath: undefined,
  };

  const [tx, setTx] = useState<ITx>(INITIAL_STATE);
  const [txCode, setTxCode] = useState<string>();
  const [txHash, setTxHash] = useState<string>();
  const [txStatus, setTxStatus] = useState<TxState>();
  const [txReceipt, setTxReceipt] = useState<any>();
  const [processActive, setProcessActive] = useState<boolean>(false);

  const resetTx = () => {
    setTx(INITIAL_STATE);
    setTxHash(undefined);
    setTxStatus(undefined);
    setTxReceipt(undefined);
    setProcessActive(false);
  };

  useEffect(() => {
    seriesOrVaultId ? setTxCode(getTxCode(actionCode, seriesOrVaultId)) : setTxCode(undefined);
  }, [actionCode, seriesOrVaultId]);

  useEffect(() => {
    const _txHash = processes.get(txCode!)?.hash!;

    if (txCode && _txHash) {
      setTxHash(_txHash);
      setTx((t) => ({ ...t, txHash: _txHash }));
    }
  }, [processes, txCode, processActive]);

  useEffect(() => {
    txCode && processes.has(txCode) && processes.get(txCode).status === 'ACTIVE'
      ? setProcessActive(true)
      : setProcessActive(false);
  }, [processes, txCode]);

  useEffect(() => {
    if (transactions.has(txHash)) {
      setTxStatus(transactions.get(txHash).status);
      setTxReceipt(transactions.get(txHash).receipt);
    }
  }, [txHash, transactions]);

  useEffect(() => {
    setTx((t) => ({ ...t, txCode, processActive }));
    switch (txStatus) {
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
  }, [txCode, processActive, txStatus, txHash]);

  useEffect(() => {
    tx.success && shouldRedirect && history.push('/') && userActions.setSelectedVault(null);
  }, [tx.success, shouldRedirect, history, userActions]);

  // get the vault id after borrowing or the lend/pool position id's
  useEffect(() => {
    const pathPrefix = txCode && getPositionPathPrefix(txCode!);

    if (txCode?.includes(ActionCodes.BORROW) && txReceipt) {
      const vaultId = getVaultIdFromReceipt(txReceipt, contractMap);
      setTx((t) => ({ ...t, positionPath: `${pathPrefix}/${vaultId}` }));
    } else if (txCode?.includes(ActionCodes.BORROW) && !txReceipt) {
      setTx((t) => ({ ...t, positionPath: undefined }));
    } else {
      const positionId = txCode && txCode.split('_')[1];
      setTx((t) => ({ ...t, positionPath: `${pathPrefix}/${positionId}` }));
    }
  }, [transactions, contractMap, txCode, txHash, txReceipt]);

  return { tx, resetTx };
};
