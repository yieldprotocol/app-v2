import React, { useContext, useState } from 'react';
import { Anchor, Box, Button, Text } from 'grommet';
import { FiCheckSquare, FiCopy, FiExternalLink, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { ChainContext, connectorNames } from '../contexts/ChainContext';
import { abbreviateHash } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';
import AdvancedSettings from './AdvancedSettings';

const ChangeButton = styled(Button)`
  background: #dbeafe;
  border: 2px solid #3b82f6;
  height: 2rem;
  width: 3.5rem;
  border-radius: 6px;
  font-size: 0.6rem;
  text-align: center;
  color: #2563eb;

  :hover {
    border: 2px solid #1d4ed8;
  }
`;

const YieldSettings = ({ setSettingsOpen, setConnectOpen }: any) => {
  const {
    chainState: { account, chainData, provider },
  } = useContext(ChainContext);
  const connectorName = connectorNames.get(provider.connection.url);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

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
    <Box fill="vertical" width="medium">
      <Box pad="small" gap="small" direction="row" justify="between">
        <Text>Account</Text>
        <Button icon={<FiX size="1.5rem" />} onClick={() => setSettingsOpen(false)} plain />
      </Box>
      <Box
        border={{ color: '#DBEAFE', size: 'xsmall', side: 'top' }}
        gap="small"
        pad={{ horizontal: 'medium', vertical: 'small' }}
      >
        <Box justify="between" align="center" direction="row">
          {connectorName && <Text size="small">Connected with {connectorName}</Text>}
          <ChangeButton onClick={handleChangeConnectType}>Change</ChangeButton>
        </Box>
        <Box justify="between" align="center" direction="row">
          <Box direction="row" align="center" gap="small">
            <YieldAvatar address={account} size={2} />
            <Text size="xlarge">{abbreviateHash(account)}</Text>
          </Box>
        </Box>
        <Box align="center" direction="row" gap="small">
          <Button margin="xsmall" onClick={() => handleCopy(account)}>
            {copySuccess ? (
              <FiCheckSquare size="1rem" style={{ verticalAlign: 'middle' }} />
            ) : (
              <FiCopy size="1rem" style={{ verticalAlign: 'middle' }} />
            )}
            <Text margin="xsmall" size="small">
              {copySuccess ? 'Copied' : 'Copy Address'}
            </Text>
          </Button>
          <Anchor href={`https://${chainData.name}.etherscan.io/address/${account}`} margin="xsmall" target="_blank">
            <FiExternalLink size="1rem" style={{ verticalAlign: 'middle' }} />
            <Text margin="xsmall" size="small">
              View on Explorer
            </Text>
          </Anchor>
        </Box>
      </Box>
      <Box margin={{ top: 'auto' }}>
        <Box align="center" direction="row" border={{ color: '#DBEAFE', size: 'xsmall', side: 'top' }} pad="medium">
          <AdvancedSettings />
        </Box>
        <Box
          border={{ color: '#DBEAFE', size: 'xsmall', side: 'top' }}
          pad="medium"
          gap="small"
          direction="row"
          background="#F3F4F6"
          height={{ min: 'medium' }}
        >
          <Text size="medium">Your transactions will appear here...</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default YieldSettings;
