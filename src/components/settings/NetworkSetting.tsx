import React, { useContext } from 'react';
import { Box, Text } from 'grommet';
import { SettingsContext } from '../../contexts/SettingsContext';
import { ChainContext } from '../../contexts/ChainContext';
import NetworkSelector from '../selectors/NetworkSelector';

const AdvancedSetting = () => {
  const {
    chainState: {
      connection: { connectionName },
    },
  } = useContext(ChainContext);

  return (
    <Box gap="small" pad={{ vertical: 'small' }}>
      <Box direction="row" justify="between">
        <Text size="small" color={connectionName === 'metamask' ? undefined : 'text-xweak'}>
          Network
        </Text>
        <NetworkSelector />
      </Box>
    </Box>
  );
};

export default AdvancedSetting;
