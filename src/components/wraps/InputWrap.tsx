import React, { useContext } from 'react';
import { Box, BoxProps, ResponsiveContext } from 'grommet';

interface IInputWrap extends BoxProps {
  action?: ()=>void;
  children: any;
}

function InputWrap({ action, children, ...props }: IInputWrap) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box
      {...props}
      direction="row"
      round="xsmall"
      border
      pad={{ horizontal: 'small' }}
      align="center"
      basis={mobile ? '50%' : '65%'}
    >
      { children }
    </Box>
  );
}

InputWrap.defaultProps = { action: () => null };

export default InputWrap;
