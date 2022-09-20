import { chain, WagmiConfig, createClient, configureChains, Chain } from 'wagmi';

import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { useContext, useEffect, useMemo } from 'react';
import { SettingsContext } from './SettingsContext';

const ProviderContext = ({ children }: { children: any }) => {
  /* bring in all the settings in case we want to use them settings up the netwrok */
  const { settingsState } = useContext(SettingsContext);

  const { useFork, useTenderlyFork, forkUrl } = settingsState;

  // Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
  const { chains, provider, webSocketProvider } = configureChains(
    [chain.mainnet, chain.arbitrum], // [chain.mainnet, chain.arbitrum, chain.localhost, chain.foundry],
    [
      alchemyProvider({
        apiKey: 'ZXDCq5iy0KrKR0XjsqC6E4QG7Z_FuXDv', // TODO move this key to env
      }),
      // jsonRpcProvider({
      //   rpc: (chain) => ({
      //     http: forkUrl,
      //     // webSocket: `wss://${chain.id}.example.com`,
      //   }),
      //   // priority: useTenderlyFork ? 0 : 100,
      // }),
      // publicProvider(),
    ]
  );

  // Set up client
  const client = useMemo(
    () =>
      createClient({
        autoConnect: false,
        connectors: [
          new MetaMaskConnector({ chains }),
          new CoinbaseWalletConnector({
            chains,
            options: {
              appName: 'yieldProtocol',
            },
          }),
          new WalletConnectConnector({
            chains,
            options: {
              qrcode: true,
            },
          }),
        ],
        provider,
        webSocketProvider,
      }),
    []
  );

  // Configure chains & providers with the Alchemy provider.

  /* watch & handle linked approval and effect appropriate settings */
  // useEffect(() => {
  //   // console.log(settingsState);
  // }, [settingsState]);

  /* before doing anything here, check the settings */

  return <WagmiConfig client={client}>{children}</WagmiConfig>;
};

export default ProviderContext;
