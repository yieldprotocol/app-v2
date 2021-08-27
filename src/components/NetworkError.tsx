import React from 'react';
import { Box, Layer } from 'grommet';

const NetworkError = () => (
  <Layer>
    <Box pad="medium" round="small">
      Unsupported network. Please select a different network.
    </Box>
  </Layer>
);

export default NetworkError;
