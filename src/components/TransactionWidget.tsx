import React, { useContext } from 'react';
import { Box } from 'grommet';
import { TxContext } from '../contexts/TxContext';
import TransactionWidgetItem from './TransactionWidgetItem';

const TransactionWidget = () => {
  const { transactions_ } = useContext(TxContext);

  const txListRender = [...transactions_.keys()].map((t) => {
    const tx = transactions_.get(t);
    return <TransactionWidgetItem tx={tx} key={tx.id} />;
  });

  return (
    <Box
      round="xsmall"
      pad={{ horizontal: 'medium', vertical: 'xsmall' }}
      elevation="xsmall"
      gap="xsmall"
      fill
      align="center"
      justify="center"
    >
      {txListRender}
    </Box>
  );
};

export default TransactionWidget;
