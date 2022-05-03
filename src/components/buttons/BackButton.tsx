import { Avatar, Box, Button } from 'grommet';
import React from 'react';
import { FiRewind } from 'react-icons/fi';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  padding: 0;
  :hover {
    transform: scale(1.2);
    color: #444444;
  }
  :active {
    transform: scale(1);
  }
`;

function BackButton({ action }: { action: () => void }) {
  return (
    <Box align="center" direction="row">
      <StyledButton
        color="grey"
        onClick={() => action()}
        icon={
          <Avatar size="2em" pad="xsmall" elevation="xsmall">
            <FiRewind />
          </Avatar>
        }
      />
    </Box>
  );
}

export default React.memo(BackButton);
