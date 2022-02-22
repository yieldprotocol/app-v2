import { Avatar, Box, Text } from 'grommet';
import React, { useState } from 'react';
import { FiLogOut } from 'react-icons/fi';
import styled from 'styled-components';

const StyledAvatar = styled(Avatar)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.3);
  }
  :active {
    transform: scale(1);
  }
`;

function ExitButton({ action }: { action: () => void }) {
  const [hover, setHover] = useState<boolean>(false);

  return (
    <Box
      direction="row"
      margin={{ vertical: '-0.5em', horizontal: '1.0em' }}
      fill="horizontal"
      justify="end"
    >
      <StyledAvatar
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => action()}
        size="3em"
        elevation="small"
        background="background"
      >
        {hover && <Text size="0.5em"> Close </Text>}
        <FiLogOut color={hover ? 'text' : 'text-weak'} />
      </StyledAvatar>
    </Box>
  );
}

export default React.memo(ExitButton);
