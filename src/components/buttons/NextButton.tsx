import React from 'react';
import { Box, Button, Text } from 'grommet';
import { FiAlertTriangle } from 'react-icons/fi';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  /* height: ${(props: any) => (props.mobile ? '2em' : '4.5em')}; */
  :hover {
    box-shadow: 0px 0px 0px 1px;
  }
  :disabled {
    box-shadow: none;
  }
`;

const NextButton = (props: any) => (
  <Box>
    <StyledButton
      {...props}
      color={props.errorLabel ? 'error' : undefined}
      label={
        props.errorLabel ? (
          <Box direction="row" gap="small" align="center" fill justify="center">
            <Text color="error">
              <FiAlertTriangle style={{ verticalAlign: 'middle' }} />
            </Text>
            <Text color="error" size="xsmall">
              {props.errorLabel}
            </Text>
          </Box>
        ) : (
          props.label
        )
      }
    />
  </Box>
);

export default NextButton;
