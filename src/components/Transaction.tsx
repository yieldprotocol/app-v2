import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Spinner } from 'grommet';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { ActionCodes, TxState } from '../types';
import EtherscanButton from './buttons/EtherscanButton';
import { ChainContext } from '../contexts/ChainContext';
import { getPositionPathPrefix, getVaultIdFromReceipt } from '../utils/appUtils';

const Transaction = ({ tx, removeOnComplete, ...props }: { tx: any; removeOnComplete?: boolean }) => {
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);
  const { status, txCode, tx: t, complete, receipt } = tx;
  const action = txCode.split('_')[0];

  const [positionPath, setPositionPath] = useState(`${getPositionPathPrefix(txCode)}/${txCode.split('_')[1]}`);

  // get the vault id after successfull borrowing
  useEffect(() => {
    if (txCode.includes(ActionCodes.BORROW) && receipt) {
      const vaultId = getVaultIdFromReceipt(receipt, contractMap);
      setPositionPath(`${getPositionPathPrefix(txCode)}/${vaultId}`);
    }
  }, [receipt, contractMap, txCode]);

  return removeOnComplete && complete ? null : (
    <Box align="center" fill direction="row" gap="small" {...props} key={t.hash}>
      <Box width="3rem">
        {status === TxState.PENDING && <Spinner color="tailwind-blue" />}
        {status === TxState.SUCCESSFUL && <FiCheckCircle size="1.5rem" color="#34D399" />}
        {status === TxState.FAILED && <FiXCircle size="1.5rem" color="#F87171" />}
      </Box>
      <Box gap="small" align="center" direction="row" justify="between" fill="horizontal">
        <Box direction="row" justify="start" align="start">
          <Text size="small">{action}</Text>
        </Box>
        <Box direction="row" align="center">
          {status === TxState.SUCCESSFUL ? (
            <Link to={positionPath} style={{ textDecoration: 'none' }}>
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
