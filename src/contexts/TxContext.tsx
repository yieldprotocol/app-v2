import React, { useReducer, useEffect, useState } from 'react';
import { ethers, ContractTransaction, constants } from 'ethers';
import { toast } from 'react-toastify';
import { ApprovalType, ISignData, TxState, ITransactions_ } from '../types';

const TxContext = React.createContext<any>({});

const initState = {
  /* transaction lists */
  signatures: new Map([]) as Map<string, IYieldSignature>,
  transactions: new Map([]) as Map<string, IYieldTx>,
  processes: new Map([]) as Map<string, IYieldProcess>,

  /* using the useTx hook to map tx hashes to tx data */
  transactions_: new Map([]) as Map<number, any>,

  /* process active flags for convenience */
  processActive: false as boolean,

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
  id: string;
  txCode: string;
  receipt: any | null;
  status: TxState;
}

interface IYieldProcess {
  status: 'ACTIVE|INACTIVE';
  hash?: string | undefined;
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
        // also update processes with tx hash:
        processes: new Map(
          _state.processes.set(action.payload.txCode, {
            ..._state.processes.get(action.payload.txCode),
            hash: action.payload.tx.hash,
          })
        ),
      };
    case 'signatures':
      return {
        ..._state,
        signatures: new Map(_state.signatures.set(action.payload.txCode, action.payload)),
      };

    case 'processes':
      return {
        ..._state,
        processes: new Map(
          _state.processes.set(action.payload.txCode, {
            ..._state.processes.get(action.payload.txCode),
            status: action.payload.status,
            hash: action.payload.hash,
          })
        ),
      };

    case 'processActive':
      return {
        ..._state,
        processActive: _onlyIfChanged(action),
      };

    case 'signingActive':
      return {
        ..._state,
        signingActive: _onlyIfChanged(action),
      };

    /* handling setting a tx in transaction_ state */
    case 'transactions_':
      return {
        ..._state,
        transactions_: new Map(
          _state.transactions_.set(action.payload.txId, {
            ..._state.transactions_.get(action.payload.txId),
            ...action.payload,
          })
        ),
      };

    default:
      return _state;
  }
}

const TxProvider = ({ children }: any) => {
  const [txState, updateState] = useReducer(txReducer, initState);

  let txId: any;
  const _addTx = (txCode: string) => {
    txId = ethers.utils.hexlify(ethers.utils.randomBytes(6));
    updateState({
      type: 'transactions_',
      payload: { txId, txCode, active: true, primaryInfo: `${txCode.split('_')[0]}` },
    });
    return txId;
  };

  // the tx is active if it is not complete (success, failed, rejected)
  const _endTx = () => {
    const timer = setTimeout(
      () =>
        updateState({
          type: 'transactions_',
          payload: { txId, complete: true, active: false },
        }),
      5000
    );
    return () => clearTimeout(timer);
  };

  const _startProcess = (txCode: string) => {
    updateState({
      type: 'processes',
      payload: { txCode, status: 'ACTIVE' },
    });

    updateState({
      type: 'transactions_',
      payload: { txId, processActive: true },
    });
  };

  const _endProcess = (txCode: string) => {
    updateState({
      type: 'processes',
      payload: { txCode, status: 'INACTIVE', hash: undefined },
    });

    updateState({
      type: 'transactions_',
      payload: { txId, processActive: false },
    });
  };

  /* handle case when user or wallet rejects the tx (before submission) */
  const _handleTxRejection = (err: any, txCode: string) => {
    _endProcess(txCode);
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

    updateState({
      type: 'transactions_',
      payload: { txId, active: false },
    });
    _endTx();
  };

  /* handle an error from a tx that was successfully submitted */
  const _handleTxError = (msg: string, tx: any, txCode: any) => {
    _endProcess(txCode);
    toast.error(msg);
    updateState({ type: 'transactions', payload: { tx, txCode, receipt: undefined, status: TxState.FAILED } });
    console.log('txHash: ', tx.hash);
    console.log('txCode: ', txCode);

    updateState({
      type: 'transactions_',
      payload: { txId, failed: true, pending: false },
    });
    _endTx();
  };

  /* Handle a tx */
  const handleTx = async (
    txFn: () => Promise<any>,
    txCode: string,
    _isfallback: boolean = false
  ): Promise<ethers.ContractReceipt | null> => {
    let tx: ContractTransaction;
    let res: any;

    // google analytics sent txCode

    // checking if tx id is not created, useful for when someone doesn't need to sign, so there shouldn't be a tx id yet
    if (!txId) _addTx(txCode);

    /* start a new process (over-write if it has been started already) */
    _startProcess(txCode);
    console.log(txState.processes);

    try {
      /* try the transaction with connected wallet and catch any 'pre-chain'/'pre-tx' errors */
      try {
        tx = await txFn();
        console.log(tx);
        updateState({ type: 'transactions', payload: { tx, txCode, receipt: null, status: TxState.PENDING } });

        updateState({ type: 'transactions_', payload: { txHash: tx.hash, txId, pending: true } });
      } catch (e) {
        /* this case is when user rejects tx OR wallet rejects tx */
        _handleTxRejection(e, txCode);
        return null;
      }

      res = await tx.wait();
      const txSuccess: boolean = res.status === 1 || false;
      updateState({
        type: 'transactions',
        payload: { tx, txCode, receipt: res, status: txSuccess ? TxState.SUCCESSFUL : TxState.FAILED },
      });

      updateState({
        type: 'transactions_',
        payload: { txId, success: txSuccess, pending: false },
      });
      _endTx();

      /* if the handleTx is NOT a fallback tx (from signing) - then end the process */
      if (_isfallback === false) {
        /* transaction completion : success OR failure */
        txSuccess ? toast.success('Transaction successfull') : toast.error('Transaction failed :| ');
        _endProcess(txCode);
        return res;
      }
      /* this is the case when the tx was a fallback from a permit/allowance tx */
      return res;
    } catch (e) {
      /* catch tx errors */
      _handleTxError('Transaction failed', e.transaction, txCode);
      return null;
    }
  };

  /* handle a sig and sig fallbacks */
  /* returns the tx id to be used in handleTx */
  const handleSign = async (
    signFn: () => Promise<any>,
    fallbackFn: () => Promise<any>,
    sigData: ISignData,
    txCode: string,
    approvalMethod: ApprovalType
  ) => {
    _addTx(txCode);

    /* start a process */
    _startProcess(txCode);
    console.log(txState.processes);

    const uid = ethers.utils.hexlify(ethers.utils.randomBytes(6));
    updateState({ type: 'signatures', payload: { uid, txCode, sigData, status: TxState.PENDING } as IYieldSignature });

    updateState({
      type: 'transactions_',
      payload: { txId, signing: true },
    });

    let _sig;
    if (approvalMethod === ApprovalType.SIG) {
      _sig = await signFn().catch((err: any) => {
        console.log(err);
        updateState({
          type: 'signatures',
          payload: { uid, txCode, sigData, status: TxState.REJECTED } as IYieldSignature,
        });
        /* end the process on signature rejection */
        _endProcess(txCode);
        updateState({
          type: 'transactions_',
          payload: { txId, signing: false, active: false },
        });
        return Promise.reject(err);
      });
    } else {
      await fallbackFn().catch((err: any) => {
        console.log(err);
        updateState({
          type: 'signatures',
          payload: { uid, txCode, sigData, status: TxState.REJECTED } as IYieldSignature,
        });
        /* end the process on signature rejection */
        _endProcess(txCode);
        updateState({
          type: 'transactions_',
          payload: { txId, signing: false, active: false },
        });
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

    updateState({
      type: 'signatures',
      payload: { uid, txCode, sigData, status: TxState.SUCCESSFUL } as IYieldSignature,
    });

    updateState({
      type: 'transactions_',
      payload: { txId, signing: false },
    });
    return _sig;
  };

  /* simple process watcher */
  useEffect(() => {
    if (txState.processes.size) {
      const hasActiveProcess = Array.from(txState.processes.values()).some((x: any) => x.status === 'ACTIVE');
      updateState({ type: 'processActive', payload: hasActiveProcess });
    }
  }, [txState.processes]);

  /* expose the required actions */
  const txActions = {
    handleTx,
    handleSign,
  };

  return <TxContext.Provider value={{ txState, txActions }}>{children}</TxContext.Provider>;
};

export { TxContext, TxProvider };
