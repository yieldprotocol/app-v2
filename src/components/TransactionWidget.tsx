import React from 'react';
import { Box, Text, Spinner } from 'grommet';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { abbreviateHash } from '../utils/appUtils';
import CopyWrap from './wraps/CopyWrap';

const TransactionWidget = ({ tx }: any) => {
  if (!tx.txCode) return null;

  return (
    <Box
      round="xsmall"
      pad={{ horizontal: 'medium', vertical: 'xsmall' }}
      elevation={tx.processActive || tx.success || tx.failed ? 'xsmall' : undefined}
      gap="xsmall"
      fill
      align="center"
      justify="center"
    >
      {!tx.pending && tx.processActive && (
        <Box direction="row" gap="medium" align="center">
          <FiAlertTriangle />
          <Box>
            <Text size="small">Action Required</Text>
            <Text size="xsmall">Check your wallet</Text>
          </Box>
        </Box>
      )}

      {tx.pending && (
        <Box direction="row" gap="medium" align="center">
          {/* <FiClock /> */}
          <Spinner />
          <Box>
            <Text size="small">Transaction Pending</Text>
            <Text size="xsmall">
              <CopyWrap hash={tx.txHash}>{abbreviateHash(tx.txHash, 6)} </CopyWrap>
            </Text>
          </Box>
        </Box>
      )}
      {tx.success && (
        <Box direction="row" gap="small">
          <FiCheckCircle />
          <Text size="xsmall"> Transaction Complete </Text>
        </Box>
      )}
      {tx.failed && (
        <Box direction="row" gap="small">
          <FiXCircle />
          <Text size="xsmall"> Transaction Failed </Text>
        </Box>
      )}
    </Box>
  );
};

export default TransactionWidget;
