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
  width: 5rem;
  border-radius: 20px;
  font-size: 0.6rem;
  text-align: center;
  color: #2563eb;

  :hover {
    border: 2px solid #1d4ed8;
  }
`;

const YieldSettings = ({ setConnectOpen, setSettingsOpen }: any) => {
  const {
    chainState: { account, chainName, provider },
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
    <Box basis="auto" width="medium">
      <Box pad="small" gap="small" direction="row" justify="between">
        <Text>Account</Text>
        <Button icon={<FiX size="1.5rem" />} onClick={() => setSettingsOpen(false)} plain />
      </Box>
      <Box
        border={{ color: '#DBEAFE', size: 'xsmall', side: 'top' }}
        gap="xsmall"
        pad={{ horizontal: 'medium', vertical: 'small' }}
      >
        <Box justify="between" align="center" direction="row">
          {connectorName && <Text size="small">Connected with {connectorName}</Text>}
          <ChangeButton onClick={handleChangeConnectType}>Change</ChangeButton>
        </Box>
        <Box justify="between" align="center" direction="row">
          <Box direction="row" align="center" gap="xsmall">
            <YieldAvatar address={account} size={2} />
            <Text size="xlarge">{abbreviateHash(account)}</Text>
          </Box>
        </Box>
        <Box align="center" direction="row" gap="xsmall">
          <Button margin="xsmall" onClick={() => handleCopy(account)}>
            {copySuccess ? <FiCheckSquare size="1rem" /> : <FiCopy size="1rem" />}
            <Text margin="xsmall" size="small">
              {copySuccess ? 'Copied' : 'Copy Address'}
            </Text>
          </Button>
          <Anchor
            alignSelf="center"
            href={`https://${chainName}.etherscan.io/address/${account}`}
            margin="xsmall"
            target="_blank"
          >
            <FiExternalLink size="1rem" />
            <Text margin="xsmall" size="small">
              View on Explorer
            </Text>
          </Anchor>
        </Box>
      </Box>
      <Box align="center" direction="row" border={{ color: '#DBEAFE', size: 'xsmall', side: 'top' }} pad="medium">
        <AdvancedSettings />
      </Box>
      <Box
        border={{ color: '#DBEAFE', size: 'xsmall', side: 'top' }}
        pad="medium"
        gap="small"
        direction="row"
        justify="between"
        background="#F3F4F6"
        round={{ size: 'medium', corner: 'bottom' }}
      >
        <Text size="medium">Your transactions will appear here...</Text>
      </Box>
    </Box>
  );
};

export default YieldSettings;
