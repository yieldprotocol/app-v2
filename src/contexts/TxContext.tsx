import React, {
  useState, useContext, useEffect, useReducer,
} from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

const TxContext = React.createContext<any>({});

const initState = {
  requestedSigs: [] as IYieldSig[],
  pendingTxs: [] as IYieldTx[],
  currentTxs: [] as IYieldTx[],
  lastCompletedTx: null as IYieldTx | null,
  useFallbackTxs: false,
};

interface IYieldSig {
  sigId: string;
}

interface IYieldTx extends ethers.Transaction {
  txId: string;
}

function txReducer(state:any, action:any) {
  switch (action.type) {
    case 'setTxProcessActive':
      return {
        ...state,
        /* set tthe current active process */
        txProcessActive: action.payload.txCode,
        /* set the list of sigs required for the current process */
        requestedSigs: action.payload.sigs.map((x:any) => ({ ...x })),
      };
    case 'txPending':
      return {
        ...state,
        /* add the tx to the list of pending txs */
        pendingTxs: [...state.pendingTxs, action.payload],
      };
    case 'forceClear':
      return {
        ...state,
        /* add the tx to the list of pending txs */
        pendingTxs: [],
        txProcessActive: null,
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
          transactionHash: action.payload.receipt.transactionHash || action.payload.receipt.hash 
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
  const handleRejection = (error:any) => {
    /* If user cancelled/rejected the tx, then silence the errors */
    if (error.code === 4001) {
      toast.warning('Transaction rejected by user');
    } else {
      /* Else, the transaction was cancelled by the wallet provider */
      toast.error('The transaction was rejected by the wallet provider. Please see console');

      // eslint-disable-next-line no-console
      console.log(error.message);
    }

    /* handle an error from a tx that was successfully submitted */
    const handleTxError = (msg:string, receipt: any, error:any) => {
    };

    /* handle a tx */
    const handleTx = async (tx:any) => {
    };

    /* handle a sig */
    const handleSig = async () => {
    };
  };

  const txActions = {
    // handleTx: () => handleTx('some tx'),
    // handleSig: () => handleSig(),
  };

  return (
    <TxContext.Provider value={{ txState, txActions }}>
      {children}
    </TxContext.Provider>
  );
};

export { TxContext, TxProvider };
