import React, { useContext } from 'react';
import { Box, Layer, Text } from 'grommet';
import { FiAlertCircle } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';

const NetworkError = () => {
  const { chainState : { CHAIN_INFO } } = useContext(ChainContext);

  return (
    <Layer>
      <Box pad="medium" round="small" gap="small" align='center' width='600px'>

      <FiAlertCircle size='2em'/> <Text size='large'>  Oops. Unsupported network</Text>

        <Text size='small'> Please connect your wallet to one of the supported networks: </Text>
        <Box direction='row' gap='xsmall'>
          {[...CHAIN_INFO.values()].map((c) => (
            <Text color={c.color} size='small' key={c.name}>
              {c.supported && c.name}
            </Text>
          ))}
        </Box>
      </Box>
    </Layer>
  );
};

export default NetworkError;
