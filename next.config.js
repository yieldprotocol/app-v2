/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  env: {
    REACT_APP_DEFAULT_CHAINID: process.env.REACT_APP_DEFAULT_CHAINID,
    REACT_APP_VERSION: process.env.REACT_APP_VERSION,
    REACT_APP_INFURA_KEY_V1: process.env.REACT_APP_INFURA_KEY_V1,
    REACT_APP_RPC_URL_42: process.env.REACT_APP_RPC_URL_42,
    REACT_APP_RPC_URL_1: process.env.TENDERLY_JSON_RPC_URL,
    REACT_APP_RPC_URL_4: process.env.REACT_APP_RPC_URL_4,
    REACT_APP_RPC_URL_5: process.env.REACT_APP_RPC_URL_5,
    REACT_APP_RPC_URL_10: process.env.REACT_APP_RPC_URL_10,
    REACT_APP_RPC_URL_69: process.env.REACT_APP_RPC_URL_69,
    REACT_APP_RPC_URL_42161: process.env.REACT_APP_RPC_URL_42161,
    REACT_APP_RPC_URL_421611: process.env.REACT_APP_RPC_URL_421611,
    TENDERLY_JSON_RPC_URL: process.env.TENDERLY_JSON_RPC_URL,
    TENDERLY_USER: process.env.TENDERLY_USER,
    TENDERLY_PROECT: process.env.TENDERLY_PROECT,
    TENDERLY_ACCESS_KEY: process.env.TENDERLY_ACCESS_KEY,
    INFURA_KEY: process.env.INFURA_KEY,
    ALCHEMY_ARBITRUM_KEY: process.env.ALCHEMY_ARBITRUM_KEY,
    ALCHEMY_ARBITRUM_RINKEBY_KEY: process.env.ALCHEMY_ARBITRUM_RINKEBY_KEY,
    ALCHEMY_MAINNET_KEY: process.env.ALCHEMY_MAINNET_KEY,
    ENV: process.env.NODE_ENV,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/borrow',
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
