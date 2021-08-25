import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Spinner } from 'grommet';
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import EtherscanButton from './buttons/EtherscanButton';

const TxItem = ({ tx, type, wide }: { tx: any; type: string; wide: boolean }) =>
  tx[type] !== undefined && tx[type] ? (
    <Box align="center" fill direction="row" gap="small">
      {type === 'pending' && <Spinner color="tailwind-blue" />}
      {type === 'success' && <FiCheckCircle size="1.5rem" />}
      {type === 'failed' && <FiXCircle size="1.5rem" />}
      <Box
        gap="small"
        align={wide ? 'center' : 'start'}
        direction={wide ? 'row' : undefined}
        justify={wide ? 'between' : 'start'}
        fill={wide ? 'horizontal' : undefined}
      >
        <Box direction="row" justify="start" align="start">
          <Text size="xsmall">{`${tx.primaryInfo} ${type[0].toUpperCase()}${type.slice(1)}`}</Text>
        </Box>
        <Box direction={wide ? 'row' : undefined} align="center">
          {tx.success && tx.primaryInfo !== 'borrow' ? (
            <Link
              to={`${tx.primaryInfo !== 'borrow' ? tx.primaryInfo.toLowerCase() : 'vault'}position/${tx.positionLink}`}
              style={{ verticalAlign: 'middle' }}
            >
              <Text size="xsmall" style={{ verticalAlign: 'middle' }}>
                View Position
              </Text>
            </Link>
          ) : (
            <EtherscanButton txHash={tx.txHash} />
          )}
        </Box>
      </Box>
    </Box>
  ) : null;

const TransactionWidgetItem = ({ tx, wide }: { tx: any; wide?: boolean }) => (
  <Box round="xsmall" elevation={wide ? undefined : 'small'} align="center" pad={wide ? 'xsmall' : 'medium'}>
    {!tx.pending && tx.processActive && (
      <Box align="center" fill direction="row" gap="small">
        <FiAlertTriangle size="1.5rem" />
        <Box
          direction={wide ? 'row' : undefined}
          gap="small"
          align="start"
          justify={wide ? 'between' : 'start'}
          fill={wide ? 'horizontal' : undefined}
        >
          <Box direction="row" justify="start">
            <Text size="xsmall">Action Required</Text>
          </Box>
          <Box>
            <Text size="xsmall">Check your wallet</Text>
          </Box>
        </Box>
      </Box>
    )}

    <TxItem tx={tx} type="pending" wide={wide!} />
    <TxItem tx={tx} type="success" wide={wide!} />
    <TxItem tx={tx} type="failed" wide={wide!} />
  </Box>
);

TransactionWidgetItem.defaultProps = { wide: false };

export default TransactionWidgetItem;
