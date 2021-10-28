import React, { useContext, useState } from 'react';
import { Anchor, Box, Button, Text } from 'grommet';
import styled from 'styled-components';
import { FiArrowUpRight, FiX } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';

const StyledBox = styled(Box)`
  position: absolute;
  top: 15rem;
  right: 5rem;
  max-width: 25rem;
  z-index: 500;
`;

const NetworkBanner = () => {
  const {
    chainState: {
      connection: { currentChainInfo, fallbackChainId },
    },
  } = useContext(ChainContext);
  const showableChains = [421611];
  const [show, setShow] = useState<boolean>(true);

  return show && currentChainInfo && showableChains.includes(fallbackChainId) ? (
    <StyledBox pad="small" background={currentChainInfo.color} round="xsmall" gap="small">
      <Box direction="row" justify="between">
        <Box>Yield on {currentChainInfo.name}</Box>
        <Button onClick={() => setShow(false)}>
          <FiX color="white" />
        </Button>
      </Box>
      <Box gap="xsmall">
        <Text size="xsmall">This is a beta release of Yield on the {currentChainInfo.name} network</Text>
        <Text size="xsmall">
          You must bridge assets from Ethereum Mainnet to {currentChainInfo.name} before using Yield on{' '}
          {currentChainInfo.name}
        </Text>
      </Box>
      {currentChainInfo.bridge && (
        <Box pad="small" background="white" round="xsmall">
          <Anchor
            href={currentChainInfo.bridge}
            label={
              <Box align="center">
                <Text size="medium" color="black">
                  Deposit to {currentChainInfo.name}
                  <FiArrowUpRight />
                </Text>
              </Box>
            }
            target="_blank"
          />
        </Box>
      )}
    </StyledBox>
  ) : null;
};

export default NetworkBanner;
