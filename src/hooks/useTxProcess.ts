import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, TxState } from '../types';
import { getTxCode, getPositionPathPrefix, getVaultIdFromReceipt } from '../utils/appUtils';

interface ITx {
  txCode: any;
  txStatus: 'PENDING' | 'SUCCESS' | 'FAILED'| 'REJECTED'| undefined; 
  sigStatus: 'PENDING' | 'SUCCESS' | 'FAILED'| 'REJECTED' | undefined;
  processStage: number;
  txHash: any;
  positionPath: string | undefined;
  receipt: any | undefined;
}

/* useTx hook returns the tx status, and redirects to home after success if shouldRedirect is specified */
/* the return tx looks like any object of {txCode, isPending, isSuccess, isFailed, isRejected} */
export const useTxProcess = (
  actionCode: ActionCodes | undefined,
  seriesOrVaultId: string | undefined,
  transactionCode: string | undefined = undefined,
  shouldRedirect: boolean = false
) => {

  /* STATE FROM CONTEXT */
  const {
    txState: { transactions, processes, signatures },
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
    processStage: 0,
    txStatus: undefined,
    sigStatus: undefined,
    txHash: undefined,
    positionPath: undefined,
    receipt: undefined,
  };

  const [txProcess, setTxProcess] = useState<ITx>(INITIAL_STATE);
  const [txCode, setTxCode] = useState<string>();
  const [txHash, setTxHash] = useState<string>();

  const [txStatus, setTxStatus] = useState<TxState>();
  const [sigStatus, setSigStatus] = useState<TxState>();

  const [processStage, setProcessStage] = useState<number>(0);

  const resetTx = () => {
    setTxProcess(INITIAL_STATE);
    setTxHash(undefined);
    setTxStatus(undefined);
    setProcessStage(0);
  };

  // 1. Set the transaction code from provided... or based on seriesId and actionCode 
  useEffect(() => {
    if (transactionCode) {
      setTxCode(transactionCode);
     } else {
      (actionCode && seriesOrVaultId) ? setTxCode(getTxCode(actionCode, seriesOrVaultId)) : setTxCode(undefined);
     }
  }, [actionCode, seriesOrVaultId, transactionCode]);

  // 2.1 Get the txHash (if there is one)
  useEffect(() => {
    txCode && setTxHash(processes.get(txCode!)?.hash!);
  }, [processes, txCode, processStage]);

  // 3. Check/set if the process is active or not
  useEffect(() => {
    txCode && 
    processes.has(txCode) &&  
    setProcessStage( processes.get(txCode).stage )
  }, [processes, txCode]);

  // 4. If the process has an associated Transaction... get its status
  useEffect(() => {

    processStage === 2 && transactions.has(txHash) && setTxStatus(transactions.get(txHash).status);
    processStage === 1 && signatures.has(txHash) && setSigStatus(signatures.get(txHash).status);

  }, [txHash, transactions, processStage, signatures]);

  // 5. If the transaction has an associated receipt, add it to the  
  useEffect(() => {
    transactions.has(txHash) && setTxProcess((t) => ({ ...t, receipt: transactions.get(txHash).receipt }));
  }, [txHash, transactions]);

  // WATCH and set if the txStatus changes 
  useEffect(() => {
    setTxProcess((t) => ({ ...t, txCode, processStage }));
    switch (txStatus) {
      case TxState.PENDING:
        setTxProcess((t) => ({ ...t, txStatus: 'PENDING', txHash, processStage }));
        break;
      case TxState.SUCCESSFUL:
        setTxProcess((t) => ({ ...t, txStatus: 'SUCCESS', processStage }));
        break;
      case TxState.FAILED:
        setTxProcess((t) => ({ ...t, txStatus: 'FAILED', processStage }));
        break;
      case TxState.REJECTED:
        setTxProcess((t) => ({ ...t, txStatus:'REJECTED', processStage }));
        break;
    }
  }, [txCode, processStage, txStatus, txHash]);

  // // WATCH and set if the sigStatus changes 
  // useEffect(() => {
  //   setTxProcess((t) => ({ ...t, txCode, processActive }));
  //   switch (sigStatus) {
  //     case TxState.PENDING:
  //       setTxProcess((t) => ({ ...t, sigStatus: 'PENDING', processActive }));
  //       break;
  //     case TxState.SUCCESSFUL:
  //       setTxProcess((t) => ({ ...t, sigStatus: 'SUCCESS', processActive }));
  //       break;
  //     case TxState.FAILED:
  //       setTxProcess((t) => ({ ...t, sigStatus: 'FAILED', processActive }));
  //       break;
  //     case TxState.REJECTED:
  //       setTxProcess((t) => ({ ...t, sigStatus: 'REJECTED', processActive }));
  //       break;
  //   }
  // }, [txCode, processActive, sigStatus, txHash]);

  useEffect(() => {
    txProcess.txStatus === 'SUCCESS' && shouldRedirect && history.push('/') && userActions.setSelectedVault(null);
  }, [txProcess.txStatus, shouldRedirect, history, userActions]);

  // get the vault id after borrowing or the lend/pool position id's
  useEffect(() => {
    const pathPrefix = txCode && getPositionPathPrefix(txCode!);

    if (txCode?.includes(ActionCodes.BORROW) && txProcess.receipt) {
      const vaultId = getVaultIdFromReceipt(txProcess.receipt, contractMap);
      setTxProcess((t) => ({ ...t, positionPath: `${pathPrefix}/${vaultId}` }));
    } else if (txCode?.includes(ActionCodes.BORROW) && !txProcess.receipt) {
      setTxProcess((t) => ({ ...t, positionPath: undefined }));
    } else {
      const positionId = txCode && txCode.split('_')[1];
      setTxProcess((t) => ({ ...t, positionPath: `${pathPrefix}/${positionId}` }));
    }
  }, [transactions, contractMap, txCode, txHash, txProcess.receipt]);

  return { txProcess, resetTx };
};
