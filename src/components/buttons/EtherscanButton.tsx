import { Box, Text } from 'grommet';
import React, { useState, useEffect, useContext } from 'react';
import { FiArrowLeftCircle, FiExternalLink, FiLink } from 'react-icons/fi';
import styled from 'styled-components';
import { ChainContext } from '../../contexts/ChainContext';
import EtherscanMark from '../logos/EtherscanMark';

const StyledBox = styled(Box)`
  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.01);
  }
`;

function EtherscanButton({ txHash }: { txHash: string }) {
  const [hover, setHover] = useState<boolean>();

  const {
    chainState: {
      connection: { currentChainInfo },
    },
  } = useContext(ChainContext);

  return (
    <StyledBox
      direction="row"
      onClick={(e: any) => {
        e.stopPropagation();
        window.open(
          `https://${currentChainInfo.name === 'Mainnet' ? '' : `${currentChainInfo.name}.`}.etherscan.io/tx/${txHash}`,
          '_blank'
        );
      }}
      gap="xsmall"
      align="center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Text size="xsmall" color={hover ? '#333333' : 'grey'}>
        View on Etherscan
      </Text>
      <Text size="xsmall" color={hover ? '#333333' : 'grey'}>
        <FiExternalLink style={{ verticalAlign: 'top' }} />
      </Text>
      {/* <EtherscanMark /> */}
    </StyledBox>
  );
}

export default EtherscanButton;
