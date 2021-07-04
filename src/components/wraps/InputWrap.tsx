import React, { useContext } from 'react';
import { Box, BoxProps, Text, ResponsiveContext } from 'grommet';
import styled, { css } from 'styled-components';
import { modColor } from '../../utils/displayUtils';

interface IInputWrap extends BoxProps {
  action?: ()=>void;
  disabled?: boolean;
  isError?:string|null;
  children: any;
}

const InsetBox = styled(Box)`
border-radius: 8px;
box-shadow: inset 1px 1px 1px #DDD,
 inset -0.25px -0.25px 0.25px #DDD;
`;

function InputWrap({ action, disabled, isError, children, ...props }: IInputWrap) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box>
      <InsetBox
        {...props}
        direction="row"
        round="xsmall"
        // border={disabled ? { color: 'text-xweak' } : true}
        pad={{ horizontal: 'small' }}
        align="center"
        basis={mobile ? '50%' : '65%'}
        background={isError ? 'pink' : undefined}
      >
        { children }
      </InsetBox>
      <Box>
        <Text style={{ position: 'absolute' }} color="pink" size="xsmall"> {isError} </Text>
      </Box>
    </Box>

  );
}

InputWrap.defaultProps = { action: () => null, disabled: false, isError: null };

export default InputWrap;
