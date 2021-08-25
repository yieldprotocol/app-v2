import React, { useContext } from 'react';
import { Box } from 'grommet';
import { TxContext } from '../contexts/TxContext';
import TransactionWidgetItem from './TransactionWidgetItem';

const TransactionWidget = () => {
  const {
    txState: { transactions_ },
  } = useContext(TxContext);

  return transactions_.size ? (
    <>
      {[...transactions_.keys()].map((t) => {
        const tx = transactions_.get(t);
        return tx.processActive || !tx.complete ? <TransactionWidgetItem tx={tx} key={tx.txId} /> : null;
      })}
    </>
  ) : null;
};

export default TransactionWidget;
