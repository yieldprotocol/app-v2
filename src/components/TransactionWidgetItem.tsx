import React from 'react';
import { Box, Text, Spinner } from 'grommet';
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import EtherscanButton from './buttons/EtherscanButton';

const TxItem = ({ tx, type }: { tx: any; type: string }) =>
  tx[type] !== undefined && tx[type] ? (
    <Box direction="row" align="center" gap="medium">
      <Box direction="row" gap="small" align="center">
        {type === 'pending' && <Spinner color="tailwind-blue" size="small" />}
        {type === 'success' && <FiCheckCircle size="20px" />}
        {type === 'failed' && <FiXCircle size="20px" />}
        <Text size="small">Transaction {`${type[0].toUpperCase()}${type.slice(1)}`}</Text>
      </Box>
      <EtherscanButton txHash={tx.txHash} />
    </Box>
  ) : null;

const TransactionWidgetItem = ({ tx }: any) => (
  <Box round="xsmall" elevation="small" align="center" pad={{ horizontal: 'small', vertical: 'medium' }}>
    {!tx.pending && tx.processActive && (
      <Box direction="row" align="center" gap="medium">
        <Box direction="row" gap="small" align="center">
          <FiAlertTriangle size="20px" />
          <Text size="small">Action Required</Text>
        </Box>
        <Text size="xsmall">Check your wallet</Text>
      </Box>
    )}

    <TxItem tx={tx} type="pending" />
    <TxItem tx={tx} type="success" />
    <TxItem tx={tx} type="failed" />
  </Box>
);

export default TransactionWidgetItem;
