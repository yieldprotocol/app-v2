import React from 'react';
import { Box } from 'grommet';
import styled from 'styled-components';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.05);
  }
  :active {
    transform: scale(1);
  }
`;

function ItemWrap({ action, index, children }: { children: any; index: number; action: () => void }) {
  return (
    <StyledBox
      animation={{ type: 'fadeIn', delay: index * 100, duration: 1500 }}
      hoverIndicator={{ elevation: 'large', background: 'solid' }}
      onClick={() => action()}
      round="xsmall"
      elevation="xsmall"
      flex={false}
      fill="horizontal"
      background='solid'
    >
      {children}
    </StyledBox>
  );
}

export default ItemWrap;
