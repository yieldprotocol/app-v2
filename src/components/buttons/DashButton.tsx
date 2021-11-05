import { Box, Button, ResponsiveContext, Text } from 'grommet';
import React, { useContext, useState } from 'react';
import { RiDashboard2Line, RiDashboard3Line } from 'react-icons/ri';
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
    <Box align="center" direction="row" >
      <StyledButton onClick={() => routerHistory.push(`/dashboard`)}>
        <Box direction="row" align="center" gap="small">
          <RiDashboard3Line size={mobile ? '1em' : '1em'} />
          {mobile ? <Text size="small">Dashboard</Text> : null}
        </Box>
      </StyledButton>
    </Box>
  );
}

export default DashButton;
