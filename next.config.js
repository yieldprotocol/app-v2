/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  env: {
    REACT_APP_DEFAULT_CHAINID: process.env.REACT_APP_DEFAULT_CHAINID,
    REACT_APP_VERSION: process.env.REACT_APP_VERSION,
    REACT_APP_INFURA_KEY_V1: process.env.REACT_APP_INFURA_KEY_V1,
    REACT_APP_RPC_URL_1: process.env.TENDERLY_JSON_RPC_URL,
    REACT_APP_RPC_URL_42161: process.env.REACT_APP_RPC_URL_42161,

    REACT_APP_DEFAULT_FORK_RPC_URL: process.env.REACT_APP_DEFAULT_FORK_RPC_URL,
    REACT_APP_LOCALHOST_RPC_URL: process.env.REACT_APP_LOCALHOST_RPC_URL,

    INFURA_KEY: process.env.INFURA_KEY,
    ALCHEMY_ARBITRUM_KEY: process.env.ALCHEMY_ARBITRUM_KEY,
    ALCHEMY_MAINNET_KEY: process.env.ALCHEMY_MAINNET_KEY,
    ENV: process.env.NODE_ENV,

    TENDERLY_USER: process.env.TENDERLY_USER,
    TENDERLY_PROJECT: process.env.TENDERLY_PROJECT,
    TENDERLY_ACCESS_KEY: process.env.TENDERLY_ACCESS_KEY,

    ALLOWED_SUPPORT_ADDRESSES: process.env.ALLOWED_SUPPORT_ADDRESSES,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/pool',
        permanent: true,
      },
    ];
  },
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ['metadata.ens.domains'],
  },
};

module.exports = nextConfig;
