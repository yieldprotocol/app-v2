import {
  chain,
  WagmiConfig,
  createClient,
  configureChains,
} from 'wagmi'

import { alchemyProvider } from 'wagmi/providers/alchemy'
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

// Configure chains & providers with the Alchemy provider.
// Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
const { chains, provider, webSocketProvider } = configureChains(
  [chain.mainnet, chain.arbitrum], 
  [
  alchemyProvider({ apiKey: 'ZXDCq5iy0KrKR0XjsqC6E4QG7Z_FuXDv' }), // TODO move this key to env
  // infuraProvider({ apiKey: 'ZXDCq5iy0KrKR0XjsqC6E4QG7Z_FuXDv' }), // TODO move this key to env
  jsonRpcProvider({
    rpc: (chain) => ({
      http: 'https://rpc.tenderly.co/fork/717ceb3b-f9a9-4fa0-b1ea-3eb0dd114ddf',
      // webSocket: `wss://${chain.id}.example.com`,
    })
  }),
  publicProvider(),
])

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
    // new InjectedConnector({
    //   chains,
    //   options: {
    //     name: 'Injected',
    //     shimDisconnect: true,
    //   },
    // }),
  ],
  provider,
  webSocketProvider,
})

const ProviderContext = ({ children }: { children: any }) => <WagmiConfig client={client}>{children}</WagmiConfig>;

export default ProviderContext;
