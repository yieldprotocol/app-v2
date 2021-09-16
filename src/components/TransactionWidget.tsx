import React, { useCallback, useState, useContext, useEffect } from 'react';
import styled from 'styled-components';
import { Box, Text } from 'grommet';
import { FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import { IYieldProcess, ProcessStage, TxState } from '../types';
import TransactionItem from './TransactionItem';
import { useProcess } from '../hooks/useProcess';

// look to see if there is a better way
const StyledBox = styled(Box)`
  position: absolute;
  top: 6rem;
  right: 3rem;
  min-width: 250px;
`;

const TransactionWidget = () => {
  const {
    txState: { processes },
  } = useContext(TxContext);

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
                  gap="small"
                  pad="small"
                  background='-webkit-linear-gradient(90deg, #f7953369, #f3705569, #ef4e7b69, #a166ab69, #5073b869, #1098ad69, #07b39b69, #6fba8269)'
                  round="xsmall"
                >
                  <Box width="3rem" align="center">
                    <FiAlertTriangle size="1.5rem" color="#D97706" />
                  </Box>
                  <Box align="start">
                    <Text size="small" color='text'>Action Required</Text>
                    <Text size="xsmall" color='text'>Please Check your wallet</Text>
                  </Box>
                </Box>
              )}

            {process.stage === ProcessStage.SIGNING_TRANSACTION_PENDING 
              && (
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
                    <FiAlertCircle size="1.5rem" color="#D97706" />
                  </Box>
                  <Box align="start">
                    <Text size="small">Aproval transaction pending</Text>
                    <Text size="xsmall">....</Text>
                  </Box>
                </Box>
              )}

              {(process.stage === ProcessStage.TRANSACTION_PENDING ||   
                process.stage === ProcessStage.PROCESS_COMPLETE) && (
                <TransactionItem tx={process.tx!} key={process.txHash} wide={false} />
              )}
            </StyledBox>
          );
        })}
    </>
  );
};

export default TransactionWidget;
