import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, TxState, ProcessStage, IYieldProcess } from '../types';
import { getTxCode, getPositionPathPrefix, getVaultIdFromReceipt } from '../utils/appUtils';

interface IProcess {
  txCode: string;
  stage: ProcessStage;
  txHash?: string | undefined;
  txStatus?: TxState;
  positionPath?: string | undefined;
  receipt?: any | undefined;
}

/* useTx hook returns the tx status, and redirects to home after success if shouldRedirect is specified */
/* the return tx looks like any object of {txCode, isPending, isSuccess, isFailed, isRejected} */
export const useProcess = (
  actionCode: ActionCodes | undefined,
  seriesOrVaultId: string | undefined,
  transactionCode: string | undefined = undefined,
  shouldRedirect: boolean = false
) => {
  /* STATE FROM CONTEXT */
  const {
    txState: { transactions, processes },
  } = useContext(TxContext);

  const [txCode, setTxCode] = useState<string>();
  const [txProcess, setTxProcess] = useState<IYieldProcess>();

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

    if (_process) {
      setTxProcess({
        ..._process,
        processActive:
          _process?.stage !== ProcessStage.PROCESS_INACTIVE || _process?.stage !== ProcessStage.PROCESS_COMPLETE,
      });
    }
  }, [processes, txCode, transactions]);

  // 2. If the process has an associated Transaction... get its status
  // useEffect(() => {
  //   processStage === 2 && transactions.has(txHash) && setTxStatus(transactions.get(txHash).status);
  //   processStage === 1 && signatures.has(txHash) && setSigStatus(signatures.get(txHash).status);
  // }, [txHash, transactions, processStage, signatures]);

  // 5. If the transaction has an associated receipt, add it to the

  // useEffect(() => {
  //   transactions.has(txHash) && setTxProcess((t) => ({ ...t, receipt: transactions.get(txHash).receipt }));
  // }, [txHash, transactions]);

  // WATCH and set if the txStatus changes
  // useEffect(() => {
  //   setTxProcess((t) => ({ ...t, txCode, processStage }));
  //   switch (txStatus) {
  //     case TxState.PENDING:
  //       setTxProcess((t) => ({ ...t, txStatus: 'PENDING', txHash, processStage }));
  //       break;
  //     case TxState.SUCCESSFUL:
  //       setTxProcess((t) => ({ ...t, txStatus: 'SUCCESS', processStage }));
  //       break;
  //     case TxState.FAILED:
  //       setTxProcess((t) => ({ ...t, txStatus: 'FAILED', processStage }));
  //       break;
  //     case TxState.REJECTED:
  //       setTxProcess((t) => ({ ...t, txStatus: 'REJECTED', processStage }));
  //       break;
  //   }
  // }, [txCode, processStage, txStatus, txHash]);

  // useEffect(() => {
  //   txProcess.txStatus === 'SUCCESS' && shouldRedirect && history.push('/') && userActions.setSelectedVault(null);
  // }, [txProcess.txStatus, shouldRedirect, history, userActions]);

  // // get the vault id after borrowing or the lend/pool position id's
  // useEffect(() => {
  //   const pathPrefix = txCode && getPositionPathPrefix(txCode!);

  //   if (txCode?.includes(ActionCodes.BORROW) && txProcess.receipt) {
  //     const vaultId = getVaultIdFromReceipt(txProcess.receipt, contractMap);
  //     setTxProcess((t) => ({ ...t, positionPath: `${pathPrefix}/${vaultId}` }));
  //   } else if (txCode?.includes(ActionCodes.BORROW) && !txProcess.receipt) {
  //     setTxProcess((t) => ({ ...t, positionPath: undefined }));
  //   } else {
  //     const positionId = txCode && txCode.split('_')[1];
  //     setTxProcess((t) => ({ ...t, positionPath: `${pathPrefix}/${positionId}` }));
  //   }
  // }, [transactions, contractMap, txCode, txHash, txProcess.receipt]);

  const resetProcess = () => null;

  return { txProcess, resetProcess };
};
