import { WagmiConfig, createClient, configureChains } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { ReactNode, useMemo } from 'react';
import { defaultChains } from '../config/customChains';

import {
  darkTheme,
  RainbowKitProvider,
  DisclaimerComponent,
  connectorsForWallets,
  Theme,
  AvatarComponent,
  lightTheme,
  getDefaultWallets,
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
import { useCachedState } from '../hooks/generalHooks';
import { Settings } from './types/settings';

const WagmiContext = ({ children }: { children: ReactNode }) => {
  const colorTheme = useColorScheme();

  const [useForkedEnv] = useCachedState(Settings.USE_FORKED_ENV, false);
  const [forkEnvUrl] = useCachedState(Settings.FORK_ENV_URL, process.env.REACT_APP_DEFAULT_FORK_RPC_URL);
  const defaultChainId = parseInt(process.env.REACT_APP_DEFAULT_CHAINID!);
  const projectId = process.env.WALLETCONNECT_PROJECT_ID!;

  const chainConfig = useMemo(
    () =>
      useForkedEnv
        ? jsonRpcProvider({ rpc: () => ({ http: forkEnvUrl }) })
        : alchemyProvider({
            apiKey: defaultChainId === 1 ? process.env.ALCHEMY_MAINNET_KEY! : process.env.ALCHEMY_ARBITRUM_KEY!,
          }),
    [forkEnvUrl, useForkedEnv]
  );

  const { chains, provider } = configureChains(defaultChains, [chainConfig]);

  const { wallets } = getDefaultWallets({
    appName: 'Yield-App-V2',
    projectId,
    chains,
  });

  const connectors = connectorsForWallets([
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet({ projectId, chains }),
        walletConnectWallet({ projectId, chains }),
        injectedWallet({ chains }),
      ],
    },
    {
      groupName: 'Experimental',
      wallets: [
        coinbaseWallet({ appName: 'Yield-App-V2', chains }),
        rainbowWallet({ projectId, chains }),
        ledgerWallet({ projectId, chains }),
        argentWallet({ projectId, chains }),
        braveWallet({ chains }),
      ],
    },
    ...wallets,
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

export default WagmiContext;

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
