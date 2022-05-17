import { Box, Text } from 'grommet';
import { useConnect } from 'wagmi';
import NetworkSelector from '../selectors/NetworkSelector';

const AdvancedSetting = () => {
  const { activeConnector } = useConnect();

  return (
    <Box direction="row" justify="between">
      <Box alignSelf="center">
        <Text size="small" color={activeConnector?.name === 'MetaMask' ? undefined : 'text-xweak'}>
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
