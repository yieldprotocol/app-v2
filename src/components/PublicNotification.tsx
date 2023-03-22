import { useContext } from 'react';
import { Box, ResponsiveContext, Text } from 'grommet';
import { FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import useChainId from '../hooks/useChainId';

type PublicNotificationProps = {
  children?: any;
};

const PublicNotification = ({ children }: PublicNotificationProps) => {
  const chainId = useChainId();
  return (
    <>
      {chainId === 1 ? (
        <Box direction="row" align="center" justify="between">
          <Box
            direction="row"
            border={{ color: 'red', size: 'small' }}
            pad="small"
            gap="small"
            align="center"
            round="xsmall"
          >
            <Text color="red" size="large">
              <FiAlertTriangle />
            </Text>
            <Text color="red" size="xsmall">
              Full functionality is temporarily resticted on Ethereum mainnet.
            </Text>
          </Box>
        </Box>
      ) : null}
    </>
  );
};

export default PublicNotification;
