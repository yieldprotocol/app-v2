import { useEffect, useContext, useState } from 'react';
import Link from 'next/link';
import styled, { ThemeContext } from 'styled-components';
import { Box, Text, Spinner } from 'grommet';
import { FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { ProcessStage, TxState } from '../types';
import EtherscanButton from './buttons/EtherscanButton';
import { getPositionPath } from '../utils/appUtils';
import { ChainContext } from '../contexts/ChainContext';
import { TxContext } from '../contexts/TxContext';
import { useColorScheme } from '../hooks/useColorScheme';
import useContracts from '../hooks/useContracts';
import { ContractNames } from '../config/contracts';
import { Cauldron, VRCauldron } from '../contracts';
import { UserContext } from '../contexts/UserContext';

interface ITransactionItem {
  tx: any;
  wide?: boolean;
}

const StyledBox = styled(Box)`
  text-decoration: none;
  vertical-align: middle;
  :hover {
    text-decoration: underline;
    text-decoration-color: ${(props: any) => props.color};
  }
`;

const TransactionItem = ({ tx, wide }: ITransactionItem) => {
  const {
    chainState: { seriesRootMap },
  } = useContext(ChainContext);
  const {
    txActions: { updateTxStage },
  } = useContext(TxContext);
  const {
    userState: { selectedVR },
  } = useContext(UserContext);
  const colorScheme = useColorScheme();
  const contracts = useContracts();
  const theme = useContext<any>(ThemeContext);
  const { text: textColor, success, error } = theme.global.colors;

  const { status, txCode, tx: t, receipt } = tx;
  const action = txCode.split('_')[0];

  const [link, setLink] = useState<string | null>(null);

  /* get position link for viewing position */
  useEffect(() => {
    const cauldron = selectedVR
      ? (contracts?.get(ContractNames.VR_CAULDRON) as VRCauldron)
      : (contracts?.get(ContractNames.CAULDRON) as Cauldron);
    const path = getPositionPath(txCode, receipt, cauldron, seriesRootMap);
    path && setLink(path);
  }, [receipt, contracts, seriesRootMap, txCode, selectedVR]);

  return (
    <Box
      align="center"
      fill
      gap="xsmall"
      elevation={wide ? undefined : 'small'}
      pad={wide ? 'xsmall' : 'medium'}
      key={t.hash}
      background={wide ? 'gradient-transparent' : 'hoverBackground'}
      round={{ size: 'xsmall', corner: 'left' }}
    >
      {!wide && (
        <Box
          style={{ position: 'absolute', top: '.5rem', right: '.5rem' }}
          onClick={() => updateTxStage(txCode, ProcessStage.PROCESS_COMPLETE_TIMEOUT)}
          hoverIndicator={{}}
        >
          {status === TxState.FAILED && <FiX size="1rem" />}
        </Box>
      )}
      <Box direction="row" fill justify="between" align="center">
        <Box direction="row" align="center" alignSelf="center" fill="vertical">
          <Box width="3rem">
            {status === TxState.PENDING && <Spinner color="brand" />}
            {status === TxState.SUCCESSFUL && <FiCheckCircle size="1.5rem" color={success.dark} />}
            {status === TxState.FAILED && <FiXCircle size="1.5rem" color={error.dark} />}
          </Box>
          {status === TxState.SUCCESSFUL && link ? (
            <Link href={link} passHref>
              <StyledBox color={colorScheme === 'dark' ? textColor.dark : textColor.light}>
                <Box fill>
                  <Text
                    size="small"
                    style={{
                      color: colorScheme === 'dark' ? textColor.dark : textColor.light,
                    }}
                  >
                    {action}
                  </Text>
                </Box>
              </StyledBox>
            </Link>
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
