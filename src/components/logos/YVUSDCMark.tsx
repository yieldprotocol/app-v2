import React from 'react';
import { Avatar, Stack } from 'grommet';
import USDCMark from './USDCMark';
import YFIMark from './YFIMark';

const YVUSDCMark = () => (
  <Stack anchor="top-right" alignSelf="start">
    <Avatar size="1.2em">
      <USDCMark />
    </Avatar>

    <Avatar background="white" size="0.75rem">
      <YFIMark />
    </Avatar>
  </Stack>
);

export default YVUSDCMark;
