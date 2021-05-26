import React, { useReducer, useEffect } from 'react';
import { ethers, ContractTransaction } from 'ethers';
import { toast } from 'react-toastify';
import { ISignData } from '../types';

const TxContext = React.createContext<any>({});

const initState = {

  /* transaction lists */
  signatures: new Map([]) as Map<string, IYieldSignature>,
  transactions: new Map([]) as Map<string, IYieldTx>,
  processes: [] as string[],

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
  status: 'pending'| 'success' | 'rejected' | 'failed';
}

interface IYieldTx extends ContractTransaction {
  id: string;
  txCode: string;
  receipt: any|null;
  status: 'pending'| 'success' | 'rejected' | 'failed'
}

function txReducer(_state:any, action:any) {
  /* Helper: only change the state if different from existing */
  const _onlyIfChanged = (_action: any) => (
    _state[action.type] === _action.payload
      ? _state[action.type]
      : _action.payload
  );

  /* Reducer switch */
  switch (action.type) {
    case 'transactions':
      return {
        ..._state,
        transactions: new Map(_state.transactions.set(action.payload.tx.hash, action.payload)),
      };
    case 'signatures':
      return {
        ..._state,
        signatures: new Map(_state.signatures.set(action.payload.txCode, action.payload)),
      };
    case '_startProcess':
      return {
        ..._state,
        processes:
          !(_state.processes.indexOf(action.payload) > -1)
            ? [..._state.processes, action.payload]
            : _state.processes,
      };
    case '_endProcess':
      return {
        ..._state,
        processes:
          _state.processes.filter((x:any) => x.txCode === action.payload),
      };

    /* optionally remove these and use the logic at the compoennts?  - check refreshes */
    case 'txPending': return { ..._state, txPending: _onlyIfChanged(action) };
    case 'signPending': return { ..._state, signPending: _onlyIfChanged(action) };
    case 'processPending': return { ..._state, processPending: _onlyIfChanged(action) };

    default:
      return _state;
  }
}

const TxProvider = ({ children }:any) => {
  const [txState, updateState] = useReducer(txReducer, initState);

  /* handle case when user or wallet rejects the tx (before submission) */
  const _handleTxRejection = (err:any, txCode:string) => {
    updateState({ type: '_endProcess', payload: txCode });
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
  const _handleTxError = (msg:string, tx: any, txCode:any) => {
    toast.error(msg);
    updateState({ type: 'transactions', payload: { tx, txCode, receipt: undefined, status: 'failure' } });
    updateState({ type: '_endProcess', payload: txCode });
    console.log('txHash: ', tx.hash);
    console.log('txCode: ', txCode);
  };

  /* handle an error from a tx that was successfully submitted */
  const _handleSignError = (msg:string, receipt: any, txError:any) => {
  };

  /* Handle a tx */
  const handleTx = async (
    txFn:()=>Promise<any>,
    txCode:string,
    _isfallback:boolean = false,
  ) : Promise<ethers.ContractReceipt|null> => {
    /* start a new process */
    updateState({ type: '_startProcess', payload: txCode });
    let tx: ContractTransaction;
    let res: any;
    try {
      /* try the transaction with connected wallet and catch any 'pre-chain'/'pre-tx' errors */
      try {
        tx = await txFn();
        updateState({ type: 'transactions', payload: { tx, txCode, receipt: null, status: 'pending' } });
      } catch (e) {
        /* this case is when user rejects tx OR wallet rejects tx */
        _handleTxRejection(e, txCode);
        return null;
      }

      res = await tx.wait();
      const txSuccess: boolean = res.status === 1 || false;
      updateState({ type: 'transactions', payload: { tx, txCode, receipt: res, status: txSuccess ? 'success' : 'failure' } });

      /* if the handleTx is NOT a fallback tx (from signing) - then end the process */
      if (!_isfallback) {
        /* transaction completion : success OR failure */
        txSuccess ? toast.success('Transaction successfull') : toast.error('Transaction failed :| ');
        updateState({ type: '_endProcess', payload: txCode });
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
    signFn:()=>Promise<any>,
    fallbackFn:()=>Promise<any>,
    sigData: ISignData,
    txCode: string,
  ) => {
    const uid = ethers.utils.hexlify(ethers.utils.randomBytes(6));
    updateState({ type: '_startProcess', payload: txCode });
    updateState({ type: 'signatures', payload: { uid, txCode, sigData, status: 'pending' } as IYieldSignature });
    const _sig = await signFn()
      .catch((err:any) => {
        console.log(err);
        updateState({ type: 'signatures', payload: { uid, txCode, sigData, status: 'rejected' } as IYieldSignature });
        /* end the process on signature rejection */
        updateState({ type: '_endProcess', payload: txCode });
        return Promise.reject(err);
      });
    updateState({ type: 'signatures', payload: { uid, txCode, sigData, status: 'success' } as IYieldSignature });
    console.log(_sig);
    return _sig;
  };

  /* process watcher */
  useEffect(() => {
    console.log('Process list: ', txState.processes);
    (txState.processes.length > 0)
      ? updateState({ type: 'processPending', payload: true })
      : updateState({ type: 'processPending', payload: false });
  }, [txState.processes]);

  /* signing watcher */
  useEffect(() => {
    const _isSignPending = Array.from(txState.signatures.values()).findIndex((x:any) => x.status === 'pending') > -1;
    updateState({
      type: 'signPending',
      payload: _isSignPending });
  }, [txState.signatures]);

  /* tx watcher */
  useEffect(() => {
    const _isTxPending = Array.from(txState.transactions.values()).findIndex((x:any) => x.status === 'pending') > -1;
    updateState({
      type: 'txPending',
      payload: _isTxPending });
  }, [txState.transactions]);

  /* expose the required actions */
  const txActions = {
    handleTx,
    handleSign,
  };

  return (
    <TxContext.Provider value={{ txState, txActions }}>
      {children}
    </TxContext.Provider>
  );
};

export { TxContext, TxProvider };
