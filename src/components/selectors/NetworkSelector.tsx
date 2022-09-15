import { useContext, useEffect, useState } from 'react';
import { Box, Select, Text } from 'grommet';
import { FiChevronDown } from 'react-icons/fi';
import { ChainContext } from '../../contexts/ChainContext';
import { CHAIN_INFO } from '../../config/chainData';
import { useNetworkSelect } from '../../hooks/useNetworkSelect';
import { IChainContext } from '../../types';
import ArbitrumLogo from '../logos/Arbitrum';
import EthMark from '../logos/EthMark';
import { useAccount, useNetwork } from 'wagmi';

const NetworkSelector = () => {

 const {isConnected} = useAccount();
 const {chain} = useNetwork();

  const [selectedChainId, setSelectedChainId] = useState<number | undefined>();

  // const [currentNetwork, setCurrentNetwork] = useState<string>();
  // useEffect(() => {
  //   [1, 4, 5, 42].includes(chain.id) ? setCurrentNetwork('Ethereum') : setCurrentNetwork('Arbitrum');
  // }, [chain.id]);

  useNetworkSelect(selectedChainId!);

  const handleNetworkChange = (chainName: string) =>
    setSelectedChainId([...CHAIN_INFO.entries()].find(([, chainInfo]) => chainInfo.name === chainName)![0]);

  return (
    <Box round>
      <Select
        plain
        size="small"
        dropProps={{ round: 'large' }}
        disabled={!isConnected}
        icon={<FiChevronDown />}
        options={
          chain?.name === 'Ethereum'
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
          chain?.name === 'Ethereum' ? (
            <Box direction="row" gap="small">
              <Box height="20px" width="20px">
                <EthMark />
              </Box>
              <Text size="small" color={CHAIN_INFO.get(1)?.color}>
                Ethereum {[4, 5, 42, 421611].includes(chain?.id) && CHAIN_INFO.get(chain.id)?.name}
              </Text>
            </Box>
          ) : (
            <Box direction="row" gap="small" round>
              <Box height="20px" width="20px">
                <ArbitrumLogo />
              </Box>
              <Text size="small" color={CHAIN_INFO.get(42161)?.colorSecondary}>
                {[4, 5, 42, 421611].includes(chain?.id) ? CHAIN_INFO.get(chain?.id)?.name : 'Arbitrum'}
              </Text>
            </Box>
          )
        }
        onChange={() => handleNetworkChange(chain?.name === 'Ethereum' ? 'Arbitrum' : 'Ethereum')}
      />
    </Box>
  );
};

export default NetworkSelector;
