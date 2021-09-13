import React, { ReactElement, useContext } from 'react';
import { Box, BoxProps, Text, ResponsiveContext } from 'grommet';
import styled, { css } from 'styled-components';
import { modColor } from '../../utils/appUtils';

interface IInputWrap extends BoxProps {
  action?: () => void;
  disabled?: boolean;
  isError?: string | null;
  showErrorText?: boolean;
  message?: string | ReactElement | undefined;
  children: any;
}

const InsetBox = styled(Box)`
  border-radius: 5px;
  box-shadow: inset 1px 1px 1px #ddd, inset -0.25px -0.25px 0.25px #ddd;
`;

function InputWrap({ action, disabled, isError, showErrorText, message, children, ...props }: IInputWrap) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box height={{ min: '3em' }} gap="small">
      <InsetBox
        {...props}
        direction="row"
        round="xsmall"
        align="center"
        background={isError ? 'pink' : 'solid'}
        pad={{ horizontal: 'small' }}
      >
        {children}
      </InsetBox>

      <Box >
        {!mobile && (
          <Text style={{ position: 'absolute' }} size="xsmall">
            {showErrorText && isError}
            {message}
          </Text>
        )}
      </Box>
    </Box>
  );
}

InputWrap.defaultProps = {
  action: () => null,
  disabled: false,
  isError: null,
  showErrorText: false,
  message: undefined,
};

export default InputWrap;
