import React, { useContext } from 'react';
import { Box, BoxProps, Text, ResponsiveContext } from 'grommet';

interface IInputWrap extends BoxProps {
  action?: ()=>void;
  disabled?: boolean;
  isError?:string|null;
  children: any;
}

function InputWrap({ action, disabled, children, ...props }: IInputWrap) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box>
      <Box
        {...props}
        direction="row"
        round="xsmall"
        border
        pad={{ horizontal: 'small' }}
        align="center"
        basis={mobile ? '50%' : '65%'}
        background={props.isError ? 'pink' : undefined}
      >
        { children }
      </Box>
      <Text color="pink" size="xsmall"> {props.isError} </Text>
    </Box>

  );
}

InputWrap.defaultProps = { action: () => null, disabled: false, isError: null };

export default InputWrap;
