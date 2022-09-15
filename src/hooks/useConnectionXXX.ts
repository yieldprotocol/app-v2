import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useCachedState } from './generalHooks';

import { useAccount, useConnect, useDisconnect, useEnsAvatar, useEnsName, useProvider } from 'wagmi';

export const useConnection = () => {
  const [tried, setTried] = useState<boolean>(false);

  const [currentChainInfo, setCurrentChainInfo] = useState<any>();
  const [useTenderlyFork, setUseTenderlyFork] = useCachedState('useTenderlyFork', false);

  /* CACHED VARIABLES */
  const [lastChainId, setLastChainId] = useCachedState('lastChainId', null);

  const { address, connector, isConnected  } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();

  const { data: ensAvatar } = useEnsAvatar({ addressOrName: address })
  const { data: ensName } = useEnsName({ address })

  const provider = useProvider();
  console.log(address,connectors, error, isLoading, pendingConnector );

  return {
    connectionState: {

      connector,
      connectors, 
      errorMessage: error, 
      isLoading, 
      pendingConnector,
      address, 
      isConnected,

      provider,
      chainId: 1,

      lastChainId,

      currentChainInfo,
      account: address,

      ensAvatar,
      ensName,

      useTenderlyFork,
    },

    connectionActions: {
      connect,
      disconnect,
    },
  };
};
