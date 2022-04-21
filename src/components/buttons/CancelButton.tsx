import { Box, Text } from 'grommet';
import { useState } from 'react';
import { FiXCircle } from 'react-icons/fi';
import styled from 'styled-components';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.01);
  }
`;

function CancelButton({ action }: { action: () => void }) {
  const [hover, setHover] = useState<boolean>();
  return (
    <StyledBox
      direction="row"
      onClick={() => action()}
      gap="xsmall"
      align="center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Text size="xsmall" color={hover ? 'text' : 'text-weak'}>
        Cancel
      </Text>
      <FiXCircle color={hover ? 'text' : 'text-weak'} size="0.75em" />
    </StyledBox>
  );
}

export default CancelButton;
