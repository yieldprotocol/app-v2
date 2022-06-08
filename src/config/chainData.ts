export const RPC_URLS: { [chainId: number]: string } = {
  1: process.env.REACT_APP_RPC_URL_1 as string,
  4: process.env.REACT_APP_RPC_URL_4 as string,
  5: process.env.REACT_APP_RPC_URL_5 as string,
  42: process.env.REACT_APP_RPC_URL_42 as string,
  10: process.env.REACT_APP_RPC_URL_10 as string,
  69: process.env.REACT_APP_RPC_URL_69 as string,
  42161: process.env.REACT_APP_RPC_URL_42161 as string,
  421611: process.env.REACT_APP_RPC_URL_421611 as string,
};

export const SUPPORTED_RPC_URLS: { [chainId: number]: string } = {
  1: RPC_URLS[1],
  4: RPC_URLS[4],
  5: RPC_URLS[5],
  42161: RPC_URLS[42161],
  // 421611: RPC_URLS[421611],
};

export const SUPPORTED_CHAIN_IDS: number[] = Object.keys(SUPPORTED_RPC_URLS).map((chainId: string) => +chainId);

interface INativeCurrency {
  name: string;
  symbol: string; // 2-6 characters long
  decimals: 18;
}

interface IChainInfo {
  name: string;
  color: string;
  colorSecondary?: string;
  bridge?: string;
  explorer?: string;
  rpcUrl?: string;
  nativeCurrency?: INativeCurrency;
}

export const CHAIN_INFO = new Map<number, IChainInfo>();

CHAIN_INFO.set(1, { name: 'Ethereum', color: '#29b6af', explorer: 'https://etherscan.io' });
CHAIN_INFO.set(3, { name: 'Ropsten', color: '#ff4a8d', explorer: 'https://ropsten.etherscan.io' });
CHAIN_INFO.set(4, { name: 'Rinkeby', color: '#f6c343', explorer: 'https://rinkeby.etherscan.io' });
CHAIN_INFO.set(5, { name: 'Goerli', color: '#3099f2', explorer: 'https://goerli.etherscan.io' });
CHAIN_INFO.set(42, { name: 'Kovan', color: '#7F7FFE', explorer: 'https://kovan.etherscan.io' });
CHAIN_INFO.set(10, {
  name: 'Optimism',
  color: '#EB0822',
  bridge: 'https://gateway.optimism.io',
  explorer: 'https://optimistic.etherscan.io',
  rpcUrl: 'https://mainnet.optimism.io',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
});
CHAIN_INFO.set(69, {
  name: 'Optimism Kovan',
  color: '#EB0822',
  bridge: 'https://gateway.optimism.io',
  explorer: 'https://kovan-optimistic.etherscan.io',
  rpcUrl: 'https://kovan.optimism.io',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
});
CHAIN_INFO.set(42161, {
  name: 'Arbitrum',
  color: '#1F2937',
  colorSecondary: '#28A0F0',
  bridge: 'https://bridge.arbitrum.io',
  explorer: 'https://arbiscan.io/',
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
});
CHAIN_INFO.set(421611, {
  name: 'Arbitrum Testnet',
  color: '#1F2937',
  colorSecondary: '#28A0F0',
  bridge: 'https://bridge.arbitrum.io',
  explorer: 'https://testnet.arbiscan.io',
  rpcUrl: 'https://rinkeby.arbitrum.io/rpc',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
});
