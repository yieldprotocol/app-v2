import React, { useContext, useEffect, useState } from 'react';
import { Box,ResponsiveContext, Select, Text } from 'grommet';
import { ChainContext } from '../../contexts/ChainContext';
import { CHAIN_INFO } from '../../config/chainData';
import { useNetworkSelect } from '../../hooks/useNetworkSelect';
import { IChainContext } from '../../types';
import ArbitrumLogo from '../logos/Arbitrum';
import EthMark from '../logos/EthMark';

// const StyledBox = styled(Box)`
//   -webkit-transition: transform 0.3s ease-in-out;
//   -moz-transition: transform 0.3s ease-in-out;
//   transition: transform 0.3s ease-in-out;
//   :hover {
//     transform: scale(1.025);
//   }
// `;

const NetworkSelector = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const {
    chainState: {
      connection: { fallbackChainId },
    },
  } = useContext(ChainContext) as IChainContext;

  const [selectedChainId, setSelectedChainId] = useState<number | undefined>();

  const [currentNetwork, setCurrentNetwork] = useState<string>();
  useEffect(() => {
    [1, 4, 42].includes(fallbackChainId!) ? setCurrentNetwork('Ethereum') : setCurrentNetwork('Arbitrum');
  }, [fallbackChainId]);

  useNetworkSelect(selectedChainId!);

  const handleNetworkChange = (chainName: string) => {
    setSelectedChainId([...CHAIN_INFO.entries()].find(([id, chainInfo]: any) => chainInfo.name === chainName)![0]);
  };

  return (
    <>
      <Select
        plain
        options={
          currentNetwork === 'Ethereum'
            ? [
                // eslint-disable-next-line react/jsx-key
                <Box direction="row" gap="small" pad='xsmall'>
                  <ArbitrumLogo />
                  <Text size="small" color={CHAIN_INFO.get(42161)?.color}>
                    Arbitrum
                  </Text>
                </Box>,
              ]
            : [
                // eslint-disable-next-line react/jsx-key
                <Box direction="row" gap="small" pad='xsmall'>
                  <EthMark />
                  <Text size="small" color={CHAIN_INFO.get(1)?.color} >
                    Ethereum
                  </Text>
                </Box>,
              ]
        }
        value={
          currentNetwork === 'Ethereum' ? (
            <Box direction="row" gap="small">
              <EthMark />
              <Text size="small" color={CHAIN_INFO.get(1)?.color}>
                Ethereum
              </Text>
            </Box>
          ) : (
            <Box direction="row" gap="small">
              <ArbitrumLogo />
              <Text size="small" color={CHAIN_INFO.get(42161)?.color}>
                Arbitrum
              </Text>
            </Box>
          )
        }
        onChange={() => handleNetworkChange(currentNetwork === 'Ethereum' ? 'Arbitrum' : 'Ethereum')}
      />
    </>
  );
};

export default NetworkSelector;
