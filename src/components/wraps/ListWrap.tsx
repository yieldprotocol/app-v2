import React, { useContext } from 'react';
import { Box, BoxProps, Text, ResponsiveContext } from 'grommet';

interface IListWrap extends BoxProps {
  children: any;
}

function ListWrap({ children, ...props }: IListWrap) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box
      style={{ overflow: 'auto' }}
      pad={{ horizontal: 'medium', bottom: 'large', top: 'small' }}
      gap="small"
      height={{ max: '300px' }}
    >
      {children}
    </Box>
  );
}

export default ListWrap;
