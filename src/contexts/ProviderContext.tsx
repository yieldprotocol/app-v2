import {
  apiProvider,
  configureChains,
  darkTheme,
  lightTheme,
  RainbowKitProvider,
  Theme,
  connectorsForWallets,
  wallet,
} from '@rainbow-me/rainbowkit';
import merge from 'lodash.merge';
import { chain, createClient, WagmiProvider } from 'wagmi';
import { SUPPORTED_RPC_URLS } from '../config/chainData';

const ProviderContext = ({ children }) => {
  const { chains, provider } = configureChains(
    [chain.mainnet, chain.arbitrum, chain.goerli],
    [apiProvider.jsonRpc((c) => ({ rpcUrl: SUPPORTED_RPC_URLS[c.id] }))]
  );

  const connectors = connectorsForWallets([
    {
      groupName: 'Popular',
      wallets: [
        wallet.argent({ chains }),
        wallet.coinbase({ appName: 'Yield App V2', chains }),
        wallet.metaMask({ chains }),
        wallet.rainbow({ chains }),
        wallet.walletConnect({ chains }),
      ],
    },
    {
      groupName: 'More',
      wallets: [wallet.ledger({ chains }), wallet.trust({ chains })],
    },
  ]);

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
