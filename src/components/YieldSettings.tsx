import React, { useContext, useState } from 'react';
import { Anchor, Box, Button, Text } from 'grommet';
import { FiCopy, FiExternalLink, FiX } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';
import { abbreviateHash } from '../utils/appUtils';
import YieldAvatar from './YieldAvatar';

const YieldSettings = ({ setConnectOpen, setSettingsOpen }: any) => {
  const {
    chainState: { account, chainId },
  } = useContext(ChainContext);

  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const connectType: string = 'Metamask';

  const handleChangeConnectType = () => {
    setSettingsOpen(false);
    setConnectOpen(true);
  };

  const handleCopy = (text: any) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box basis="auto" width="medium" pad="small" gap="small">
      <Box justify="between" align="center" direction="row">
        <Text>Account</Text>
        <Button icon={<FiX size="1.5rem" />} onClick={() => setSettingsOpen(false)} plain />
      </Box>
      <Box border={{ color: '#2563EB', size: 'xsmall' }} gap="small" pad="small" round="small">
        <Box justify="between" align="center" direction="row">
          <Text size="small">Connected with {connectType}</Text>
          <Button
            style={{ backgroundColor: '#DBEAFE' }}
            onClick={handleChangeConnectType}
            label="Change"
            size="small"
          />
        </Box>
        <Box align="center" direction="row" gap="xsmall">
          <YieldAvatar address={account.concat('y')} size={1.2} />
          <Text size="xlarge">{abbreviateHash(account)}</Text>
        </Box>
        <Box align="center" direction="row" gap="xsmall">
          <Button alignSelf="center" margin="xsmall" onClick={() => handleCopy(account)}>
            <FiCopy size="1rem" />
            <Text margin="xsmall" size="small">
              {copySuccess ? 'Copied' : 'Copy Address'}
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
    </Box>
  );
};

export default YieldSettings;
