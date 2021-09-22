import React, { useReducer, useEffect, useState } from 'react';
import { ethers, ContractTransaction } from 'ethers';
import { toast } from 'react-toastify';
import { ApprovalType, ISignData, TxState, ProcessStage, IYieldProcess } from '../types';

const TxContext = React.createContext<any>({});

const initState = {
  /* transaction lists */
  signatures: new Map([]) as Map<string, IYieldSignature>,
  transactions: new Map([]) as Map<string, IYieldTx>,
  processes: new Map([]) as Map<string, IYieldProcess>,

  /* process active flags for convenience */
  anyProcessActive: false as boolean,

  /* user settings */
  useFallbackTxs: false as boolean,
};

interface IYieldSignature {
  uid: string;
  txCode: string;
  sigData: ISignData;
  status: TxState;
}

interface IYieldTx extends ContractTransaction {
  txCode: string;
  receipt: any | null;
  status: TxState;
}

function txReducer(_state: any, action: any) {
  /* Helper: only change the state if different from existing */
  const _onlyIfChanged = (_action: any) =>
    _state[action.type] === _action.payload ? _state[action.type] : _action.payload;

  /* Reducer switch */
  switch (action.type) {
    case 'transactions':
      return {
        ..._state,
        transactions: new Map(_state.transactions.set(action.payload.tx.hash, action.payload)),
        // also update processes with tx info:
        processes: new Map(
          _state.processes.set(action.payload.txCode, {
            ..._state.processes.get(action.payload.txCode),
            txHash: action.payload.tx.hash,
            tx: action.payload,
          })
        ) as Map<string, IYieldProcess>,
      };

    case 'processes':
      return {
        ..._state,
        processes: new Map(
          _state.processes.set(action.payload.txCode, {
            ..._state.processes.get(action.payload.txCode),
            txCode: action.payload.txCode,
            stage: action.payload.stage,
            processActive: action.payload.stage !== 0 || action.payload.stage !== 6 || action.payload.stage !== 7,
          })
        ) as Map<string, IYieldProcess>,
      };

    case 'resetProcess':
      return {
        ..._state,
        processes: new Map(
          _state.processes.set(action.payload, {
            txCode: action.payload,
            stage: 0,
            processActive: false,
          })
        ),
      };

    case 'processActive':
      return {
        ..._state,
        processActive: _onlyIfChanged(action),
      };

    default:
      return _state;
  }
}

const TxProvider = ({ children }: any) => {
  const [txState, updateState] = useReducer(txReducer, initState);

  const [terminateProcessTimer, setTerminateProcessTimer] = useState<Map<string, boolean>>();
  const [processTimer, setProcessTimer] = useState<Map<string, boolean>>();

  const _setProcessStage = (txCode: string, stage: ProcessStage) => {
    updateState({
      type: 'processes',
      payload: { txCode, stage },
    });
  };

  const _resetProcess = (txCode: string) => updateState({ type: 'resetProcess', payload: txCode });

  const _startProcessTimer = async (txCode: string) => {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    _setProcessStage(txCode, ProcessStage.PROCESS_COMPLETE_TIMEOUT);
  };

  /* handle case when user or wallet rejects the tx (before submission) */
  const _handleTxRejection = (err: any, txCode: string) => {
    _resetProcess(txCode);
    /* If user cancelled/rejected the tx */
    if (err.code === 4001) {
      toast.warning('Transaction rejected by user');
    } else {
      /* Else, the transaction was cancelled by the wallet/provider before getting submitted */
      try {
        toast.error(`${err.data.message.split('VM Exception while processing transaction: revert').pop()}`);
        console.log(err);
      } catch (e) {
        // toast.error(`${err.data.message.split('VM Exception while processing transaction: revert').pop()}`);
        console.log('Something went wrong: ', err);
      }
    }
  };

  /* handle an error from a tx that was successfully submitted */
  const _handleTxError = (msg: string, tx: any, txCode: any) => {
    // _setProcessStage(txCode, ProcessStage.PROCESS_INACTIVE);
    // updateState({ type: 'resetProcess', payload: txCode })
    _setProcessStage(txCode, ProcessStage.PROCESS_COMPLETE);
    toast.error(msg);
    const _tx = { tx, txCode, receipt: undefined, status: TxState.FAILED };
    updateState({ type: 'transactions', payload: _tx });
    console.log('txHash: ', tx?.hash);
    console.log('txCode: ', txCode);
  };

  /* Handle a tx */
  const handleTx = async (
    txFn: () => Promise<any>,
    txCode: string,
    _isfallback: boolean = false
  ): Promise<ethers.ContractReceipt | null> => {
    let tx: ContractTransaction;
    let res: any;

    /* update process if not fallback Transaction */
    !_isfallback && _setProcessStage(txCode, ProcessStage.TRANSACTION_REQUESTED);

    try {
      /* try the transaction with connected wallet and catch any 'pre-chain'/'pre-tx' errors */
      try {
        tx = await txFn();
        console.log('TX: ', tx);
        updateState({ type: 'transactions', payload: { tx, txCode, receipt: null, status: TxState.PENDING } });
        _setProcessStage(
          txCode,
          _isfallback ? ProcessStage.SIGNING_TRANSACTION_PENDING : ProcessStage.TRANSACTION_PENDING
        );
      } catch (e) {
        /* this case is when user rejects tx OR wallet rejects tx */
        _handleTxRejection(e, txCode);
        return null;
      }

      res = await tx.wait();
      const txSuccess: boolean = res.status === 1 || false;
      const _tx = { tx, txCode, receipt: res, status: txSuccess ? TxState.SUCCESSFUL : TxState.FAILED };
      updateState({
        type: 'transactions',
        payload: _tx,
      });

      /* if the handleTx is NOT a fallback tx (from signing) - then end the process */
      if (_isfallback === false) {
        /* transaction completion : success OR failure */
        txSuccess ? toast.success('Transaction successfull') : toast.error('Transaction failed :| ');
        _setProcessStage(txCode, ProcessStage.PROCESS_COMPLETE);
        return res;
      }
      /* this is the case when the tx was a fallback from a permit/allowance tx */
      _setProcessStage(txCode, ProcessStage.SIGNING_COMPLETE);
      return res;
    } catch (e: any) {
      /* catch tx errors */
      _handleTxError('Transaction failed', e.transaction, txCode);
      return null;
    }
  };

  // const handlePreProcess = (txCode:string) => _setProcessStage(txCode, ProcessStage.PROCESS_CONFIRMATION);

  /* handle a sig and sig fallbacks */
  /* returns the tx id to be used in handleTx */
  const handleSign = async (
    signFn: () => Promise<any>,
    fallbackFn: () => Promise<any>,
    sigData: ISignData,
    txCode: string,
    approvalMethod: ApprovalType
  ) => {
    /* start a process */
    _setProcessStage(txCode, ProcessStage.SIGNING_REQUESTED);

    let _sig;
    if (approvalMethod === ApprovalType.SIG) {
      _sig = await signFn().catch((err: any) => {
        console.log(err);
        /* end the process on signature rejection */
        _resetProcess(txCode);
        return Promise.reject(err);
      });
    } else {
      await fallbackFn().catch((err: any) => {
        console.log(err);
        /* end the process on signature rejection */
        _resetProcess(txCode);
        return Promise.reject(err);
      });
      /* on Completion of approval tx, send back an empty signed object (which will be ignored) */
      _sig = {
        v: undefined,
        r: undefined,
        s: undefined,
        value: undefined,
        deadline: undefined,
        nonce: undefined,
        expiry: undefined,
        allowed: undefined,
      };
    }

    _setProcessStage(txCode, ProcessStage.SIGNING_COMPLETE);
    return _sig;
  };

  /* Simple process watcher for any active Process */
  useEffect(() => {
    if (txState.processes.size) {
      /* 1. watch for any active process */
      const _processes: IYieldProcess[] = Array.from(txState.processes.values());
      const hasActiveProcess = _processes.some(
        (x: any) => x.stage === 1 || x.stage === 2 || x.stage === 3 || x.stage === 4 || x.stage === 5
      );
      updateState({ type: 'processActive', payload: hasActiveProcess });

      /* 2. Set timer on process complete */
      _processes.forEach((p: IYieldProcess) => {
        p.stage === ProcessStage.PROCESS_COMPLETE && p.tx.status === TxState.SUCCESSFUL && _startProcessTimer(p.txCode);
      });
    }
  }, [txState.processes]);

  /* expose the required actions */
  const txActions = {
    handleTx,
    handleSign,
    resetProcess: (txCode: string) => updateState({ type: 'resetProcess', payload: txCode }),
    updateTxStage: (txCode: string, stage: ProcessStage) =>
      updateState({ type: 'processes', payload: { ...txState.processes.get(txCode), stage } }),
  };

  return <TxContext.Provider value={{ txState, txActions }}>{children}</TxContext.Provider>;
};

export { TxContext, TxProvider };
