import React, { useContext, useState } from 'react';
import { Anchor, Box, Button, Text } from 'grommet';
import { FiCopy, FiExternalLink, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { ChainContext } from '../contexts/ChainContext';
import { abbreviateHash } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';

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
    chainState: { account, chainId },
  } = useContext(ChainContext);

  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const connectorName: string = 'Metamask';

  const handleChangeConnectType = () => {
    setSettingsOpen(false);
    setConnectOpen(true);
  };

  const handleCopy = (text: any) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleChangeAvatar = () => {
    console.log('changing avatar');
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
          <Text size="small">Connected with {connectorName}</Text>
          <ChangeButton onClick={handleChangeConnectType}>Change</ChangeButton>
        </Box>
        <Box justify="between" align="center" direction="row">
          <Box direction="row" align="center" gap="xsmall">
            <YieldAvatar address={account} size={2} />
            <Text size="xlarge">{abbreviateHash(account)}</Text>
          </Box>
          <ChangeButton onClick={handleChangeAvatar}>New Avatar</ChangeButton>
        </Box>
        <Box align="center" direction="row" gap="xsmall">
          <Button alignSelf="center" margin="xsmall" onClick={() => handleCopy(account)}>
            <FiCopy size="1rem" />
            <Text margin="xsmall" size="small">
              {copySuccess ? 'Address Copied' : 'Copy Address'}
            </Text>
          </Button>
          <Anchor alignSelf="center" href={`https://etherscan.io/address/${account}`} margin="xsmall" target="_blank">
            <FiExternalLink size="1rem" />
            <Text margin="xsmall" size="small">
              View on Explorer
            </Text>
          </Anchor>
        </Box>
        <Text color="#6B7280" size="small">
          Connected to Chain ID {chainId}
        </Text>
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
