import { useContext, useEffect, useState } from 'react';
import { Box, Select, Text } from 'grommet';
import { FiChevronDown } from 'react-icons/fi';
import { ChainContext } from '../../contexts/ChainContext';
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

    </Box>
  );
};

export default NetworkSelector;
