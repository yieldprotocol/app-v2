import React, { useContext } from 'react';
import styled from 'styled-components';
import { Box, Text } from 'grommet';
import { FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import { IYieldProcess, ProcessStage } from '../types';
import TransactionItem from './TransactionItem';

// look to see if there is a better way
const StyledBox = styled(Box)`
  position: absolute;
  top: 6rem;
  right: 0rem;
  min-width: 350px;
  z-index: 500;
`;

const TransactionWidget = () => {
  const {
    txState: { processes },
  } = useContext(TxContext);

  return (
    <>
      {Array.from(processes.values() as IYieldProcess[])
        .filter((process: IYieldProcess) => process.stage > 0)
        .map((process: IYieldProcess) => (
          <StyledBox key={process.txCode}>
            {(process.stage === ProcessStage.SIGNING_REQUESTED ||
              process.stage === ProcessStage.TRANSACTION_REQUESTED) && (
              <Box
                direction="row"
                justify="start"
                align="center"
                fill
                gap="small"
                pad="medium"
                elevation="small"
                // background='gradient-transparent'
                animation={{ type: 'slideLeft', size: 'large' }}
                background="white"
                round={{ size: 'xsmall', corner: 'left' }}
              >
                <Box width="3rem" align="center">
                  <FiAlertTriangle size="1.5rem" color="#D97706" />
                </Box>
                <Box align="start">
                  <Text size="small" color="text">
                    Action Required
                  </Text>
                  <Text size="xsmall" color="text">
                    Please Check your wallet
                  </Text>
                </Box>
              </Box>
            )}

            {process.stage === ProcessStage.SIGNING_TRANSACTION_PENDING && (
              <Box
                direction="row"
                justify="start"
                align="center"
                fill
                // elevation="small"
                gap="small"
                pad="small"
                background="white"
                round="xsmall"
              >
                <Box width="3rem" align="center">
                  <FiAlertCircle size="1.5rem" color="#D97706" />
                </Box>
                <Box align="start">
                  <Text size="small">Approval transaction pending</Text>
                  <Text size="xsmall">....</Text>
                </Box>
              </Box>
            )}

            {(process.stage === ProcessStage.TRANSACTION_PENDING ||
              process.stage === ProcessStage.PROCESS_COMPLETE) && (
              <TransactionItem tx={process.tx!} key={process.txHash} wide={false} />
            )}
          </StyledBox>
        ))}
    </>
  );
};

export default TransactionWidget;
