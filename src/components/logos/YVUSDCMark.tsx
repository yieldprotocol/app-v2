import React from 'react';
import { Avatar, Stack, Box } from 'grommet';
import USDCMark from './USDCMark';
import YFIMark from './YFIMark';

const YVUSDCMark = () => (
  <Box>
    <Avatar background="white">
      <YFIMark color='red' />
    </Avatar>
    </Box>
);

export default YVUSDCMark;
