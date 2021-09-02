import React, { useContext } from 'react';
import { Box } from 'grommet';
import { TxContext } from '../contexts/TxContext';
import TransactionListItem from './TransactionListItem';

const Transactions = ({ ...props }) => {
  const {
    txState: { transactions },
  } = useContext(TxContext);

  return (
    <Box>
      {[...transactions.values()].map((tx: any) => (
        <TransactionListItem tx={tx} {...props} key={tx.tx.hash} />
      ))}
    </Box>
  );
};

export default Transactions;
