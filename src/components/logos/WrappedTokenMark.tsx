import React from 'react';
import { Avatar, Box } from 'grommet';

const WrappedTokenMark = ({ tokenMark }: any) => (
  <Box direction="row" align="center">
    <Avatar border={{ color: '#444444' }} size='xsmall' alignContent='center' pad='2px'>
    {/* <Avatar border={{ color: '#444444' }} pad='2px'> */}
     {tokenMark}
    {/* </Avatar>  */}
    </Avatar>
  </Box>
);

export default WrappedTokenMark;
