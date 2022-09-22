import { chain, WagmiConfig, createClient, configureChains } from 'wagmi';

import { alchemyProvider } from 'wagmi/providers/alchemy';

import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { useContext, useMemo } from 'react';
import { SettingsContext } from './SettingsContext';
import { darkTheme, RainbowKitProvider, getDefaultWallets, } from '@rainbow-me/rainbowkit';

import '@rainbow-me/rainbowkit/styles.css';

const ProviderContext = ({ children }: { children: any }) => {
  /* bring in all the settings in case we want to use them settings up the netwrok */
  const { settingsState } = useContext(SettingsContext);
  const { useFork, useTenderlyFork, forkUrl, disclaimerChecked } = settingsState;

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

   // const connectors = [
  //   new MetaMaskConnector({ chains }),
  //   new CoinbaseWalletConnector({
  //     chains,
  //     options: {
  //       appName: 'yieldProtocol',
  //     },
  //   }),
  //   new WalletConnectConnector({
  //     chains,
  //     options: {
  //       qrcode: false,
  //     },
  //   }),
  // ]

  const { connectors } = getDefaultWallets({
    appName: 'Yield Protocol App',
    chains
  });


  // Set up client
  const client = useMemo(
    () =>
      createClient({
        autoConnect: true,
        connectors,
        provider,
        webSocketProvider,
      }),
    []
  );

  return (
    <WagmiConfig client={client}>
      <RainbowKitProvider 
      chains={chains}
      // theme={darkTheme()}
      showRecentTransactions={true}
      modalSize="compact"
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default ProviderContext;
