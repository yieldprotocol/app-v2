import { Avatar, Text } from 'grommet';
import React, { useState } from 'react';
import { FiLogOut } from 'react-icons/fi';
import styled from 'styled-components';

const StyledAvatar = styled(Avatar)`
  position: absolute;
  top: -0.5em;
  right: -1em;
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.25);
  }
  :active {
    transform: scale(1);
  }
`;

function ExitButton({ action }: { action: () => void }) {
  const [hover, setHover] = useState<boolean>(false);

  return (
    <StyledAvatar
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => action()}
      size="3em"
      elevation="small"
      background="background"
    >
      {hover && <Text size="0.5em" weight='lighter'> Close </Text>}
      {!hover && <FiLogOut color={hover ? 'text' : 'text-weak'} />}
    </StyledAvatar>
  );
}

export default React.memo(ExitButton);
