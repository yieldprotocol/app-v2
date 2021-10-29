import { Box, Button, Text } from 'grommet';
import React from 'react';
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
      color={props.errorLabel ? 'red' : undefined}
      label={
        props.errorLabel ? (
          <Box direction="row" gap="small" align="center" fill justify="center">
            <Text color="red">
              <FiAlertTriangle style={{ verticalAlign: 'middle' }} />
            </Text>
            <Text color="red" size="xsmall">
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
