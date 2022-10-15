import React, { useReducer, useEffect, useContext } from 'react';
import { ethers, ContractTransaction, providers } from 'ethers';
import { toast } from 'react-toastify';
import { ApprovalType, ISignData, TxState, ProcessStage, IYieldProcess } from '../types';
import { ChainContext } from './ChainContext';
import useAnalytics from '../hooks/useAnalytics';
import { GA_Event, GA_Properties } from '../types/analytics';

enum TxStateItem {
  TRANSACTIONS = 'transactions',
  PROCESSES = 'processes',
  RESET_PROCESS = 'resetProcess',
  PROCESS_ACTIVE = 'processActive',
  TX_WILL_FAIL = 'txWillFail',
  TX_WILL_FAIL_INFO = 'txWillFailInfo',
}

const TxContext = React.createContext<any>({});

const initState = {
  /* transaction lists */
  signatures: new Map([]) as Map<string, IYieldSignature>,
  transactions: new Map([]) as Map<string, IYieldTx>,
  processes: new Map([]) as Map<string, IYieldProcess>,

  /* process active flags for convenience */
  anyProcessActive: false as boolean,
  txWillFail: false as boolean,

  txWillFailInfo: { error: undefined, transaction: undefined, blocknum: undefined },
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
    case TxStateItem.TRANSACTIONS:
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

    case TxStateItem.PROCESSES:
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

    case TxStateItem.RESET_PROCESS:
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

    case TxStateItem.PROCESS_ACTIVE:
      return {
        ..._state,
        processActive: _onlyIfChanged(action),
      };

    case TxStateItem.TX_WILL_FAIL:
      return {
        ..._state,
        txWillFail: _onlyIfChanged(action),
      };

    case TxStateItem.TX_WILL_FAIL_INFO:
      return {
        ..._state,
        txWillFailInfo: _onlyIfChanged(action),
      };

    default:
      return _state;
  }
}

const TxProvider = ({ children }: any) => {
  const [txState, updateState] = useReducer(txReducer, initState);

  const _setProcessStage = (txCode: string, stage: ProcessStage) => {
    updateState({
      type: 'processes',
      payload: { txCode, stage },
    });
  };

  const { chainState } = useContext(ChainContext);
  const {
    connection: { chainId, provider },
  } = chainState;

  const { logAnalyticsEvent } = useAnalytics();

  const _resetProcess = (txCode: string) => updateState({ type: TxStateItem.RESET_PROCESS, payload: txCode });

  const _startProcessTimer = async (txCode: string) => {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    _setProcessStage(txCode, ProcessStage.PROCESS_COMPLETE_TIMEOUT);
  };

  /* handle case when user or wallet rejects the tx (before submission) */
  const _handleTxRejection = (err: any, txCode: string) => {
    _resetProcess(txCode);
    /* If user cancelled/rejected the tx */
    if (err.code === 4001) {
      toast.info('Transaction rejected by user');
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

    // analyticsLogEvent('TX_REJECTED', { txCode }, chainId);
    logAnalyticsEvent(GA_Event.transaction_rejected, {
      action_code: txCode.split('_')[0],
      series_id: txCode.split('_')[1],
      error: err.code === 4001 ? 'rejected by user': 'rejected by wallet'
    } as GA_Properties.transaction_rejected );

  };

  /* handle an error from a tx that was successfully submitted */
  const _handleTxError = (msg: string, tx: any, txCode: any) => {
    // _setProcessStage(txCode, ProcessStage.PROCESS_INACTIVE);
    // updateState({ type: 'resetProcess', payload: txCode })
    _setProcessStage(txCode, ProcessStage.PROCESS_COMPLETE);
    // toast.error(msg);
    const _tx = { tx, txCode, receipt: undefined, status: TxState.FAILED };
    updateState({ type: TxStateItem.TRANSACTIONS, payload: _tx });
    console.log('txHash: ', tx?.hash);

    // analyticsLogEvent('TX_FAILED', { txCode }, chainId);
    logAnalyticsEvent(GA_Event.transaction_failed, {
      action_code: txCode.split('_')[0],
      series_id: txCode.split('_')[1],
      error: msg,
    } as GA_Properties.transaction_failed);
  };

  const handleTxWillFail = async (error: any, txCode?: string | undefined, transaction?: any) => {
    /* simply toggles the txWillFail txState */
    if (txState.txWillFail === false) {
      updateState({ type: TxStateItem.TX_WILL_FAIL, payload: true });
      /* extra actions */
      toast.error(`Transaction Aborted`);

      console.log(transaction);
      const blocknum = await provider.getBlockNumber();

      updateState({ type: TxStateItem.TX_WILL_FAIL_INFO, payload: { error, transaction, blocknum } });

      txCode && updateState({ type: TxStateItem.RESET_PROCESS, payload: txCode });
    } else {
      updateState({ type: TxStateItem.TX_WILL_FAIL, payload: false });

      logAnalyticsEvent(GA_Event.transaction_will_fail, {
        action_code: txCode.split('_')[0],
        series_id: txCode.split('_')[1],
        error,
      } as GA_Properties.transaction_will_fail);
    }
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
        updateState({
          type: TxStateItem.TRANSACTIONS,
          payload: { tx, txCode, receipt: null, status: TxState.PENDING },
        });
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
        type: TxStateItem.TRANSACTIONS,
        payload: _tx,
      });

      /* if the handleTx is NOT a fallback tx (from signing) - then end the process */
      if (_isfallback === false) {
        /* transaction completion : success OR failure */
        _setProcessStage(txCode, ProcessStage.PROCESS_COMPLETE);

        // analyticsLogEvent('TX_COMPLETE', { txCode }, chainId);
        logAnalyticsEvent(GA_Event.transaction_complete, {
          action_code: txCode.split('_')[0],
          series_id: txCode.split('_')[1],
        } as GA_Properties.transaction_complete );

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

  /* handle a sig and sig fallbacks */
  /* returns the tx id to be used in handleTx */
  const handleSign = async (
    signFn: () => Promise<any>,
    fallbackFn: () => Promise<any>,
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
      updateState({ type: TxStateItem.PROCESS_ACTIVE, payload: hasActiveProcess });

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
    handleTxWillFail,
    resetProcess: (txCode: string) => updateState({ type: TxStateItem.RESET_PROCESS, payload: txCode }),
    updateTxStage: (txCode: string, stage: ProcessStage) =>
      updateState({ type: TxStateItem.PROCESSES, payload: { ...txState.processes.get(txCode), stage } }),
  };

  return <TxContext.Provider value={{ txState, txActions }}>{children}</TxContext.Provider>;
};

export { TxContext, TxProvider };
export default TxProvider;
