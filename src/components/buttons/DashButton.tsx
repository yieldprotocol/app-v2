import { Box, Button, ResponsiveContext, Text } from 'grommet';
import React, { useContext, useState } from 'react';
import { RiDashboard2Line } from 'react-icons/ri';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  padding: 0;
  :hover {
    transform: scale(1.1);
    // color: #1d4ed8;
  }
  :active {
    transform: scale(1);
  }
`;

function DashButton() {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const routerHistory = useHistory();

  return (
    <Box align="center" direction="row">
      <StyledButton onClick={() => routerHistory.push(`/dashboard`) } icon={<RiDashboard2Line size={mobile ? '1em' : '1em'} />} />
    </Box>
  );
}

// BackButton.defaultProps = { color: 'grey' };

export default DashButton;
