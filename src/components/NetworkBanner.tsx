import { useContext, useState } from 'react';
import { Anchor, Box, Button, Text } from 'grommet';
import styled from 'styled-components';
import { FiArrowUpRight, FiX } from 'react-icons/fi';
import { ChainContext } from '../contexts/ChainContext';
import { IChainContext, IUserContext } from '../types';
import { CHAIN_INFO } from '../config/chainData';
import { UserContext } from '../contexts/UserContext';
import { WETH } from '../config/assets';
import { ZERO_BN } from '../utils/constants';

// list of chain id's in which the banner should show
const SHOWABLE_CHAINS = [421611, 42161];

const StyledBox = styled(Box)`
  position: absolute;
  top: 6rem;
  right: 3rem;
  max-width: 20rem;
  z-index: 500;
`;

const NetworkBanner = () => {
  const {
    chainState: {
      connection: { fallbackChainId },
    },
  } = useContext(ChainContext) as IChainContext;

  const {
    userState: { assetMap },
  } = useContext(UserContext) as IUserContext;

  const [show, setShow] = useState<boolean>(true);
  const currentChainInfo = CHAIN_INFO.get(fallbackChainId!);

  const ethBalance = assetMap.get(WETH)?.balance;

  if (!ethBalance || !currentChainInfo || (ethBalance && ethBalance.gt(ZERO_BN))) return null;

  return SHOWABLE_CHAINS.includes(fallbackChainId!) && show ? (
    <StyledBox pad="small" background={{ color: currentChainInfo.color, opacity: 0.9 }} round gap="small">
      <Box direction="row" justify="between">
        <Box>Yield on {currentChainInfo.name}</Box>
        <Button onClick={() => setShow(false)}>
          <FiX color="white" />
        </Button>
      </Box>
      <Box gap="xsmall" background={{ color: currentChainInfo.color, opacity: 0.5 }} color="black" round pad="small">
        <Text size="xsmall">This is a beta release of Yield on the {currentChainInfo.name} network</Text>
        <Text size="xsmall" weight="bold">
          You must bridge assets from Ethereum Mainnet to {currentChainInfo.name} before using Yield on{' '}
          {currentChainInfo.name}
        </Text>
      </Box>
      {currentChainInfo.bridge && (
        <Box pad="small" background="gradient" round>
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
