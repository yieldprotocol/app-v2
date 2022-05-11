import {
  apiProvider,
  configureChains,
  darkTheme,
  getDefaultWallets,
  RainbowKitProvider,
  Theme,
} from '@rainbow-me/rainbowkit';
import { Chain, chain, createClient, WagmiProvider } from 'wagmi';
import merge from 'lodash.merge';
import { SUPPORTED_RPC_URLS } from '../config/chainData';

const ProviderContext = ({ children }) => {
  const { chains, provider } = configureChains(
    [chain.mainnet, chain.arbitrum],
    [apiProvider.jsonRpc((_chain: Chain) => ({ rpcUrl: SUPPORTED_RPC_URLS[_chain.id] }))]
  );

  const { connectors } = getDefaultWallets({
    appName: 'Yield App V2',
    chains,
  });

  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
  });

  const theme = merge(document.body.dataset.theme === 'dark' ? darkTheme() : undefined, {
    colors: {
      accentColor:
        'linear-gradient(135deg, rgba(247, 149, 51, 0.5), rgba(243, 112, 85, 0.5), rgba(239, 78, 123, 0.5), rgba(161, 102, 171, 0.5), rgba(80, 115, 184, 0.5), rgba(16, 152, 173, 0.5), rgba(7, 179, 155, 0.5), rgba(111, 186, 130, 0.5));',
    },

    fonts: { body: 'raleway' },
    radii: {
      actionButton: '.75rem',
      connectButton: '.75rem',
      menuButton: '.75rem',
      modal: '.75rem',
      modalMobile: '.75rem',
    },
  } as Theme);

  return (
    <WagmiProvider client={wagmiClient}>
      <RainbowKitProvider chains={chains} theme={theme} showRecentTransactions>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
};

export default ProviderContext;
