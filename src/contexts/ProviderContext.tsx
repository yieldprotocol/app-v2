import {
  apiProvider,
  configureChains,
  darkTheme,
  lightTheme,
  getDefaultWallets,
  RainbowKitProvider,
  Theme,
} from '@rainbow-me/rainbowkit';
import merge from 'lodash.merge';
import { Chain, chain, createClient, WagmiProvider } from 'wagmi';
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

  const theme = merge(document.body.dataset.theme === 'dark' ? darkTheme() : lightTheme(), {
    colors: {
      accentColor: 'linear-gradient(135deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)',
    },

    fonts: { body: 'raleway' },
    radii: {
      actionButton: '.75rem',
      connectButton: '24px',
      menuButton: '.75rem',
      modal: '.75rem',
      modalMobile: '.75rem',
    },
  } as Theme);

  return (
    <WagmiProvider client={wagmiClient}>
      <RainbowKitProvider chains={chains} theme={theme}>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
};

export default ProviderContext;
