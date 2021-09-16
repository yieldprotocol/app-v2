import React, { useContext, useState } from 'react';
import { Anchor, Box, Button, Text } from 'grommet';
import styled from 'styled-components';
import { FiArrowUpRight, FiX } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';

const StyledBox = styled(Box)``;

const NetworkBanner = () => {
  const {
    chainState: { chainData, chainId },
    chainActions: { removeNetworkBanner },
  } = useContext(ChainContext);
  const showableChains = [137];
  const name = chainData?.name;

  return showableChains.includes(chainId) && chainData.showBanner ? (
    <StyledBox pad="small" background={chainData?.color} round="xsmall" gap="small">
      <Box direction="row" justify="between">
        <Box>Yield on {name}</Box>
        <Button onClick={() => removeNetworkBanner()}>
          <FiX color="white" />
        </Button>
      </Box>
      <Box gap="xsmall">
        <Text size="xsmall">This is an alpha release of Yield on the {name} network</Text>
        <Text size="xsmall">
          You must bridge assets from Ethereum Mainnet to {name} before using Yield on {name}
        </Text>
      </Box>
      <Box pad="small" background="white" round="xsmall">
        <Anchor
          href={chainData.bridge}
          label={
            <Box align="center">
              <Text size="medium" color="black">
                Deposit to {name}
                <FiArrowUpRight />
              </Text>
            </Box>
          }
          target="_blank"
        />
      </Box>
    </StyledBox>
  ) : null;
};

export default NetworkBanner;
