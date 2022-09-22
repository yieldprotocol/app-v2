import { useContext, useEffect, useState } from 'react';
import { Box, Select, Text } from 'grommet';
import { FiChevronDown } from 'react-icons/fi';
import { ChainContext } from '../../contexts/ChainContext';
import { useNetworkSelect } from '../../hooks/useNetworkSelect';
import { IChainContext } from '../../types';
import ArbitrumLogo from '../logos/Arbitrum';
import EthMark from '../logos/EthMark';
import { useNetwork, useProvider, useSwitchNetwork } from 'wagmi';
import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit';

const NetworkSelector = () => {
  const { chain } = useNetwork();
  const  provider = useProvider();
  const { openChainModal } = useChainModal();
  const { openConnectModal } = useConnectModal();

  return ( chain 
    ? <Text size='xsmall' onClick={() => openChainModal()}> {chain?.name} </Text>
    : <Text size='xsmall' onClick={() => openConnectModal()}> {provider.chains[0].name} </Text>
    )
};

export default NetworkSelector;
