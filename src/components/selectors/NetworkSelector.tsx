import { useEffect, useState } from 'react';
import { Box, Select, Text } from 'grommet';
import { FiChevronDown } from 'react-icons/fi';
import { useAccount, useNetwork } from 'wagmi';
import { CHAIN_INFO } from '../../config/chainData';
import ArbitrumLogo from '../logos/Arbitrum';
import EthMark from '../logos/EthMark';

const NetworkSelector = () => {
  const { data: _account } = useAccount();
  const account = _account?.address;
  const { activeChain, switchNetwork } = useNetwork();
  const chainId = activeChain?.id;

  const [currentNetwork, setCurrentNetwork] = useState<string>();

  useEffect(() => {
    [1, 4, 5, 42].includes(chainId) ? setCurrentNetwork('Ethereum') : setCurrentNetwork('Arbitrum');
  }, [chainId]);

  const handleNetworkChange = (chainName: string) =>
    switchNetwork([...CHAIN_INFO.entries()].find(([, chainInfo]) => chainInfo.name === chainName)![0]);

  return (
    <Box round>
      <Select
        plain
        size="small"
        dropProps={{ round: 'large' }}
        disabled={!account}
        icon={<FiChevronDown />}
        options={
          currentNetwork === 'Ethereum'
            ? [
                // eslint-disable-next-line react/jsx-key
                <Box direction="row" gap="small">
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
                <Box direction="row" gap="small">
                  <Box height="20px" width="20px">
                    <EthMark />
                  </Box>
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
                Ethereum {[4, 5, 42, 421611].includes(chainId!) && CHAIN_INFO.get(chainId!)?.name}
              </Text>
            </Box>
          ) : (
            <Box direction="row" gap="small" round>
              <Box height="20px" width="20px">
                <ArbitrumLogo />
              </Box>
              <Text size="small" color={CHAIN_INFO.get(42161)?.colorSecondary}>
                {[4, 5, 42, 421611].includes(chainId!) ? CHAIN_INFO.get(chainId!)?.name : 'Arbitrum'}
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
