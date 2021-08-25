import React, { useContext } from 'react';
import { Box } from 'grommet';
import { TxContext } from '../contexts/TxContext';
import TransactionWidgetItem from './TransactionWidgetItem';

const TransactionWidget = () => {
  const {
    txState: { transactions_ },
  } = useContext(TxContext);

  const txListRender = [...transactions_.keys()].map((t) => {
    const tx = transactions_.get(t);
    return <TransactionWidgetItem tx={tx} key={tx.id} />;
  });

  return transactions_.size ? (
    <Box
      round="xsmall"
      pad={{ horizontal: 'medium', vertical: 'xsmall' }}
      gap="xsmall"
      fill
      align="center"
      justify="center"
    >
      {txListRender}
    </Box>
  ) : null;
};

export default TransactionWidget;
