import React from 'react';
import { Box, BoxProps } from 'grommet';

interface IListWrap extends BoxProps {
  children: any;
}

function ListWrap({ children, ...props }: IListWrap) {
  return (
    <Box
      pad={{ horizontal: 'medium', bottom: 'xlarge', top: 'xsmall' }}
      gap="small"
      height={{ max: '350px' }}
      width="300px"
      margin={{ bottom: '3em' }}
      {...props}
    >
      {children}
    </Box>
  );
}

export default ListWrap;
