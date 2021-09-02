import React, { useCallback, useState, useContext, useEffect } from 'react';
import styled from 'styled-components';
import { Box, Text } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import { TxState } from '../types';
import TransactionList from './TransactionList';
import { useTimeout } from '../hooks/generalHooks';

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

  const [txs, setTxs] = useState<any>(transactions);

  // remove on success
  useEffect(() => {
    const handleRemove = (txHash: string) => setTxs(new Map(txs.set(txHash, { ...txs.get(txHash), remove: true })));

    [...txs.values()].map((tx: any) =>
      tx.status === TxState.SUCCESSFUL
        ? setTimeout(() => {
            handleRemove(tx.tx.hash);
          }, 5000)
        : null
    );
  }, [txs]);

  useEffect(() => {
    setTxs((_txs: any) => transactions);
  }, [txs, transactions]);

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
      <TransactionList transactions={[...txs.values()]} />
    </StyledBox>
  );
};

export default TransactionWidget;
