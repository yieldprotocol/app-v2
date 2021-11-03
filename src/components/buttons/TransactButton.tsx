import React from 'react';
import { Box, Button } from 'grommet';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  /* height: ${(props: any) => (props.mobile ? '3rem' : '3rem')}; */
  border: 2px solid white; 
  
  :hover {
    transform: scale(1.01);
    border: 2px solid #ffffff00;
  }
`;

const TransactButton = (props: any) => (
  <Box gap="xsmall">
    {props.confirmationElement}
    <StyledButton {...props} color="gradient" />
  </Box>
);

export default TransactButton;
