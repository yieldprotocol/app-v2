import { Box, Text } from 'grommet';
import NetworkSelector from '../selectors/NetworkSelector';
import { useAccount } from 'wagmi';
import BoxWrap from '../wraps/BoxWrap';

const AdvancedSetting = () => {
  const { connector } = useAccount();

  return (
    <Box direction="row" justify="between">
      <Box alignSelf="center">
        <Text size="small" >
          Connected Network 
        </Text>
      </Box>
      <BoxWrap>
      <Box pad={{ vertical: "xsmall", horizontal: "small" }} round background="#BFDBFE" fill="vertical">
        <NetworkSelector />
      </Box>
      </BoxWrap>
    </Box>
  );
};

export default AdvancedSetting;
