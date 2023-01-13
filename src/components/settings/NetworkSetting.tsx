import { Box, Text } from 'grommet';
import NetworkSelector from '../selectors/NetworkSelector';

const AdvancedSetting = () => {
  return (
    <Box direction="row" justify="between">
      <Box alignSelf="center">
        <Text size="small">Connected Network</Text>
      </Box>
      <NetworkSelector background="#BFDBFE" />
    </Box>
  );
};

export default AdvancedSetting;
