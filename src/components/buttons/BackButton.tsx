import { Box, Text } from 'grommet';
import React, { useState } from 'react';
import { FiArrowLeftCircle } from 'react-icons/fi';
import styled from 'styled-components';

const StyledBox = styled(Box)`
-webkit-transition: transform 0.3s ease-in-out;
-moz-transition: transform 0.3s ease-in-out;
transition: transform 0.3s ease-in-out;
:hover {
  transform: scale(1.01);
}
`;

function BackButton({ action }: { action:()=>void }) {
  const [hover, setHover] = useState<boolean>();
  return (
    <StyledBox
      direction="row"
      onClick={() => action()}
      gap="small"
      align="center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <FiArrowLeftCircle color={hover ? '#333333' : 'grey'} />
      <Text size="small" color={hover ? 'text' : 'text-weak'}>
        go back
      </Text>
    </StyledBox>
  );
}

export default BackButton;
