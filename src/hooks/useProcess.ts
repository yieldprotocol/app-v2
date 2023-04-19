import { useContext, useEffect, useState } from 'react';
import { TxContext } from '../contexts/TxContext';
import { ActionCodes, IYieldProcess } from '../types';
import { getTxCode } from '../utils/appUtils';

/* useTx hook returns the tx status, and redirects to home after success if shouldRedirect is specified */
/* the return tx looks like any object of {txCode, isPending, isSuccess, isFailed, isRejected} */
export const useProcess = (
  actionCode: ActionCodes | undefined,
  seriesOrVaultId: string | null,
  transactionCode: string | undefined = undefined,
  shouldRedirect: boolean = false
) => {
  /* STATE FROM CONTEXT */
  const {
    txState: { processes },
    txActions,
  } = useContext(TxContext);

  const [txCode, setTxCode] = useState<string>();
  const [txProcess, setTxProcess] = useState<IYieldProcess>();

  const resetProcess = () => txActions.resetProcess(txCode);

  // 1. Set the txCode from provided... or based on seriesId and actionCode
  useEffect(() => {
    if (transactionCode) {
      setTxCode(transactionCode);
    } else {
      actionCode && seriesOrVaultId ? setTxCode(getTxCode(actionCode, seriesOrVaultId)) : setTxCode(undefined);
    }
  }, [actionCode, seriesOrVaultId, transactionCode]);

  useEffect(() => {
    const _process = processes.get(txCode);
    if (_process) setTxProcess(_process);
  }, [processes, txCode]);

  /* Reset process on first load */
  useEffect(() => {
    resetProcess();
  }, []);

  return { txProcess, resetProcess };
};
