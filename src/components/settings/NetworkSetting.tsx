import { useContext } from 'react';
import { Box, Text } from 'grommet';
import { ChainContext } from '../../contexts/ChainContext';
import NetworkSelector from '../selectors/NetworkSelector';
import { useAccount } from 'wagmi';

const AdvancedSetting = () => {

  const {connector} = useAccount();

  return (
    <Box direction="row" justify="between">
      <Box alignSelf="center">
        <Text size="small" color={connector?.name === 'MetaMask' ? undefined : 'text-xweak'}>
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
