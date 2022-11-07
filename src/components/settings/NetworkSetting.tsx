import { Box, Text } from 'grommet';
import NetworkSelector from '../selectors/NetworkSelector';
import { useAccount } from 'wagmi';

const AdvancedSetting = () => {
  const { connector } = useAccount();

  return (
    <Box direction="row" justify="between">
      <Box alignSelf="center">
        <Text size="small" >
          Connected Network 
        </Text>
      </Box>
      <Box pad={{ vertical: "xsmall", horizontal: "small" }} round background="#BFDBFE" fill="vertical">
        <NetworkSelector />
      </Box>
    </Box>
  );
};

export default AdvancedSetting;
