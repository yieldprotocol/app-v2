import React from 'react';
import { Box, Text } from 'grommet';
import styled from 'styled-components';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.1);
  }
  :active {
    transform: scale(1);
  }
`;

const ConnectButton = ({ action }: { action: () => void }) => (
  <StyledBox round elevation="xsmall" onClick={() => action()} pad="small">
    <Text size="small" color="text">
      Connect Wallet
    </Text>
  </StyledBox>
);

export default ConnectButton;
