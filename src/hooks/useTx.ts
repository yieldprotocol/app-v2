import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, TxState } from '../types';
import { getTxCode } from '../utils/appUtils';

interface ITx {
  txCode: any;
  pending: boolean;
  success: boolean;
  failed: boolean;
  rejected: boolean;
  txHash: any;
  processActive: boolean;
  complete: boolean;
  positionPath: string | undefined;
}

/* useTx hook returns the tx status, and redirects to home after success if shouldRedirect is specified */
/* the return tx looks like any object of {txCode, isPending, isSuccess, isFailed, isRejected} */
export const useTx = (
  actionCode: ActionCodes,
  seriesOrVaultId: string | undefined,
  shouldRedirect: boolean = false
) => {
  /* STATE FROM CONTEXT */
  const {
    txState: { transactions, processes },
  } = useContext(TxContext);
  const {
    // userState: { selectedVaultId, selectedSeriesId },
    userActions,
  } = useContext(UserContext);
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const history = useHistory();

  const INITIAL_STATE = {
    txCode: undefined,
    pending: false,
    success: false,
    failed: false,
    rejected: false,
    txHash: undefined,
    processActive: false,
    complete: false,
    positionPath: undefined,
  };

  const [tx, setTx] = useState<ITx>(INITIAL_STATE);
  const [txCode, setTxCode] = useState<string>();
  const [txHash, setTxHash] = useState<string>();
  const [txStatus, setTxStatus] = useState<TxState>();
  const [processActive, setProcessActive] = useState<boolean>(false);

  const resetTx = () => {
    setTx(INITIAL_STATE);
    setTxHash(undefined);
    setTxStatus(undefined);
    setProcessActive(false);
  };

  const getPositionPathPrefix = (_actionCode: string) => {
    const _action = _actionCode.split('_')[0];
    switch (_action) {
      case ActionCodes.BORROW:
        return 'vaultposition';
      case ActionCodes.ADD_LIQUIDITY:
        return 'poolposition';
      default:
        return `${_action.toLowerCase()}position`;
    }
  };

  useEffect(() => {
    seriesOrVaultId ? setTxCode(getTxCode(actionCode, seriesOrVaultId)) : setTxCode(undefined);
  }, [actionCode, seriesOrVaultId]);

  useEffect(() => {
    txCode && setTxHash(processes.get(txCode)?.hash!);
  }, [processes, txCode, processActive]);

  useEffect(() => {
    txCode && processes.has(txCode) && processes.get(txCode).status === 'ACTIVE'
      ? setProcessActive(true)
      : setProcessActive(false);
  }, [processes, txCode]);

  useEffect(() => {
    transactions.has(txHash) && setTxStatus(transactions.get(txHash).status);
  }, [txHash, transactions]);

  useEffect(() => {
    setTx((t) => ({ ...t, txCode, processActive }));
    switch (txStatus) {
      case TxState.PENDING:
        setTx((t) => ({ ...t, pending: true, txHash, processActive }));
        break;
      case TxState.SUCCESSFUL:
        setTx((t) => ({ ...t, success: true, pending: false, processActive }));
        break;
      case TxState.FAILED:
        setTx((t) => ({ ...t, failed: true, pending: false, processActive }));
        break;
      case TxState.REJECTED:
        setTx((t) => ({ ...t, rejected: true, pending: false, processActive }));
        break;
    }
  }, [txCode, processActive, txStatus, txHash]);

  useEffect(() => {
    tx.success && shouldRedirect && history.push('/') && userActions.setSelectedVault(null);
  }, [tx.success, shouldRedirect, history, userActions]);

  // get the vault id after borrowing or the lend/pool position id's
  useEffect(() => {
    let positionId: string | undefined;
    const receipt = transactions?.get(txHash)?.receipt!;
    if (txCode?.includes(ActionCodes.BORROW) && receipt) {
      const cauldronAddr = contractMap.get('Cauldron').address;
      const cauldronEvents = receipt?.events?.filter((e: any) => e.address === cauldronAddr)[0];
      const vaultIdHex = cauldronEvents?.topics[1];
      const vaultId = vaultIdHex.slice(0, 26);
      positionId = vaultId;
    } else {
      positionId = txCode?.split('_')[1];
    }
    txCode && setTx((t) => ({ ...t, positionPath: `${getPositionPathPrefix(txCode!)}/${positionId}` }));
  }, [transactions, contractMap, txCode, txHash]);

  return { tx, resetTx };
};
