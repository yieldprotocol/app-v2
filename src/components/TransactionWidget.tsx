import React, { useContext } from 'react';
import { TxContext } from '../contexts/TxContext';
import TransactionWidgetItem from './TransactionWidgetItem';

const TransactionWidget = ({ showComplete, wide }: { showComplete?: boolean; wide?: boolean }) => {
  const {
    txState: { transactions_ },
  } = useContext(TxContext);

  return transactions_.size ? (
    <>
      {[...transactions_.keys()].map((t) => {
        const tx = transactions_.get(t);
        // eslint-disable-next-line no-nested-ternary
        return tx.active ? (
          <TransactionWidgetItem tx={tx} key={tx.txId} wide={wide} />
        ) : showComplete && tx.complete ? (
          <TransactionWidgetItem tx={tx} key={tx.txId} wide={wide} />
        ) : null;
      })}
    </>
  ) : null;
};

TransactionWidget.defaultProps = { showComplete: false, wide: false };

export default TransactionWidget;
