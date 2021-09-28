import React, { useEffect, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Box, Text, Spinner } from 'grommet';
import { FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { ActionCodes, ProcessStage, TxState } from '../types';
import EtherscanButton from './buttons/EtherscanButton';
import { getSeriesAfterRollPosition, getPositionPathPrefix, getVaultIdFromReceipt } from '../utils/appUtils';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';

interface ITransactionItem {
  tx: any;
  wide?: boolean;
}

const StyledLink = styled(Link)`
  text-decoration: none;
  vertical-align: middle;
  color: black;
  :hover {
    text-decoration: underline;
  }
`;

const TransactionItem = ({ tx, wide }: ITransactionItem) => {
  const {
    chainState: { contractMap, seriesRootMap },
  } = useContext(ChainContext);
  const {
    txActions: { updateTxStage },
  } = useContext(TxContext);

  const { status, txCode, tx: t, receipt } = tx;
  const action = txCode.split('_')[0];

  const [link, setLink] = useState<string>('');

  /* get position link for viewing position */
  useEffect(() => {
    const pathPrefix = getPositionPathPrefix(txCode);

    let positionId;

    if (receipt) {
      if (action === ActionCodes.BORROW) positionId = getVaultIdFromReceipt(receipt, contractMap);
      if (action === ActionCodes.ROLL_POSITION) positionId = getSeriesAfterRollPosition(receipt, seriesRootMap);
    } else {
      positionId = txCode?.split('_')[1];
    }
    setLink(`${pathPrefix}/${positionId}`);
  }, [receipt, contractMap, seriesRootMap, txCode, action]);

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
          {status === TxState.SUCCESSFUL ? (
            <StyledLink to={link}>
              <Text size="small" style={{ verticalAlign: 'middle' }}>
                {action}
              </Text>
            </StyledLink>
          ) : (
            <Text size="small" color="black">
              {action}
            </Text>
          )}
        </Box>
        <Box align="center" direction="row">
          <EtherscanButton txHash={t.hash} />
        </Box>
      </Box>
    </Box>
  );
};

TransactionItem.defaultProps = { wide: false };

export default TransactionItem;
