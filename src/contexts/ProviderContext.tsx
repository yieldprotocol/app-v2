import { chain, WagmiConfig, createClient, configureChains, allChains } from 'wagmi';

import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { useContext, useEffect } from 'react';
import { SettingsContext } from './SettingsContext';

const ProviderContext = ({ children }: { children: any }) => {
  /* bring in all the settings in case we want to use them settings up the netwrok */
  const { settingsState } = useContext(SettingsContext);

  const { useFork, forkUrl } = settingsState;

  // Configure chains & providers with the Alchemy provider.

  // Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
  const { chains, provider, webSocketProvider } = configureChains(
    [chain.mainnet, chain.arbitrum, chain.localhost, chain.foundry],
    // [chain.mainnet, chain.arbitrum, chain.localhost, chain.foundry],
    [
      alchemyProvider({ apiKey: 'ZXDCq5iy0KrKR0XjsqC6E4QG7Z_FuXDv' }), // TODO move this key to env
      // infuraProvider({ apiKey: 'ZXDCq5iy0KrKR0XjsqC6E4QG7Z_FuXDv' }), // TODO move this key to env
      // jsonRpcProvider({
      //   rpc: (chain) => ({
      //     http: 'https://rpc.tenderly.co/fork/717ceb3b-f9a9-4fa0-b1ea-3eb0dd114ddf',
      //     // webSocket: `wss://${chain.id}.example.com`,
      //   }),
      // }),
      publicProvider(),
    ]
  );

  console.log( chains )

  // Set up client
  const client = createClient({
    autoConnect: true,
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
  });

  /* watch & handle linked approval and effect appropriate settings */
  useEffect(() => {
    console.log(settingsState);
  }, [settingsState]);

  /* before doing anything here, check the settings */

  return <WagmiConfig client={client}>{children}</WagmiConfig>;
};

export default ProviderContext;
