import { ReactElement, useContext } from 'react';
import { Box, BoxProps, Text, ResponsiveContext } from 'grommet';
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
  border-radius: ${(props: any) => ((props.mobile as any) ? `100px` : `100px 0px 0px 100px`)};
  box-shadow: ${(props) =>
    props.theme.dark
      ? 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30'
      : 'inset 1px 1px 1px #ddd, inset -0.25px -0.25px 0.25px #ddd'};
`;

function InputWrap({ action, disabled, isError, showErrorText, message, children, round, ...props }: IInputWrap) {
  const theme = useContext<any>(ThemeContext);
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box height={{ min: '3em' }} gap="small">
      <InsetBox
        {...props}
        theme={theme}
        direction="row"
        align="center"
        background={isError ? 'error' : 'hoverBackground'}
        pad={{ horizontal: 'small', vertical: '1px' }}
        mobile={mobile || round}
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
