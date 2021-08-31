import React, { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import { Box, Text, Spinner } from 'grommet';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { ActionCodes, TxState } from '../types';
import EtherscanButton from './buttons/EtherscanButton';
import { ChainContext } from '../contexts/ChainContext';

const Transaction = ({ tx, removeOnComplete, ...props }: { tx: any; removeOnComplete?: boolean }) => {
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);
  const { status, txCode, tx: t, complete, receipt } = tx;

  const [positionId, setPositionId] = useState(txCode.split('_')[1]);

  const action = txCode.split('_')[0];
  const getLinkPathPrefix = (_action: string) => {
    switch (_action) {
      case ActionCodes.BORROW:
        return 'vaultposition';
      case ActionCodes.ADD_LIQUIDITY:
        return 'poolposition';
      default:
        return `${_action.toLowerCase()}position`;
    }
  };

  // get the vault id after successfull borrowing
  useEffect(() => {
    if (action === ActionCodes.BORROW && receipt) {
      const cauldronAddr = contractMap.get('Cauldron').address;
      const cauldronEvents = receipt?.events?.filter((e: any) => e.address === cauldronAddr)[0];
      const vaultIdHex = cauldronEvents?.topics[1];
      const vaultId = vaultIdHex.slice(0, 26);
      setPositionId(vaultId);
    }
  }, [receipt, contractMap, action]);

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
            <Link to={`${getLinkPathPrefix(action)}/${positionId}`} style={{ textDecoration: 'none' }}>
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
