import { Box, Text } from 'grommet';
import React from 'react';
import { FiArrowLeftCircle as BackIcon } from 'react-icons/fi';
import styled from 'styled-components';

const StyledBox = styled(Box)`

-webkit-transition: transform 0.3s ease-in-out;
-moz-transition: transform 0.3s ease-in-out;
transition: transform 0.3s ease-in-out;

/* :hover {
  transform: scale(1.05);
} */
`;

function BackButton({ action }: { action:()=>void }) {
  return (
    <StyledBox direction="row" onClick={() => action()} gap="small">
      <BackIcon />
      <Text size="small">Back</Text>
    </StyledBox>
  );
}

export default BackButton;
