import React, { useContext, useState } from 'react';
import { Anchor, Box, Button, Collapsible, Layer, ResponsiveContext, Text, Tip } from 'grommet';
import { FiCheckSquare, FiCopy, FiChevronUp, FiChevronDown, FiExternalLink, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { ChainContext, connectorNames } from '../contexts/ChainContext';
import { abbreviateHash } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';
import AdvancedSettings from './AdvancedSettings';
import { TxContext } from '../contexts/TxContext';
import TransactionList from './TransactionList';
import CopyWrap from './wraps/CopyWrap';

const StyledButton = styled(Button)`
  background: #dbeafe;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  font-size: 0.6rem;
  text-align: center;
  color: #2563eb;
  width: 4rem;

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
    txState: { transactions },
  } = useContext(TxContext);
  const connectorName = connectorNames.get(provider.connection.url);
  const [transactionsOpen, toggleTransactionsOpen] = useState<boolean>(false);

  const handleChangeConnectType = () => {
    setSettingsOpen(false);
    setConnectOpen(true);
  };

  const handleResetApp = () => {
    localStorage.clear();
    // eslint-disable-next-line no-restricted-globals
    location.reload();
  };

  return (
    <Box
      fill="vertical"
      width={mobile ? undefined : '400px'}
      background="white"
      // border={{ side: 'left', color: 'tailwind-blue-100' }}
      elevation="xlarge"
    >
      <Box gap="small" pad="small">
        <Button alignSelf="end" icon={<FiX size="1.5rem" />} onClick={() => setSettingsOpen(false)} plain />
        
        <Box align="center" gap="medium">
          <YieldAvatar address={account} size={5} />
          <CopyWrap><Text size="xlarge">{abbreviateHash(account, 6)}</Text></CopyWrap>
        </Box>

        <Box align="center" direction="row" gap="small" justify="center">
          <Anchor href={`https://${chainData.name}.etherscan.io/address/${account}`} margin="xsmall" target="_blank">
            <FiExternalLink size="1rem" style={{ verticalAlign: 'middle' }} />
            <Text margin="xxsmall" size="xsmall">
              View on Explorer
            </Text>
          </Anchor>
        </Box>
        <Box justify="between" align="center" direction="row">
          {connectorName && <Text size="small">Connected with {connectorName}</Text>}
          <StyledButton onClick={handleChangeConnectType}>Change</StyledButton>
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
      <Box border={{ color: 'tailwind-blue-100', size: 'xsmall', side: 'top' }} pad="medium">
        <Box alignSelf="end">
          <Tip
            content={<Text size="xsmall">Having issues? Try resetting the app.</Text>}
            dropProps={{
              align: { right: 'left' },
            }}
          >
            <StyledButton onClick={handleResetApp}>App Reset</StyledButton>
          </Tip>
        </Box>
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
          {!transactions.size && <Text size="small">Your transactions will appear here...</Text>}
          <TransactionList transactions={[...transactions.values()]} wide />
        </Collapsible>
      </Box>
    </Box>
  );
};

export default YieldSettings;
