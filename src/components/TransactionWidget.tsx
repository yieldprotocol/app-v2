import React, { useContext } from 'react';
import styled from 'styled-components';
import { Box, Text } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import TransactionList from './TransactionList';
import { TxState } from '../types';

const StyledBox = styled(Box)`
  position: absolute;
  margin-top: 10%;
  right: 6rem;
`;

const TransactionWidget = () => {
  const {
    txState: { processes, transactions },
  } = useContext(TxContext);
  const hasActiveProcess = [...processes.values()].some((p) => p.status === 'ACTIVE');
  const lastTx = [...transactions?.values()][transactions.size - 1];
  const isLastTxPending = lastTx?.status === TxState.PENDING;

  return (
    <StyledBox gap="xsmall">
      {hasActiveProcess && !isLastTxPending && (
        <Box direction="row" justify="start" align="center" fill elevation="small" gap="small" pad="small">
          <Box align="center">
            <FiAlertTriangle size="1.5rem" color="#D97706" />
          </Box>
          <Box align="start">
            <Text size="small">Action Required</Text>
            <Text size="xsmall">Please Check your wallet</Text>
          </Box>
        </Box>
      )}
      <TransactionList removeOnComplete elevation="small" pad="small" />
    </StyledBox>
  );
};

export default TransactionWidget;
