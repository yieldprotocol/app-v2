import React, {
  useState, useContext, useEffect, useReducer,
} from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

const TxContext = React.createContext<any>({});

const initState = {
  pendingSigs: [] as IYieldSignature[],
  pendingTxs: [] as IYieldTx[],
  currentProcesses: [] as IYieldProcess[],
  lastCompletedTx: null as IYieldTx | null,
  useFallbackTxs: false,
};

/* yieldProcesses are collections of txs and signatures that are tracked together */
interface IYieldProcess {
  pid: string;
  sigs: IYieldSignature[];
  txs: IYieldTx[];
  status: Status;
}

enum Status {
  waiting = 0,
  success = 1,
  failed = 2,
}

interface IYieldSignature {
  id: string;
  status: Status;
  pid?:number|null;
}

interface IYieldTx extends ethers.Transaction {
  id: string;
  pid?: number|null;
}

function txReducer(state:any, action:any) {
  switch (action.type) {
    case 'newProcess':
      return {
        ...state,
        /* set tthe current active process */
        currentProcesses: action.payload.process,
        /* set the list of sigs required for the current process */
        requestedSigs: action.payload.sigs.map((x:any) => ({ ...x })),
      };
    case 'updateProcess':
      return {
        ...state,
        /* add the tx to the list of pending txs */
        pendingTxs: [...state.pendingTxs, action.payload],
      };
    case 'txComplete':
      return {
        ...state,
        /* remove the tx from the pending tx list */
        pendingTxs: state.pendingTxs
          .filter((x:any) => x.tx.hash !== (action.payload.receipt.transactionHash || action.payload.receipt.hash)),
        /* set the last completed tx to the one just finished */
        lastCompletedTx: {
          ...action.payload.receipt,
          transactionHash: action.payload.receipt.transactionHash || action.payload.receipt.hash,
        },
        /* if the txCode is the same as the current activeProcces,. then reset that process */
        txProcessActive: (action.payload.txCode === state?.txProcessActive) ? null : state?.txProcessActive,
      };
    case 'setFallbackActive':
      return {
        ...state,
        fallbackActive: action.payload,
      };
    case 'signed':
      return {
        ...state,
        /* mark the signature as signed */
        requestedSigs: state.requestedSigs.map((x:any) => {
          if (x.id === action.payload.id) {
            return { ...x, signed: true };
          } return x;
        }),
      };
    default:
      return state;
  }
}

const TxProvider = ({ children }:any) => {
  const [txState, updateState] = useReducer(txReducer, initState);

  /* action on successfull or failed transaction */
  const txComplete = () => {
  };

  /* handle case when user or wallet rejects the tx (before submission) */
  const handleTxRejection = (err:any) => {
    /* If user cancelled/rejected the tx */
    if (err.code === 4001) {
      toast.warning('Transaction rejected by user');
    } else {
      /* Else, the transaction was cancelled by the wallet/provider before getting submitted */
      try {
        toast.error(`${err.data.message.split('VM Exception while processing transaction: revert').pop()}`);
        console.log(err);
      } catch (e) { console.log(err); }
    }
  };

  /* handle an error from a tx that was successfully submitted */
  const handleTxError = (msg:string, receipt: any, txError:any) => {
  };

  /* handle a tx */
  const handleTx = async (tx:any, pid:number) => {
    console.log(tx, pid);
  };

  /* handle a tx */
  const handleProcess = async () => {

  };

  /* handle a sig */
  const handleSignature = async (tx:any, pid:number) => {

  };

  const txActions = {
    handleTx: (x:any) => handleTx(x, 1),
    handleSignature: () => handleSignature('sdfsd', 1),
    // handleProcess: (pid:number, actions: any[]) => console.log(3),
    handleTxRejection: (e:any) => handleTxRejection(e),
  };

  return (
    <TxContext.Provider value={{ txState, txActions }}>
      {children}
    </TxContext.Provider>
  );
};

export { TxContext, TxProvider };
