import { useContext, useEffect, useState } from 'react';
import { Box, Select, Text } from 'grommet';
import { FiChevronDown } from 'react-icons/fi';
import { ChainContext } from '../../contexts/ChainContext';
import { useNetworkSelect } from '../../hooks/useNetworkSelect';
import { IChainContext } from '../../types';
import ArbitrumLogo from '../logos/Arbitrum';
import EthMark from '../logos/EthMark';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NetworkSelector = () => {
  const { chain } = useNetwork();
  const { chains, error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        // const connected = mounted && account && chain;
        return (
          <div onClick={()=> openChainModal() }> Connected to: {chain?.name} </div>
        )
      }}
    </ConnectButton.Custom>
  );
};

export default NetworkSelector;
