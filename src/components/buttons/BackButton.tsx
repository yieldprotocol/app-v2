import { Box, Button, ResponsiveContext } from 'grommet';
import React, { useContext } from 'react';
import { FiArrowLeft, FiRewind } from 'react-icons/fi';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  padding: 0;
  :hover {
    transform: scale(1.5);
    color: #444444;
  }
  :active {
    transform: scale(1);
  }
`;

function BackButton({ action }: { action: () => void }) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box align="center" direction="row">
      <StyledButton color='grey' onClick={() => action()} icon={<FiRewind size='1.25em' />} />
    </Box>
  );
}

export default React.memo(BackButton);
