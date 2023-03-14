import { WagmiConfig, createClient, configureChains } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { ReactNode, useContext, useMemo } from 'react';
import { SettingsContext } from './SettingsContext';
import { defaultChains } from '../config/customChains';

import {
  darkTheme,
  RainbowKitProvider,
  DisclaimerComponent,
  connectorsForWallets,
  Theme,
  AvatarComponent,
  lightTheme,
} from '@rainbow-me/rainbowkit';

import {
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
  coinbaseWallet,
  rainbowWallet,
  ledgerWallet,
  argentWallet,
  braveWallet,
} from '@rainbow-me/rainbowkit/wallets';
import YieldAvatar from '../components/YieldAvatar';
import '@rainbow-me/rainbowkit/styles.css';
import { useColorScheme } from '../hooks/useColorScheme';

const ProviderContext = ({ children }: { children: ReactNode }) => {
  /* bring in all the settings, in case we want to use them when setting up the network */
  const { settingsState } = useContext(SettingsContext);
  const { useForkedEnv, forkEnvUrl } = settingsState;

  /* console log whether using forked env or not */
  console.log('Using a forked env: ', useForkedEnv);
  useForkedEnv && console.log('Fork url: ', forkEnvUrl);

  const chainConfig = useMemo(
    () =>
      !useForkedEnv
        ? // Production environment >
          [
            alchemyProvider({
              apiKey: process.env.ALCHEMY_MAINNET_KEY!,
            }),
          ]
        : // Test/Dev environents (eg. tenderly) >
          [
            jsonRpcProvider({
              rpc: (chain) => ({
                http: forkEnvUrl,
              }),
            }),
          ],
    [forkEnvUrl, useForkedEnv]
  );

  const colorTheme = useColorScheme();

  // Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
  const { chains, provider } = configureChains(defaultChains, [...chainConfig]);

  const connectors = connectorsForWallets([
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet({ chains }), walletConnectWallet({ chains }), injectedWallet({ chains })],
    },
    {
      groupName: 'Experimental',
      wallets: [
        coinbaseWallet({ appName: 'yieldProtocol', chains }),
        rainbowWallet({ chains }),
        ledgerWallet({ chains }),
        argentWallet({ chains }),
        braveWallet({ chains }),
      ],
    },
    {
      groupName: 'Development Environments',
      wallets: [],
    },
  ]);

  // Set up client
  const client = createClient({
    autoConnect: true,
    connectors,
    provider,
  });

  const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
    <Text>
      By connecting my wallet, I agree to the <Link href="https://yieldprotocol.com/terms/">Terms of Service</Link> and
      acknowledge I have read and understand the protocol{' '}
      <Link href="https://yieldprotocol.com/privacy/">Privacy Policy</Link>.
    </Text>
  );

  const CustomAvatar: AvatarComponent = ({ address }) => <YieldAvatar address={address} size={2} noBorder />;

  return (
    <WagmiConfig client={client}>
      <RainbowKitProvider
        appInfo={{
          appName: 'Yield Protocol',
          disclaimer: Disclaimer,
        }}
        chains={chains}
        showRecentTransactions={true}
        modalSize="compact"
        avatar={CustomAvatar}
        theme={colorTheme === 'dark' ? myDarkTheme : myLightTheme}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default ProviderContext;

const myDarkTheme: Theme = {
  ...darkTheme(),
  colors: {
    ...darkTheme().colors,
    modalBackdrop: 'rgb(1, 1, 1, .85)',
  },
  radii: {
    actionButton: '...',
    connectButton: '...',
    menuButton: '...',
    modal: '8px',
    modalMobile: '...',
  },
};

const myLightTheme: Theme = {
  ...lightTheme(),
  colors: {
    ...lightTheme().colors,
    modalBackdrop: 'rgb(1, 1, 1, .50)',
  },
  radii: {
    actionButton: '...',
    connectButton: '...',
    menuButton: '...',
    modal: '8px',
    modalMobile: '...',
  },
};
