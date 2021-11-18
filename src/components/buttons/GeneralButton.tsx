import React from 'react';
import { Box } from 'grommet';
import styled from 'styled-components';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.1);
  }
  :active {
    transform: scale(1);
  }
`;

const GeneralButton = (props: any) => (
  <StyledBox
    background={props.background}
    round="xsmall"
    elevation="xsmall"
    onClick={props.disabled ? () => null : () => props.action()}
    pad="small"
    align="center"
  >
    {props.children}
  </StyledBox>
);

export default GeneralButton;
