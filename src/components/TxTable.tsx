import React, { useContext } from 'react';
import { Box, Text, Spinner } from 'grommet';
import { FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import styled from 'styled-components';
import { HistoryContext } from '../contexts/HistoryContext';
import { TxContext } from '../contexts/TxContext';
import { TxState } from '../types';
import EtherscanButton from './buttons/EtherscanButton';

const TxTable = () => {
  /* STATE FROM CONTEXT */
  const {
    txState: { transactions },
  } = useContext(TxContext);
  const { vaultHistory, poolhistory, tradeHistory } = useContext(HistoryContext);

  const renderIcon = (status: any) => {
    switch (status) {
      case TxState.SUCCESSFUL:
        return <FiCheckCircle color="green" />;
      case TxState.PENDING:
        return <Spinner />;
      case TxState.FAILED:
        return <FiXCircle color="red" />;
      case TxState.REJECTED:
        return <FiAlertTriangle color="yellow" />;
      default:
        return null;
    }
  };

  return transactions.size > 0 ? (
    <Box fill="horizontal" gap="small">
      {[...transactions.keys()].map((txHash: string) => {
        const { status, tx, txCode } = transactions.get(txHash);
        const icon = renderIcon(status);
        return (
          <Box key={tx.hash} justify="between" direction="row">
            <Box gap="small" align="center" direction="row">
              {icon}
              <Text size="small" weight={900}>
                {txCode.split('_')[0]}
              </Text>
            </Box>
            <EtherscanButton txHash={tx.hash} />
          </Box>
        );
      })}
    </Box>
  ) : (
    <Box>
      <Text size="medium">Your transactions will appear here...</Text>
    </Box>
  );
};

export default TxTable;
