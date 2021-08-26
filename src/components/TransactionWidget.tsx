import React, { useEffect, useState, useContext } from 'react';
import { Box, Text } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import Transactions from './Transactions';
import { TxState } from '../types';

const TransactionWidget = () => {
  const {
    txState: { processes, transactions },
  } = useContext(TxContext);
  const hasActiveProcess = [...processes.values()].some((p) => p.status === 'ACTIVE');
  const isLastTxPending = [...transactions.values()][transactions.size - 1].status === TxState.PENDING;

  return (
    <Box gap="xsmall">
      {hasActiveProcess && !isLastTxPending && (
        <Box direction="row" justify="start" align="center" fill elevation="small" gap="small" pad="small">
          <Box width="3rem" align="center">
            <FiAlertTriangle size="1.5rem" color="#D97706" />
          </Box>
          <Box align="start">
            <Text size="small">Action Required</Text>
            <Text size="xsmall">Please Check your wallet</Text>
          </Box>
        </Box>
      )}
      <Transactions elevation="small" pad="medium" />
    </Box>
  );
};

export default TransactionWidget;
