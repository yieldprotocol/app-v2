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
      { chainId === 1 ?
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
              Transactions via the UI have been paused due to a reported issue. All funds are safe. 
              Please follow our <a href="https://twitter.com/yield"><Text color="red" size="xsmall">Twitter account</Text></a> for more information.
            </Text>
          </Box>
        </Box>
       : null
       }
    </>
  );
};

export default PublicNotification;
