import React, { useReducer, useEffect } from 'react';
import { ethers, ContractTransaction } from 'ethers';
import { toast } from 'react-toastify';
import { ApprovalType, ISignData, TxState } from '../types';

const TxContext = React.createContext<any>({});

const initState = {
  /* transaction lists */
  signatures: new Map([]) as Map<string, IYieldSignature>,
  transactions: new Map([]) as Map<string, IYieldTx>,
  processes: new Map([]) as Map<string, IYieldProcess>,

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
  complete?: boolean;
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

    default:
      return _state;
  }
}

const TxProvider = ({ children }: any) => {
  const [txState, updateState] = useReducer(txReducer, initState);

  const _startProcess = (txCode: string) => {
    updateState({
      type: 'processes',
      payload: { txCode, status: 'ACTIVE' },
    });
  };

  const _endProcess = (txCode: string) => {
    updateState({
      type: 'processes',
      payload: { txCode, status: 'INACTIVE', hash: undefined },
    });
  };

  const _handleTxComplete = (tx: any) => {
    setTimeout(() => {
      updateState({ type: 'transactions', payload: { ...tx, complete: true } });
    }, 10000);
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
  };

  /* handle an error from a tx that was successfully submitted */
  const _handleTxError = (msg: string, tx: any, txCode: any) => {
    _endProcess(txCode);
    toast.error(msg);
    const _tx = { tx, txCode, receipt: undefined, status: TxState.FAILED };
    updateState({ type: 'transactions', payload: _tx });
    _handleTxComplete(_tx);
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

    // google analytics sent txCode

    /* start a new process (over-write if it has been started already) */
    _startProcess(txCode);
    console.log(txState.processes);

    try {
      /* try the transaction with connected wallet and catch any 'pre-chain'/'pre-tx' errors */
      try {
        tx = await txFn();
        console.log(tx);
        updateState({ type: 'transactions', payload: { tx, txCode, receipt: null, status: TxState.PENDING } });
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
      _handleTxComplete(_tx);

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
    /* start a process */
    _startProcess(txCode);
    console.log(txState.processes);

    const uid = ethers.utils.hexlify(ethers.utils.randomBytes(6));
    updateState({ type: 'signatures', payload: { uid, txCode, sigData, status: TxState.PENDING } as IYieldSignature });

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
