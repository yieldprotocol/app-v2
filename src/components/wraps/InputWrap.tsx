import React, { ReactElement, useContext } from 'react';
import { Box, BoxProps, Text } from 'grommet';
import styled, { ThemeContext } from 'styled-components';

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
  box-shadow: ${(props) =>
    props.theme.dark
      ? 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30'
      : 'inset 1px 1px 1px #ddd, inset -0.25px -0.25px 0.25px #ddd'};
`;

function InputWrap({ action, disabled, isError, showErrorText, message, children, ...props }: IInputWrap) {
  const theme = useContext<any>(ThemeContext);
  return (
    <Box height={{ min: '3em' }} gap="small">
      <InsetBox
        {...props}
        theme={theme}
        direction="row"
        round="xsmall"
        align="center"
        background={isError ? 'error' : 'hoverBackground'}
        pad={{ horizontal: 'small' }}
      >
        {children}
      </InsetBox>

      <Box>
        <Text style={{ position: 'absolute' }} size="xsmall">
          {showErrorText && isError}
          {message}
        </Text>
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
