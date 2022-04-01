import { Box, Button, ResponsiveContext } from 'grommet';
import React, { useContext } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  color: #3f53d9;
  padding: 0;
  :hover {
    transform: scale(1.1);
    color: #1d4ed8;
  }
  :active {
    transform: scale(1);
  }
`;

function BackButton({ action }: { action: () => void }) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  // arbitrary comment for commit

  return (
    <Box align="center" direction="row">
      <StyledButton onClick={() => action()} icon={<FiArrowLeft size={mobile ? '1.5em' : '1.5em'} />} />
    </Box>
  );
}

export default React.memo(BackButton);
