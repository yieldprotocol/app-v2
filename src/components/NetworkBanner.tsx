import React, { useContext, useEffect, useState } from 'react';
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
      connection: { currentChainInfo, chainId },
    },
  } = useContext(ChainContext);
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => {
    const showableChains = [421611];
    currentChainInfo && showableChains.includes(Number(chainId)) && setShow(true);
  }, [currentChainInfo, chainId]);

  return show ? (
    <StyledBox pad="small" background={{ color: currentChainInfo.color, opacity: 0.9 }} round="xsmall" gap="small">
      <Box direction="row" justify="between">
        <Box>Yield on {currentChainInfo.name}</Box>
        <Button onClick={() => setShow(false)}>
          <FiX color="white" />
        </Button>
      </Box>
      <Box
        gap="xsmall"
        background={{ color: currentChainInfo.color, opacity: 0.5 }}
        color="black"
        round="xsmall"
        pad="small"
      >
        <Text size="xsmall">This is a beta release of Yield on the {currentChainInfo.name} network</Text>
        <Text size="xsmall" weight="bold">
          You must bridge assets from Ethereum Mainnet to {currentChainInfo.name} before using Yield on{' '}
          {currentChainInfo.name}
        </Text>
      </Box>
      {currentChainInfo.bridge && (
        <Box pad="small" background="gradient" round="xsmall">
          <Anchor
            style={{ textDecorationColor: 'white' }}
            href={currentChainInfo.bridge}
            label={
              <Box align="center">
                <Text size="medium" weight="bold" color="white">
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
