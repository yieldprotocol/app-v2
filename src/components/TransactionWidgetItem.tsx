import React from 'react';
import { Box, Text, Spinner } from 'grommet';
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import EtherscanButton from './buttons/EtherscanButton';

const TxItem = ({ tx, type }: { tx: any; type: string }) =>
  tx[type] !== undefined && tx[type] ? (
    <Box align="center" fill direction="row" gap="small">
      {type === 'pending' && <Spinner color="tailwind-blue" />}
      {type === 'success' && <FiCheckCircle size="1.5rem" />}
      {type === 'failed' && <FiXCircle size="1.5rem" />}
      <Box gap="small" align="start">
        <Box direction="row" justify="start">
          <Text size="xsmall">
            {tx.primaryInfo} {`${type[0].toUpperCase()}${type.slice(1)}`}
          </Text>
        </Box>
        <Box>
          <EtherscanButton txHash={tx.txHash} />
        </Box>
      </Box>
    </Box>
  ) : null;

const TransactionWidgetItem = ({ tx }: any) => (
  <Box round="xsmall" elevation="small" align="center" pad="medium">
    {!tx.pending && tx.processActive && (
      <Box align="center" fill direction="row" gap="small">
        <FiAlertTriangle size="1.5rem" />
        <Box gap="small" align="start">
          <Box direction="row" justify="start">
            <Text size="xsmall">Action Required</Text>
          </Box>
          <Box>
            <Text size="xsmall">Check your wallet</Text>
          </Box>
        </Box>
      </Box>
    )}

    <TxItem tx={tx} type="pending" />
    <TxItem tx={tx} type="success" />
    <TxItem tx={tx} type="failed" />
  </Box>
);

export default TransactionWidgetItem;
