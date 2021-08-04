import React, { useContext } from 'react';
import { Box, BoxProps, Text, ResponsiveContext } from 'grommet';
import styled, { css } from 'styled-components';
import { modColor } from '../../utils/appUtils';

interface IInputWrap extends BoxProps {
  action?: () => void;
  disabled?: boolean;
  isError?: string | null;
  children: any;
}

const InsetBox = styled(Box)`
  border-radius: 5px;
  box-shadow: inset 1px 1px 1px #ddd, inset -0.25px -0.25px 0.25px #ddd;
`;

function InputWrap({ action, disabled, isError, children, ...props }: IInputWrap) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box>
      <InsetBox
        {...props}
        direction="row"
        round="xsmall"
        align="center"
        background={isError ? 'pink' : undefined}
        pad={{ horizontal: 'small', vertical: '1px' }}
      >
        {children}
      </InsetBox>
      <Box>
        <Text style={{ position: 'absolute' }} color="pink" size="xsmall">
          {isError}
        </Text>
      </Box>
    </Box>
  );
}

InputWrap.defaultProps = { action: () => null, disabled: false, isError: null };

export default InputWrap;
