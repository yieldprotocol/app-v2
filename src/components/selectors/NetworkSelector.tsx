import { useContext, useEffect, useState } from 'react';
import { Box, Select, Text } from 'grommet';
import { FiChevronDown } from 'react-icons/fi';
import { ChainContext } from '../../contexts/ChainContext';
import { CHAIN_INFO } from '../../config/chainData';
import { useNetworkSelect } from '../../hooks/useNetworkSelect';
import { IChainContext } from '../../types';
import ArbitrumLogo from '../logos/Arbitrum';
import EthMark from '../logos/EthMark';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';

const NetworkSelector = () => {

  const { chain } = useNetwork();
  const { chains, error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork();

  return (
    <Box round>
      <>
        {chain && <div>Connected to {chain.name}</div>}

        {chains.map((x) => (
          <button
            disabled={!switchNetwork || x.id === chain?.id}
            key={x.id}
            onClick={() => {
              switchNetwork?.(x.id);
            }}
          >
            {x.name}
            {isLoading && pendingChainId === x.id && ' (switching)'}
          </button>
        ))}

        <div>{error && error.message}</div>
      </>

      {/* <Select
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
      /> */}
    </Box>
  );
};

export default NetworkSelector;
