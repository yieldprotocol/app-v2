import { chain, WagmiConfig, createClient, configureChains, useConnect } from 'wagmi';

import { alchemyProvider } from 'wagmi/providers/alchemy';

import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

import { SafeConnector } from '@gnosis.pm/safe-apps-wagmi';

import { useContext, useEffect, useMemo } from 'react';
import { SettingsContext } from './SettingsContext';
import {
  darkTheme,
  RainbowKitProvider,
  getDefaultWallets,
  DisclaimerComponent,
  wallet,
  connectorsForWallets,
  Theme,
  AvatarComponent,
} from '@rainbow-me/rainbowkit';

import '@rainbow-me/rainbowkit/styles.css';
import YieldAvatar from '../components/YieldAvatar';

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

  const connectors = connectorsForWallets([
    {
      groupName: 'Recommended',
      wallets: [wallet.metaMask({ chains }), wallet.walletConnect({ chains }), wallet.injected({ chains })],
    },
    {
      groupName: 'Experimental',
      wallets: [
        wallet.coinbase({ appName: 'yieldProtocol', chains }),
        wallet.rainbow({ chains }),
        wallet.ledger({ chains }),
        wallet.argent({ chains }),
        wallet.brave({ chains }),
      ],
    },
    {
      groupName: 'Test environments',
      wallets: [

      ],
    },
  ]);

  // const connectors = [
  //  const GnosisConnector = new SafeConnector({ chains })
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

  // const { connectors } = getDefaultWallets({
  //   appName: 'Yield Protocol App',
  //   chains,
  // });

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

  const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
    <Text>
      By connecting my wallet, I agree to the <Link href="https://yieldprotocol.com/terms/">Terms of Service</Link> and
      acknowledge you have read and understand the protocol{' '}
      <Link href="https://yieldprotocol.com/privacy/">Privacy Policy</Link>.
    </Text>
  );

  const CustomAvatar: AvatarComponent = ({ address }) => ( <YieldAvatar address={address} size={2} noBorder /> )

  return (
    <WagmiConfig client={client}>
      <RainbowKitProvider
        appInfo={{
          appName: 'Yield Protocol App',
          disclaimer: Disclaimer,
        }}
        chains={chains}
        // theme={darkTheme()}
        showRecentTransactions={true}
        modalSize="compact"
        avatar={CustomAvatar}
        theme={myCustomTheme}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default ProviderContext;

const myCustomTheme: Theme = {
  ...darkTheme(),
  radii: {
    actionButton: '...',
    connectButton: '...',
    menuButton: '...',
    modal: '8px',
    modalMobile: '...',
  },
}


function generateColorFromAddress(address: string) {
  throw new Error('Function not implemented.');
}
// const AUTOCONNECTED_CONNECTOR_IDS = ['safe'];
// function useAutoConnect() {
//   const { connect, connectors } = useConnect();
//   useEffect(() => {
//     AUTOCONNECTED_CONNECTOR_IDS.forEach((connector) => {
//       const connectorInstance = connectors.find((c) => c.id === connector && c.ready);
//       if (connectorInstance) {
//         connect(connectorInstance);
//       }
//     });
//   }, [connect, connectors]);
// }
// export { useAutoConnect };
