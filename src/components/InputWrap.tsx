import React from 'react';
import { Box, BoxProps, Text } from 'grommet';

interface IInputWrap extends BoxProps {
  action?: ()=>void;
  children: any;
}

function InputWrap({ action, children, ...props }: IInputWrap) {
  return (
    <Box
      {...props}
      // onClick={() => action && action()}
      hoverIndicator={{ size: 'large' }}
      direction="row"
      round="xxsmall"
      border
      pad={{ horizontal: 'small' }}
      align="center"
    >
      {children}
    </Box>
  );
}

InputWrap.defaultProps = { action: () => null };

export default InputWrap;
