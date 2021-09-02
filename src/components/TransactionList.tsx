import React from 'react';
import { Box } from 'grommet';
import TransactionListItem from './TransactionListItem';

interface ITransactionList {
  transactions: any;
  wide?: boolean;
}

const TransactionList = ({ transactions, wide }: ITransactionList) => (
  <Box>
    {transactions.map((tx: any) => (
      <TransactionListItem tx={tx} key={tx.tx.hash} wide={wide} />
    ))}
  </Box>
);

TransactionList.defaultProps = { wide: false };

export default TransactionList;
