import { useContext, useEffect, useState } from 'react';
import { Box, Select, Text } from 'grommet';
import { ChainContext } from '../../contexts/ChainContext';
import { CHAIN_INFO } from '../../config/chainData';
import { useNetworkSelect } from '../../hooks/useNetworkSelect';
import { IChainContext } from '../../types';
import ArbitrumLogo from '../logos/Arbitrum';
import EthMark from '../logos/EthMark';

const NetworkSelector = () => {
  const {
    chainState: {
      connection: { account, fallbackChainId },
    },
  } = useContext(ChainContext) as IChainContext;

  const [selectedChainId, setSelectedChainId] = useState<number | undefined>();

  const [currentNetwork, setCurrentNetwork] = useState<string>();
  useEffect(() => {
    [1, 4, 42].includes(fallbackChainId!) ? setCurrentNetwork('Ethereum') : setCurrentNetwork('Arbitrum');
  }, [fallbackChainId]);

  useNetworkSelect(selectedChainId!);

  const handleNetworkChange = (chainName: string) =>
    setSelectedChainId([...CHAIN_INFO.entries()].find(([, chainInfo]) => chainInfo.name === chainName)![0]);

  return (
    <Box round>
      <Select
        plain
        dropProps={{ round: 'small' }}
        disabled={!account}
        options={
          currentNetwork === 'Ethereum'
            ? [
                // eslint-disable-next-line react/jsx-key
                <Box direction="row" gap="small" pad="xsmall" round>
                  <Box height="20px" width="20px">
                    <ArbitrumLogo />
                  </Box>
                  <Text size="small" color={CHAIN_INFO.get(42161)?.colorSecondary}>
                    Arbitrum
                  </Text>
                </Box>,
              ]
            : [
                // eslint-disable-next-line react/jsx-key
                <Box direction="row" gap="small" pad="xsmall" round>
                  <EthMark />
                  <Text size="small" color={CHAIN_INFO.get(1)?.color}>
                    Ethereum
                  </Text>
                </Box>,
              ]
        }
        value={
          currentNetwork === 'Ethereum' ? (
            <Box direction="row" gap="small">
              <Box height="20px" width="20px">
                <EthMark />
              </Box>
              <Text size="small" color={CHAIN_INFO.get(1)?.color}>
                Ethereum {[4, 42, 421611].includes(fallbackChainId!) && CHAIN_INFO.get(fallbackChainId!)?.name}
              </Text>
            </Box>
          ) : (
            <Box direction="row" gap="small" round>
              <Box height="20px" width="20px">
                <ArbitrumLogo />
              </Box>
              <Text size="small" color={CHAIN_INFO.get(42161)?.colorSecondary}>
                {[4, 42, 421611].includes(fallbackChainId!) ? CHAIN_INFO.get(fallbackChainId!)?.name : 'Arbitrum'}
              </Text>
            </Box>
          )
        }
        onChange={() => handleNetworkChange(currentNetwork === 'Ethereum' ? 'Arbitrum' : 'Ethereum')}
      />
    </Box>
  );
};

export default NetworkSelector;
