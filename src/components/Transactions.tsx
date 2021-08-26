import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Spinner } from 'grommet';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { TxContext } from '../contexts/TxContext';
import { TxState } from '../types';
import EtherscanButton from './buttons/EtherscanButton';

const Transactions = ({ ...props }) => {
  const {
    txState: { transactions },
  } = useContext(TxContext);

  return (
    <Box>
      {[...transactions.values()].map((tx: any) => {
        const { status, txCode, tx: t } = tx;
        const action = txCode.split('_')[0];
        const link = txCode.split('_')[1];
        return (
          <Box align="center" fill direction="row" gap="small" {...props} key={t.hash}>
            <Box width="3rem">
              {status === TxState.PENDING && <Spinner color="tailwind-blue" />}
              {status === TxState.SUCCESSFUL && <FiCheckCircle size="1.5rem" />}
              {status === TxState.FAILED && <FiXCircle size="1.5rem" />}
            </Box>
            <Box gap="small" align="center" direction="row" justify="between" fill="horizontal">
              <Box direction="row" justify="start" align="start">
                <Text size="small">{action}</Text>
              </Box>
              <Box direction="row" align="center">
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
      })}
    </Box>
  );
};

export default Transactions;
