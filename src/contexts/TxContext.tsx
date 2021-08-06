import React, { useReducer, useEffect } from 'react';
import { ethers, ContractTransaction } from 'ethers';
import { toast } from 'react-toastify';
import { ApprovalType, ISignData, TxState } from '../types';

const TxContext = React.createContext<any>({});

const initState = {
  /* transaction lists */
  signatures: new Map([]) as Map<string, IYieldSignature>,
  transactions: new Map([]) as Map<string, IYieldTx>,
  processes: new Map([]) as Map<string, string>,

  /* flags and trackers */
  txPending: false as boolean,
  signPending: false as boolean,
  processPending: false as boolean,

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

function txReducer(_state: any, action: any) {
  /* Helper: only change the state if different from existing */
  const _onlyIfChanged = (_action: any) =>
    _state[action.type] === _action.payload ? _state[action.type] : _action.payload;

  /* Helper: remove process  */ // TODO  find a better way to do this
  const _removeProcess = (_txCode: any) => {
    const mapClone = new Map(_state.processes);
    return mapClone.delete(_txCode) ? mapClone : _state.processes;
  };

  /* Reducer switch */
  switch (action.type) {
    case 'transactions':
      return {
        ..._state,
        transactions: new Map(_state.transactions.set(action.payload.tx.hash, action.payload)),
        // also update processes with tx hash:
        processes: new Map(_state.processes.set(action.payload.txCode, action.payload.tx.hash)),
      };
    case 'signatures':
      return {
        ..._state,
        signatures: new Map(_state.signatures.set(action.payload.txCode, action.payload)),
      };
    case '_startProcess':
      return {
        ..._state,
        processes: _state.processes.set(action.payload.txCode, action.payload.hash),
        // !(_state.processes.indexOf(action.payload) > -1)
        //   ? [..._state.processes, action.payload]
        //   : _state.processes,
        processPending: true,
      };
    case '_endProcess':
      return {
        ..._state,
        processes: _removeProcess(action.payload),
        // _state.processes.filter((x:any) => x.txCode === action.payload),
        processPending: false,
      };

    /* optionally remove these and use the logic at the compoennts?  - check refreshes */
    case 'txPending':
      return { ..._state, txPending: _onlyIfChanged(action) };
    case 'signPending':
      return { ..._state, signPending: _onlyIfChanged(action) };
    case 'processPending':
      return { ..._state, processPending: _onlyIfChanged(action) };

    default:
      return _state;
  }
}

const TxProvider = ({ children }: any) => {
  const [txState, updateState] = useReducer(txReducer, initState);

  const _startProcess = (txCode: string) => {
    updateState({ type: '_startProcess', payload: { txCode, hash: '0x0' } });
  };

  const _endProcess = (txCode: string) => {
    updateState({ type: '_endProcess', payload: txCode });
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
    toast.error(msg);
    updateState({ type: 'transactions', payload: { tx, txCode, receipt: undefined, status: TxState.FAILED } });
    _endProcess(txCode);
    console.log('txHash: ', tx.hash);
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
      updateState({
        type: 'transactions',
        payload: { tx, txCode, receipt: res, status: txSuccess ? TxState.SUCCESSFUL : TxState.FAILED },
      });

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

  // /* Process watcher sets the 'any process pending'flag */
  // useEffect(() => {
  //   console.log('Process list: ', txState.processes);
  //   Array.from(txState.processes.values()).length > 0
  //     ? updateState({ type: 'processPending', payload: true })
  //     : updateState({ type: 'processPending', payload: false });
  // }, [txState.processes]);

  /* Signing watcher */
  useEffect(() => {
    const _isSignPending =
      Array.from(txState.signatures.values()).findIndex((x: any) => x.status === TxState.PENDING) > -1;
    updateState({
      type: 'signPending',
      payload: _isSignPending,
    });
  }, [txState.signatures]);

  /* Tx watcher */
  useEffect(() => {
    const _isTxPending =
      Array.from(txState.transactions.values()).findIndex((x: any) => x.status === TxState.PENDING) > -1;
    updateState({
      type: 'txPending',
      payload: _isTxPending,
    });
  }, [txState.transactions]);

  /* expose the required actions */
  const txActions = {
    handleTx,
    handleSign,
  };

  return <TxContext.Provider value={{ txState, txActions }}>{children}</TxContext.Provider>;
};

export { TxContext, TxProvider };
