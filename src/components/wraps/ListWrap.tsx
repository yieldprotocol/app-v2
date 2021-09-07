import React, { useContext } from 'react';
import { Box, BoxProps, ResponsiveContext } from 'grommet';

interface IListWrap extends BoxProps {
  children: any;
}

function ListWrap({ children, ...props }: IListWrap) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box 
      pad={{ horizontal: 'medium', bottom: 'large', top: 'small' }} 
      gap="small" height={{ max: '300px' }} 
      {...props}
    >
      {children}
    </Box>
  );
}

export default ListWrap;
