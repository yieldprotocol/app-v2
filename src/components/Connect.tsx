import React, { useState, useContext } from 'react';
import { Box, Button, Text } from 'grommet';
import { FiX } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';

const Connect = ({ setConnectOpen }: any) => {
  const {
    chainState: { account },
  } = useContext(ChainContext);

  const connectTypes: string[] = ['Metamask', 'Ledger', 'WalletConnect'];

  const handleConnect = (connectType: string) => {
    console.log(`Connecting with ${connectType}`);
  };

  return (
    <Box basis="auto" width="medium" pad="small" gap="small">
      <Box justify="between" align="center" direction="row">
        <Text>Connect</Text>
        <Button icon={<FiX size="1.5rem" />} onClick={() => setConnectOpen(false)} plain />
      </Box>
      <Box gap="xsmall">
        {connectTypes.map((type) => (
          <Box
            key={type}
            onClick={() => handleConnect(type)}
            border={{ color: '#2563EB', size: 'xsmall' }}
            hoverIndicator={{ color: '#2563EB', size: 'xsmall' }}
            pad="small"
            round="small"
          >
            {type}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Connect;
