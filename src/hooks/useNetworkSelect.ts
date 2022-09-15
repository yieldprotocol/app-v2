import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { useAccount, useNetwork, useProvider } from 'wagmi';
import { useCachedState } from './generalHooks';

// interface IAddEthereumChainParameter {
//   chainId: string; // A 0x-prefixed hexadecimal string
//   chainName: string;
//   nativeCurrency: {
//     name: string;
//     symbol: string; // 2-6 characters long
//     decimals: 18;
//   };
//   rpcUrls: string[];
//   blockExplorerUrls?: string[];
//   iconUrls?: string[]; // Currently ignored.
// }

export const useNetworkSelect = (chainId: number) => {

  const {connector} = useAccount();
  const {chain } = useNetwork();
  const provider = useProvider();

  const [isMetamask, setIsMetamask] = useState<any>(null);
  const [lastChainId, setLastChainId] = useCachedState('lastChainId', null);

  useEffect(() => {
    connector.name === 'Metamask' ? setIsMetamask(true) : setIsMetamask(false);
  }, [connector]);

  useEffect(() => {
    // const providerRequest = provider?.request;
    // if (chainId !== chainId && isMetamask && chainId && providerRequest) {
    //   (async () => {
    //     const hexChainId = ethers.utils.hexValue(chainId);
    //     try {
    //       await providerRequest({
    //         method: 'wallet_switchEthereumChain',
    //         params: [{ chainId: hexChainId }],
    //       });
    //       setLastChainId(chainId)

    //     } catch (switchError: any) {
    //       // This error code indicates that the chain has not been added to MetaMask.
    //       if (switchError.code === 4902) {
    //         try {
    //           const { rpcUrl, name: chainName, nativeCurrency, explorer }: any = CHAIN_INFO.get(chainId);
    //           await providerRequest({
    //             method: 'wallet_addEthereumChain',
    //             params: [
    //               {
    //                 chainId: hexChainId,
    //                 chainName,
    //                 nativeCurrency,
    //                 rpcUrls: [rpcUrl],
    //                 blockExplorerUrls: [explorer],
    //               },
    //             ],
    //           });
    //           setLastChainId(chainId)

    //         } catch (addError) {
    //           console.log(addError);
    //         }
    //       }
    //       console.log(switchError);
    //     }
    //   })();
    // }
  }, [chainId, chainId, isMetamask, provider]);
};
