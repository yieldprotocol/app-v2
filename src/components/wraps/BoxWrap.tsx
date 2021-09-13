import React, { useContext } from 'react';
import { Box, ResponsiveContext } from 'grommet';
import styled from 'styled-components';
import { FiSliders } from 'react-icons/fi';


const StyledBox = styled(Box)`
-webkit-transition: transform 0.3s ease-in-out;
-moz-transition: transform 0.3s ease-in-out;
transition: transform 0.3s ease-in-out;
background 0.3s ease-in-out;
:hover {
  transform: scale(1.1);
}
`;

const BoxWrap = (props:any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  return (
    <StyledBox {...props}>
      {props.children}
    </StyledBox>
  );
}

export default BoxWrap;
