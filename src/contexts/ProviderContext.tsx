import { chain, WagmiConfig, createClient, configureChains } from 'wagmi';

import { alchemyProvider } from 'wagmi/providers/alchemy';

import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { useContext, useMemo } from 'react';
import { SettingsContext } from './SettingsContext';
import { ConnectKitProvider } from 'connectkit';
import Disclaimer from '../components/Disclaimer';
import { Anchor } from 'grommet';

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

  // Set up client
  const client = useMemo(
    () =>
      createClient({
        autoConnect: true,
        connectors: [
          new MetaMaskConnector({ chains }),
          new WalletConnectConnector({
            chains,
            options: {
              qrcode: true,
            },
          }),
          new CoinbaseWalletConnector({
            chains,
            options: {
              appName: 'yieldProtocol',
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

  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider
        mode="auto"
        options={{
          hideQuestionMarkCTA: true,
          hideNoWalletCTA: true,
          disclaimer: (
            <div>
              <p>
                Disclaimer: By connecting my wallet, I agree to the{' '}
                <a href="https://yieldprotocol.com/terms/" target="_blank">
                  Terms of Service
                </a>{' '}
                and the{' '}
                <a href="https://yieldprotocol.com/privacy/" target="_blank">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          ),
        }}
      >
        {children}
      </ConnectKitProvider>
    </WagmiConfig>
  );
};

export default ProviderContext;
