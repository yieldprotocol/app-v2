import React, { useContext } from 'react';
import { Box } from 'grommet';
import { TxContext } from '../contexts/TxContext';
import Transaction from './Transaction';

const Transactions = ({ ...props }) => {
  const {
    txState: { transactions },
  } = useContext(TxContext);

  return (
    <Box>
      {[...transactions.values()].map((tx: any) => (
        <Transaction tx={tx} {...props} key={tx.tx.hash} />
      ))}
    </Box>
  );
};

export default Transactions;
