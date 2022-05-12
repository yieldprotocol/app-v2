import { Avatar, Box, Button, Text } from 'grommet';
import React, { useState } from 'react';
import { FiChevronLeft } from 'react-icons/fi';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  -webkit-transition: transform 0.5s ease-in-out;
  -moz-transition: transform 0.5s ease-in-out;
  transition: transform 0.5s ease-in-out;
  padding: 0;
  :hover {
    transform: scale(1.25);
    color: #444444;
  }
  :active {
    transform: scale(1);
  }
`;

function BackButton({ action }: { action: () => void }) {
  const [hover, setHover] = useState<boolean>(false);
  return (
    <Box align="center" direction="row">
      <StyledButton
        color="grey"
        onClick={() => action()}
        icon={
          <Avatar
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            size="2em"
            pad="xsmall"
            elevation={hover ? 'small' : undefined}
          >
            {hover && <Text color='text' size="0.5em" weight='lighter'> Back </Text>}
            {!hover &&   <Text color='text'><FiChevronLeft /> </Text>}
          </Avatar>
        }
      />
    </Box>
  );
}

export default React.memo(BackButton);
