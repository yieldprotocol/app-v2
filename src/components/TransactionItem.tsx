import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Spinner } from 'grommet';
import { FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { ActionCodes, ProcessStage, TxState } from '../types';
import EtherscanButton from './buttons/EtherscanButton';
import { getPositionPathPrefix, getVaultIdFromReceipt } from '../utils/appUtils';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';

interface ITransactionItem {
  tx: any;
  wide?: boolean;
}

const TransactionItem = ({ tx, wide }: ITransactionItem) => {
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);
  const {
    txActions: { updateTxStage },
  } = useContext(TxContext);

  const { status, txCode, tx: t, receipt } = tx;

  /* get position link based on position id */
  const action = txCode.split('_')[0];
  const pathPrefix = getPositionPathPrefix(txCode);
  const positionId =
    action === ActionCodes.BORROW && receipt ? getVaultIdFromReceipt(receipt, contractMap) : txCode.split('_')[1];
  const link = `${pathPrefix}/${positionId}`;

  return (
    <Box
      align="center"
      fill
      gap="xsmall"
      elevation={wide ? undefined : 'small'}
      pad={wide ? 'xsmall' : 'medium'}
      key={t.hash}
      background={wide ? 'tailwind-blue-50' : 'white'}

      round={{ size: 'xsmall', corner: 'left' }}
    >
      {!wide && (
        <Box
          alignSelf="end"
          onClick={() => updateTxStage(txCode, ProcessStage.PROCESS_COMPLETE_TIMEOUT)}
          hoverIndicator={{}}
        >
          {status === TxState.FAILED && <FiX size="1.2rem" />}
        </Box>
      )}
      <Box direction="row" fill justify="between">
        <Box direction="row" align="center">
          <Box width="3rem">
            {status === TxState.PENDING && <Spinner color="tailwind-blue" />}
            {status === TxState.SUCCESSFUL && <FiCheckCircle size="1.5rem" color="#34D399" />}
            {status === TxState.FAILED && <FiXCircle size="1.5rem" color="#F87171" />}
          </Box>
          <Text size="small">{action}</Text>
        </Box>
        <Box align="center" direction="row">
          {status === TxState.SUCCESSFUL && action !== 'Borrow' ? (
            <Link to={link} style={{ textDecoration: 'none' }}>
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

TransactionItem.defaultProps = { wide: false };

export default TransactionItem;
