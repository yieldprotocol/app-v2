import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { CHAIN_INFO } from '../config/chainData';
import { ChainContext } from '../contexts/ChainContext';

interface IAddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

/* Simple Hook for caching & retrieved data */
export const useNetworkSelect = (chainId: number) => {
  const {
    chainState: {
      connection: { fallbackChainId, provider, connectionName },
    },
  } = useContext(ChainContext);

  const [isMetamask, setIsMetamask] = useState<any>(null);

  useEffect(() => {
    connectionName?.includes('metamask') ? setIsMetamask(true) : setIsMetamask(false);
  }, [connectionName]);

  useEffect(() => {
    if (chainId !== fallbackChainId && isMetamask && chainId) {
      (async () => {
        const hexChainId = ethers.utils.hexValue(chainId);
        try {
          await provider.provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexChainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              const { rpcUrl, name: chainName, nativeCurrency, explorer }: any = CHAIN_INFO.get(chainId);

              await provider.provider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: hexChainId,
                    chainName,
                    nativeCurrency,
                    rpcUrls: [rpcUrl],
                    blockExplorerUrls: [explorer],
                  },
                ],
              });
            } catch (addError) {
              console.log(addError);
            }
          }
          console.log(switchError);
        }
      })();
    }
  }, [chainId, fallbackChainId, isMetamask, provider]);
};
