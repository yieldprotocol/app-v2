import { useState } from 'react';
import { Box, Text } from 'grommet';
import { FiExternalLink } from 'react-icons/fi';
import styled from 'styled-components';
import { useNetwork } from 'wagmi';

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
  const { chain } = useNetwork()

  return (
    <StyledBox
      direction="row"
      onClick={(e: any) => {
        e.stopPropagation();
        window.open(`${chain.blockExplorers.etherscan.url}/tx/${txHash}`, '_blank');
      }}
      gap="xsmall"
      align="center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Text size="xsmall" color={hover ? 'text' : 'text-weak'}>
        View on Etherscan
      </Text>
      <Text size="xsmall" color={hover ? 'text' : 'text-weak'}>
        <FiExternalLink style={{ verticalAlign: 'top' }} />
      </Text>
    </StyledBox>
  );
}

export default EtherscanButton;
