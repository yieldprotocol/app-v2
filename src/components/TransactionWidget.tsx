import React, { useCallback, useState, useContext, useEffect } from 'react';
import styled from 'styled-components';
import { Box, Text } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import { IYieldProcess, ProcessStage, TxState } from '../types';
import TransactionItem from './TransactionItem';
import { useProcess } from '../hooks/useProcess';

// look to see if there is a better way
const StyledBox = styled(Box)`
  position: absolute;
  margin-top: 10%;
  right: 6rem;
`;

const TransactionWidget = () => {
  const {
    txState: { processes, transactions, processActive },
  } = useContext(TxContext);

  const lastTx = [...transactions?.values()][transactions.size - 1];
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
    <>
      {Array.from(processes.values() as IYieldProcess[])
        .filter((process: IYieldProcess) => process.stage > 0)
        .map((process: IYieldProcess) => {
          const r = 9;
          return (
            <StyledBox key={process.txCode}>
              {(process.stage === ProcessStage.SIGNING_REQUESTED ||
                process.stage === ProcessStage.TRANSACTION_REQUESTED) && (
                <Box
                  direction="row"
                  justify="start"
                  align="center"
                  fill
                  // elevation="small"
                  gap="small"
                  pad="small"
                  background="hover"
                  round="xsmall"
                >
                  <Box width="3rem" align="center">
                    <FiAlertTriangle size="1.5rem" color="#D97706" />
                  </Box>
                  <Box align="start">
                    <Text size="small">Action Required</Text>
                    <Text size="xsmall">Please Check your wallet</Text>
                  </Box>
                </Box>
              )}

              {(process.stage === ProcessStage.TRANSACTION_PENDING ||
                process.stage === ProcessStage.SIGNING_TRANSACTION_PENDING ||
                process.stage === ProcessStage.PROCESS_COMPLETE) && (
                <TransactionItem tx={process.tx!} key={process.txHash} wide={false} handleRemove={handleRemove} />
              )}
            </StyledBox>
          );
        })}
    </>
  );
};

export default TransactionWidget;
