import { chain, WagmiConfig, createClient, configureChains } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { ReactNode, useContext } from 'react';
import { SettingsContext } from './SettingsContext';
import {
  darkTheme,
  RainbowKitProvider,
  DisclaimerComponent,
  wallet,
  connectorsForWallets,
  Theme,
  AvatarComponent,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import YieldAvatar from '../components/YieldAvatar';
import '@rainbow-me/rainbowkit/styles.css';
import { useColorScheme } from '../hooks/useColorScheme';

const ProviderContext = ({ children }: { children: ReactNode }) => {
  /* bring in all the settings in case we want to use them settings up the netwrok */
  // const { settingsState } = useContext(SettingsContext);
  const colorTheme = useColorScheme();

  // Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
  const { chains, provider } = configureChains(
    [chain.mainnet, chain.arbitrum], // [chain.mainnet, chain.arbitrum, chain.localhost, chain.foundry],
    [
      alchemyProvider({
        apiKey: process.env.ALCHEMY_MAINNET_KEY,
      }),
      alchemyProvider({
        apiKey: process.env.ALCHEMY_ARBITRUM_KEY,
      }),
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
        theme={ colorTheme === 'dark' ? myDarkTheme : myLightTheme }
        // theme={darkTheme()}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default ProviderContext;

const myDarkTheme: Theme = {
  ...darkTheme(),
  colors : {
    ...darkTheme().colors,
    modalBackdrop: 'rgb(1, 1, 1, .85)'
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
  colors : {
    ...lightTheme().colors,
    modalBackdrop: 'rgb(1, 1, 1, .85)'
  },
  radii: {
    actionButton: '...',
    connectButton: '...',
    menuButton: '...',
    modal: '8px',
    modalMobile: '...',
  },
};

function generateColorFromAddress(address: string) {
  throw new Error('Function not implemented.');
}
