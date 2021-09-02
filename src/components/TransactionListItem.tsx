import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Spinner } from 'grommet';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { TxState } from '../types';
import EtherscanButton from './buttons/EtherscanButton';

const Transaction = ({ tx, removeOnComplete, ...props }: { tx: any; removeOnComplete?: boolean }) => {
  const { status, txCode, tx: t, complete } = tx;
  const action = txCode.split('_')[0];
  const link = txCode.split('_')[1];

  return removeOnComplete && complete ? null : (
    <Box align="center" fill direction="row" gap="small" {...props} key={t.hash}>
      <Box width="3rem">
        {status === TxState.PENDING && <Spinner color="tailwind-blue" />}
        {status === TxState.SUCCESSFUL && <FiCheckCircle size="1.5rem" color="#34D399" />}
        {status === TxState.FAILED && <FiXCircle size="1.5rem" color="#F87171" />}
      </Box>
      <Box gap="small" align="center" justify="between" fill="horizontal">
        <Box direction="row" justify="start" alignSelf="start">
          <Text size="small">{action}</Text>
        </Box>
        <Box direction="row" alignSelf="start">
          {status === TxState.SUCCESSFUL && action !== 'Borrow' ? (
            <Link
              to={`${action !== 'Borrow' ? action.toLowerCase() : 'vault'}position/${link}`}
              style={{ textDecoration: 'none' }}
            >
              <Text size="xsmall" color="tailwind-blue" style={{ verticalAlign: 'middle' }}>
                View Position
              </Text>
            </Link>
          ) : (
            <EtherscanButton txHash={t.hash} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

Transaction.defaultProps = { removeOnComplete: false };

export default Transaction;
