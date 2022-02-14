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
        <Box pad='xsmall'>
        <Text size="small" color={connectionName === 'metamask' ? undefined : 'text-xweak'}>
          Network
        </Text>
        </Box>

        <Box pad='xsmall' round background='lightblue'>
          <NetworkSelector />

        </Box>
        
      </Box>
    </Box>
  );
};

export default AdvancedSetting;
