import React, { ComponentPropsWithoutRef } from 'react';
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

interface Props extends ComponentPropsWithoutRef<typeof StyledBox> {}

const GeneralButton = (props: Props) => (
  <StyledBox
    background={props.background}
    round
    elevation="xsmall"
    onClick={props.disabled ? () => null : () => props.action()}
    pad="small"
    align="center"
  >
    {props.children}
  </StyledBox>
);

export default React.memo(GeneralButton);
