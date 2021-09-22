import React from 'react';
import { Box, Layer, Text } from 'grommet';
import { chainData } from '../contexts/ChainContext';

const NetworkError = () => (
  <Layer>
    <Box pad="medium" round="small" gap="small">
      Unsupported network. Please select from the following supported networks:
      <Box align="center">
        {chainData &&
          [...chainData.values()].map((c) => (
            <Text color="black" key={c.name}>
              {c.supported && c.name}
            </Text>
          ))}
      </Box>
    </Box>
  </Layer>
);

export default NetworkError;
