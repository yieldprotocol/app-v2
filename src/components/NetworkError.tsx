import React, { useContext } from 'react';
import { Box, Layer, Text } from 'grommet';
import { ChainContext } from '../contexts/ChainContext';

const NetworkError = () => {
  const { chainState : { CHAIN_INFO } } = useContext(ChainContext);

  return (
    <Layer>
      <Box pad="medium" round="small" gap="small" align='center' width='600px'>

        <Text size='large'> Unsupported network</Text>
        
        <Text size='small'> Currently supported networks: </Text>
        <Box align="center">
          {[...CHAIN_INFO.values()].map((c) => (
            <Text size='small' key={c.name}>
              {c.supported && c.name}
            </Text>
          ))}
        </Box>
      </Box>
    </Layer>
  );
};

export default NetworkError;
