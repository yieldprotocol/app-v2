import React, { useContext, useState } from 'react';
import { Anchor, Box, Button, Collapsible, ResponsiveContext, Text } from 'grommet';
import { FiCheckSquare, FiCopy, FiChevronUp, FiChevronDown, FiExternalLink, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { ChainContext, connectorNames } from '../contexts/ChainContext';
import { abbreviateHash } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';
import AdvancedSettings from './AdvancedSettings';
import { TxContext } from '../contexts/TxContext';
import TransactionWidget from './TransactionWidget';

const ChangeButton = styled(Button)`
  background: #dbeafe;
  border: 2px solid #3b82f6;
  height: 1.75rem;
  width: 3rem;
  border-radius: 6px;
  font-size: 0.6rem;
  text-align: center;
  color: #2563eb;

  :hover {
    border: 2px solid #1d4ed8;
  }
`;

const YieldSettings = ({ setSettingsOpen, setConnectOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const {
    chainState: { account, chainData, provider },
  } = useContext(ChainContext);
  const {
    txState: { transactions_ },
  } = useContext(TxContext);
  const connectorName = connectorNames.get(provider.connection.url);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [transactionsOpen, toggleTransactionsOpen] = useState<boolean>(false);

  const handleChangeConnectType = () => {
    setSettingsOpen(false);
    setConnectOpen(true);
  };

  const handleCopy = (text: any) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <Box
      fill="vertical"
      width={mobile ? undefined : '400px'}
      background="white"
      // border={{ side: 'left', color: 'tailwind-blue-100' }}
      elevation="xlarge"
    >
      <Box gap="small" pad="medium">
        <Button alignSelf="end" icon={<FiX size="1.5rem" />} onClick={() => setSettingsOpen(false)} plain />
        <Box align="center" gap="small">
          <YieldAvatar address={account} size={3} />
          <Text size="xlarge">{abbreviateHash(account)}</Text>
        </Box>
        <Box align="center" direction="row" gap="small" justify="center">
          <Button onClick={() => handleCopy(account)}>
            {copySuccess ? (
              <FiCheckSquare size="1rem" style={{ verticalAlign: 'middle' }} />
            ) : (
              <FiCopy size="1rem" style={{ verticalAlign: 'middle' }} />
            )}
            <Text margin="xxsmall" size="xsmall">
              {copySuccess ? 'Copied' : 'Copy Address'}
            </Text>
          </Button>
          <Anchor href={`https://${chainData.name}.etherscan.io/address/${account}`} margin="xsmall" target="_blank">
            <FiExternalLink size="1rem" style={{ verticalAlign: 'middle' }} />
            <Text margin="xxsmall" size="xsmall">
              View on Explorer
            </Text>
          </Anchor>
        </Box>
        <Box justify="between" align="center" direction="row">
          {connectorName && <Text size="small">Connected with {connectorName}</Text>}
          <ChangeButton onClick={handleChangeConnectType}>Change</ChangeButton>
        </Box>
      </Box>
      <Box
        direction="row"
        align="center"
        border={{ color: 'tailwind-blue-100', size: 'xsmall', side: 'top' }}
        pad="medium"
      >
        <AdvancedSettings />
      </Box>
      <Box
        margin={{ top: 'auto' }}
        border={{ color: 'tailwind-blue-100', size: 'xsmall', side: 'top' }}
        pad="medium"
        gap="small"
        background="tailwind-blue-50"
      >
        <Box align="center" direction="row" justify="between" onClick={() => toggleTransactionsOpen(!transactionsOpen)}>
          <Text>Transactions</Text>
          {transactionsOpen ? (
            <FiChevronDown size="1.5rem" color="tailwind-blue" />
          ) : (
            <FiChevronUp size="1.5rem" color="tailwind-blue" />
          )}
        </Box>
        <Collapsible open={transactionsOpen}>
          {!transactions_.size && <Text size="small">Your transactions will appear here...</Text>}
          <TransactionWidget showComplete wide />
        </Collapsible>
      </Box>
    </Box>
  );
};

export default YieldSettings;
