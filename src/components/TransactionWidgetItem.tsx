import React from 'react';
import { Box, Text, Spinner } from 'grommet';
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import EtherscanButton from './buttons/EtherscanButton';

const TxItem = ({ tx, type }: { tx: any; type: string }) =>
  tx[type] !== undefined && tx[type] ? (
    <Box direction="row" align="center" fill justify="between" gap="small">
      <Box direction="row" gap="small" align="center">
        {type === 'pending' && <Spinner color="tailwind-blue" />}
        {type === 'success' && <FiCheckCircle size="1.5rem" />}
        {type === 'failed' && <FiXCircle size="1.5rem" />}
        <Text size="xsmall">Transaction {`${type[0].toUpperCase()}${type.slice(1)}`}</Text>
      </Box>
      <EtherscanButton txHash={tx.txHash} />
    </Box>
  ) : null;

const TransactionWidgetItem = ({ tx }: any) => (
  <Box round="xsmall" elevation="small" align="center" pad="medium">
    {!tx.pending && tx.processActive && (
      <Box direction="row" align="center" fill justify="between" gap="small">
        <Box direction="row" gap="small" align="center">
          <FiAlertTriangle size="1.5rem" />
          <Text size="xsmall">Action Required</Text>
        </Box>
        <Box gap="small" align="center" direction="row">
          <Text size="xsmall">Check your wallet</Text>
        </Box>
      </Box>
    )}

    <TxItem tx={tx} type="pending" />
    <TxItem tx={tx} type="success" />
    <TxItem tx={tx} type="failed" />
  </Box>
);

export default TransactionWidgetItem;
