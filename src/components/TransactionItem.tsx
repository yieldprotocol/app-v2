import React, { useEffect, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { ThemeContext } from 'styled-components';
import { Box, Text, Spinner } from 'grommet';
import { FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { ActionCodes, ProcessStage, TxState } from '../types';
import EtherscanButton from './buttons/EtherscanButton';
import { getPositionPath } from '../utils/appUtils';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { SettingsContext } from '../contexts/SettingsContext';

interface ITransactionItem {
  tx: any;
  wide?: boolean;
}

const StyledLink = styled(Link)`
  text-decoration: none;
  vertical-align: middle;
  :hover {
    text-decoration: underline;
    text-decoration-color: ${(props) => props.color};
  }
`;

const TransactionItem = ({ tx, wide }: ITransactionItem) => {
  const {
    chainState: { contractMap, seriesRootMap },
  } = useContext(ChainContext);
  const {
    txActions: { updateTxStage },
  } = useContext(TxContext);
  const {
    settingsState: { darkMode },
  } = useContext(SettingsContext);
  const theme = useContext<any>(ThemeContext);
  const textColor = theme.global.colors.text;

  const { status, txCode, tx: t, receipt } = tx;
  const action = txCode.split('_')[0];

  const [link, setLink] = useState<string | null>(null);

  /* get position link for viewing position */
  useEffect(() => {
    const path = getPositionPath(txCode, receipt, contractMap, seriesRootMap);
    path && setLink(path);
  }, [receipt, contractMap, seriesRootMap, txCode]);

  return (
    <Box
      align="center"
      fill
      gap="xsmall"
      elevation={wide ? undefined : 'small'}
      pad={wide ? 'xsmall' : 'medium'}
      key={t.hash}
      background={wide ? 'tailwind-blue-50' : 'hoverBackground'}
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
      <Box direction="row" fill justify="between" align="center">
        <Box direction="row" align="center">
          <Box width="3rem">
            {status === TxState.PENDING && <Spinner color="brand" />}
            {status === TxState.SUCCESSFUL && <FiCheckCircle size="1.5rem" color="#34D399" />}
            {status === TxState.FAILED && <FiXCircle size="1.5rem" color="#F87171" />}
          </Box>
          {status === TxState.SUCCESSFUL && link ? (
            <StyledLink to={link} color={darkMode ? textColor.dark : textColor.light}>
              <Text
                size="small"
                style={{
                  color: darkMode ? textColor.dark : textColor.light,
                  verticalAlign: 'middle',
                }}
              >
                {action}
              </Text>
            </StyledLink>
          ) : (
            <Text size="small" color={textColor}>
              {action}
            </Text>
          )}
        </Box>
        <EtherscanButton txHash={t.hash} />
      </Box>
    </Box>
  );
};

TransactionItem.defaultProps = { wide: false };

export default TransactionItem;
