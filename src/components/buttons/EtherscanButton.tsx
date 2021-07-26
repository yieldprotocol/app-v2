import { Box, Text } from 'grommet';
import React, { useState, useEffect, useContext } from 'react';
import { FiArrowLeftCircle, FiLink } from 'react-icons/fi';
import styled from 'styled-components';
import { ChainContext } from '../../contexts/ChainContext';

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
  const [network, setNetwork] = useState<string>('');

  const {
    chainState: { chainId }
  } = useContext(ChainContext);

  useEffect(() => {
    console.log('ChainDI', chainId);
    if (chainId === 42) {
      setNetwork('kovan.');
    } else {
      setNetwork('');
    }
  }, [chainId]);

  return (
    <StyledBox
      direction="row"
      onClick={(e: any) => {
        e.stopPropagation();
        window.open(`https://${network}etherscan.io/tx/${txHash}`, '_blank');
      }}
      gap="small"
      align="center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <FiLink color={hover ? '#333333' : 'grey'} />
      <Text size="xsmall" color={hover ? '#333333' : 'grey'}>
        View on Etherscan
      </Text>
    </StyledBox>
  );
}

export default EtherscanButton;
