import React from 'react';
import { Box } from 'grommet';
import TransactionListItem from './TransactionListItem';

interface ITransactionList {
  transactions: any;
  handleRemove?: any;
  wide?: boolean;
}

const TransactionList = ({ transactions, handleRemove, wide }: ITransactionList) => (
  <Box>
    {transactions.map((tx: any) => (
      <TransactionListItem tx={tx} key={tx.tx.hash} wide={wide} handleRemove={handleRemove} />
    ))}
  </Box>
);

TransactionList.defaultProps = { wide: false, handleRemove: () => null };

export default TransactionList;
