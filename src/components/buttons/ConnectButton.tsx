import { Box, Button, ResponsiveContext, Text } from 'grommet';
import React, { useContext, useState } from 'react';
import { FiArrowLeft, FiMenu } from 'react-icons/fi';
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

function ConnectButton({ action }: { action: () => void }) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <StyledBox round="xsmall" elevation="xsmall" onClick={() => action()} pad="small">
      <Text size="small" color="text">
        {mobile ? <FiMenu /> : 'Connect Wallet'}
      </Text>
    </StyledBox>
  );
}

// BackButton.defaultProps = { color: 'grey' };

export default ConnectButton;
