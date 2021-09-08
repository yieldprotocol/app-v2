import React, { useCallback, useState, useContext, useEffect } from 'react';
import styled from 'styled-components';
import { Box, Text } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import { TxState } from '../types';
import TransactionList from './TransactionList';
import { useTimeout } from '../hooks/generalHooks';

// look to see if there is a better way
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

  const [txs, setTxs] = useState<any>(new Map());

  // infinite loop issues
  const handleRemove = useCallback(
    (txHash: string) => {
      const updatedTx = { ...txs.get(txHash), remove: true };
      setTxs((_txs: any) => _txs.set(txHash, updatedTx));
      console.log('inhere', txs);
    },
    [txs]
  );

  // remove on success
  useEffect(() => {
    txs.size &&
      [...txs.values()].map(
        (tx: any) => tx.status === TxState.SUCCESSFUL && setTimeout(() => handleRemove(tx.tx.hash), 5000)
      );
  }, [txs, handleRemove]);

  // set the tx in local state on each change in context
  useEffect(() => {
    setTxs(new Map(transactions));
  }, [transactions]);

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
      <TransactionList transactions={[...txs.values()]} handleRemove={handleRemove} />
    </StyledBox>
  );
};

export default TransactionWidget;
