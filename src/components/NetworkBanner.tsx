import { useContext, useState } from 'react';
import { Box, Button, Text } from 'grommet';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { UserContext } from '../contexts/UserContext';
import { WETH } from '../config/assets';
import { ZERO_BN } from '../utils/constants';
import { useNetwork } from 'wagmi';
import { Chain } from '@rainbow-me/rainbowkit'


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
  const { chain } = useNetwork();

  const {
    userState: { assetMap },
  } = useContext(UserContext);

  const [show, setShow] = useState<boolean>(true);
  const currentChainInfo = chain;

  const backgroundColor = (chain as Chain)?.iconBackground || '#1F2937'

  const ethBalance = assetMap?.get(WETH)?.balance;

  if (!ethBalance || !currentChainInfo || (ethBalance && ethBalance.gt(ZERO_BN))) return null;

  return SHOWABLE_CHAINS.includes(chain.id) && show ? (
    <StyledBox pad="small" background={{ color: backgroundColor, opacity: 0.9 }} round gap="small">
      <Box direction="row" justify="between">
        <Box>Yield on {chain.name}</Box>
        <Button onClick={() => setShow(false)}>
          <FiX color="white" />
        </Button>
      </Box>
      <Box gap="xsmall" background={{ opacity: 0.5 }} color="black" round pad="small">
        <Text size="xsmall">This is a beta release of Yield on the {chain.name} network</Text>
        <Text size="xsmall" weight="bold">
          You must bridge assets from Ethereum Mainnet to {chain.name} before using Yield on {chain.name}
        </Text>
      </Box>
    </StyledBox>
  ) : null;
};

export default NetworkBanner;
