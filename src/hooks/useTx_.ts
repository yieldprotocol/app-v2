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
  receipt: any | undefined;
}

/* useTx hook returns the tx status, and redirects to home after success if shouldRedirect is specified */
/* the return tx looks like any object of {txCode, isPending, isSuccess, isFailed, isRejected} */
export const useTx = (
  actionCode: ActionCodes | undefined,
  seriesOrVaultId: string | undefined,
  transactionCode: string | undefined = undefined,
  shouldRedirect: boolean = false
) => {

  /* STATE FROM CONTEXT */
  const {
    txState: { transactions, processes },
  } = useContext(TxContext);
  const {
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
    receipt: undefined,
  };

  const [tx, setTx] = useState<ITx>(INITIAL_STATE);
  const [txCode, setTxCode] = useState<string>();
  const [txHash, setTxHash] = useState<string>();
  const [txStatus, setTxStatus] = useState<TxState>();
  const [processActive, setProcessActive] = useState<boolean>(false);

  const resetTx = () => {
    setTx(INITIAL_STATE);
    setTxHash(undefined);
    setTxStatus(undefined);
    setProcessActive(false);
  };

  // 1. Set the transaction code from provided... or based on seriesId and actionCode 
  useEffect(() => {
    if (transactionCode) {
      setTxCode(transactionCode);
     } else {
      (actionCode && seriesOrVaultId) ? setTxCode(getTxCode(actionCode, seriesOrVaultId)) : setTxCode(undefined);
     }
  }, [actionCode, seriesOrVaultId, transactionCode]);

  // 2. Get the txHash (if there is one)
  useEffect(() => {
    txCode && setTxHash(processes.get(txCode!)?.hash!);
  }, [processes, txCode, processActive]);

  // 3. Check/set if the process is active or not
  useEffect(() => {
    txCode && processes.get(txCode)?.status === 'ACTIVE'
      ? setProcessActive(true)
      : setProcessActive(false);
  }, [processes, txCode]);

  // 4. If the process has an associated Transaction... get its status
  useEffect(() => {
    processActive && transactions.has(txHash) && setTxStatus(transactions.get(txHash).status);
  }, [txHash, transactions, processActive]);

  // 5. If the transaction has an associated receipt, add it to the  
  useEffect(() => {
    transactions.has(txHash) && setTx((t) => ({ ...t, receipt: transactions.get(txHash).receipt }));
  }, [txHash, transactions]);

  // WATCH and set if the txStatus changes 
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

    if (txCode?.includes(ActionCodes.BORROW) && tx.receipt) {
      const vaultId = getVaultIdFromReceipt(tx.receipt, contractMap);
      setTx((t) => ({ ...t, positionPath: `${pathPrefix}/${vaultId}` }));
    } else if (txCode?.includes(ActionCodes.BORROW) && !tx.receipt) {
      setTx((t) => ({ ...t, positionPath: undefined }));
    } else {
      const positionId = txCode && txCode.split('_')[1];
      setTx((t) => ({ ...t, positionPath: `${pathPrefix}/${positionId}` }));
    }
  }, [transactions, contractMap, txCode, txHash, tx.receipt]);

  return { tx, resetTx };
};
