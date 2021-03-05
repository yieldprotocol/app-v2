import React from 'react';
import { Box } from 'grommet';

export const MainViewWrap = ({ children }: { children:React.ReactNode }) => (
  <Box
    fill="vertical"
    alignSelf="center"
    gap="large"
    pad="medium"
    width={{ max: '500px' }}
  >
    { children }
  </Box>
);
