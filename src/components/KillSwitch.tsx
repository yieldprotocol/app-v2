import { Box, Layer, Text } from 'grommet';
import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import useChainId from '../hooks/useChainId';

/* A kill switch is a way to disable the entire app. It is set in the .env file. ( AND next.config.js ) */
const KillSwitch = (props: any) => {
  const chainId = useChainId();

  return (
    <>
      {false && process.env.KILLSWITCH_ACTIVE === 'true' && chainId === parseInt(process.env.KILLSWITCH_CHAIN!) ? (
        <Layer>
          <Box background="white" pad="large" round="16px" gap="medium">
            <Box direction="row" gap="small" align="center">
              <FiAlertCircle size="2em" />
              <Text> Yield Protocol UI is temporarily disabled.</Text>
            </Box>
            <Box direction="row" gap="small">
              <Text size="xsmall" weight={'bold'}>
                Details:
              </Text>
              <Text size="xsmall" weight={'normal'}>
                {process.env.KILLSWITCH_TEXT}
              </Text>
            </Box>

            <Box direction="row" gap="small">
              <Text size="xsmall" weight={'bold'}>
                Affects Chain:
              </Text>
              <Text size="xsmall" weight={'normal'}>
                {parseInt(process.env.KILLSWITCH_CHAIN!) === 1 ? 'Ethereum Mainnet' : 'Arbitrum One'}
              </Text>
            </Box>
          </Box>
        </Layer>
      ) : (
        <>{props.children}</>
      )}
    </>
  );
};

export default KillSwitch;
