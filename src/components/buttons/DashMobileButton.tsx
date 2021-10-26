import { Avatar, Box, Button, ResponsiveContext, Text } from 'grommet';
import React, { useContext, useState } from 'react';
import { RiDashboard3Line } from 'react-icons/ri';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { ChainContext } from '../../contexts/ChainContext';

// look to see if there is a better way
const StyledBox = styled(Box)`
  position: absolute;
  bottom: 3rem;
  right: 1rem;
  z-index: 500;
`;

function DashMobileButton({ transparent }: { transparent?: boolean }) {
  const routerHistory = useHistory();
  const {
    chainState: {
      connection: { account },
    },
  } = useContext(ChainContext);

  return account ? (
    <StyledBox align="center" direction="row">
      <Avatar
        size="medium"
        background={transparent ? 'gradient-transparent' : 'gradient'}
        elevation="small"
        onClick={() => routerHistory.push(`/dashboard`)}
      >
        {/* <RiDashboard3Line size={mobile ? '2em' : '2em'} /> */}
        <Text size="xsmall"> Dash </Text>
      </Avatar>
    </StyledBox>
  ) : null;
}

DashMobileButton.defaultProps = { transparent: false };

export default DashMobileButton;
