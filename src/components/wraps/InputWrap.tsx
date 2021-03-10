import React from 'react';
import { Box, BoxProps } from 'grommet';

interface IInputWrap extends BoxProps {
  action?: ()=>void;
  children: any;
}

function InputWrap({ action, children, ...props }: IInputWrap) {
  return (
    <Box
      {...props}
      direction="row"
      round="xsmall"
      border
      pad={{ horizontal: 'small' }}
      align="center"
    >
      { children }
    </Box>
  );
}

InputWrap.defaultProps = { action: () => null };

export default InputWrap;
