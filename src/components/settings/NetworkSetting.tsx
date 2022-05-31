import { useContext } from 'react';
import { Box, Text } from 'grommet';
import { ChainContext } from '../../contexts/ChainContext';
import NetworkSelector from '../selectors/NetworkSelector';

const AdvancedSetting = () => {
  const {
    chainState: {
      connection: { connectionName },
    },
  } = useContext(ChainContext);

  return (
    <Box direction="row" justify="between">
      <Box alignSelf="center">
        <Text size="small" color={connectionName === 'metamask' ? undefined : 'text-xweak'}>
          Network
        </Text>
      </Box>
      <Box pad="xsmall" round background="lightblue" fill="vertical">
        <NetworkSelector />
      </Box>
    </Box>
  );
};

export default AdvancedSetting;
