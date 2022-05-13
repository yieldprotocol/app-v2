import * as assets from './assets';

const COMPOSITE_MULTI_ORACLE = 'CompositeMultiOracle';
const CHAINLINK_MULTI_ORACLE = 'ChainlinkMultiOracle';
const YEARNVAULT_MULTI_ORACLE = 'YearnVaultMultiOracle';
const CHAINLINK_USD_ORACLE = 'ChainlinkUSDOracle';
const NOTIONAL_MULTI_ORACLE = 'NotionalMultiOracle';

// map chain id to oracle info
export const ORACLES = new Map<number, Map<string, Map<string, string>>>();

// map asset (quote) and other asset (base) to a specific oracle based on where there is relevant price info for the pair
const ETHEREUM_ORACLES = new Map<string, Map<string, string>>();
const ARBITRUM_ORACLES = new Map<string, Map<string, string>>();

// USDC base on Ethereum
const usdcBaseEthereum = new Map<string, string>([
  [assets.WETH, CHAINLINK_MULTI_ORACLE],
  [assets.DAI, CHAINLINK_MULTI_ORACLE],
  [assets.USDC, CHAINLINK_MULTI_ORACLE],
  [assets.WBTC, CHAINLINK_MULTI_ORACLE],
  [assets.stETH, COMPOSITE_MULTI_ORACLE],
  [assets.wstETH, COMPOSITE_MULTI_ORACLE],
  [assets.ENS, COMPOSITE_MULTI_ORACLE],
  [assets.LINK, CHAINLINK_MULTI_ORACLE],
  [assets.UNI, CHAINLINK_MULTI_ORACLE],
  [assets.yvUSDC, YEARNVAULT_MULTI_ORACLE],
  [assets.MKR, COMPOSITE_MULTI_ORACLE],
  [assets.FRAX, CHAINLINK_MULTI_ORACLE],
  [assets.FUSDC2203, NOTIONAL_MULTI_ORACLE], // notional
  [assets.FUSDC2206, NOTIONAL_MULTI_ORACLE], // notional
  [assets.FUSDC2209, NOTIONAL_MULTI_ORACLE], // notional
  [assets.CVX3CRV, COMPOSITE_MULTI_ORACLE], // convex
]);

ETHEREUM_ORACLES.set(assets.USDC, usdcBaseEthereum);

// DAI base on Ethereum
const daiBaseEthereum = new Map<string, string>([
  [assets.WETH, CHAINLINK_MULTI_ORACLE],
  [assets.DAI, CHAINLINK_MULTI_ORACLE],
  [assets.USDC, CHAINLINK_MULTI_ORACLE],
  [assets.WBTC, CHAINLINK_MULTI_ORACLE],
  [assets.stETH, COMPOSITE_MULTI_ORACLE],
  [assets.wstETH, COMPOSITE_MULTI_ORACLE],
  [assets.ENS, COMPOSITE_MULTI_ORACLE],
  [assets.LINK, CHAINLINK_MULTI_ORACLE],
  [assets.UNI, CHAINLINK_MULTI_ORACLE],
  [assets.yvUSDC, YEARNVAULT_MULTI_ORACLE],
  [assets.MKR, COMPOSITE_MULTI_ORACLE],
  [assets.FRAX, CHAINLINK_MULTI_ORACLE],
  [assets.FDAI2203, NOTIONAL_MULTI_ORACLE], // notional
  [assets.FDAI2206, NOTIONAL_MULTI_ORACLE], // notional
  [assets.FDAI2209, NOTIONAL_MULTI_ORACLE], // notional
  [assets.CVX3CRV, COMPOSITE_MULTI_ORACLE], // convex
]);

ETHEREUM_ORACLES.set(assets.DAI, daiBaseEthereum);

// WETH base on Ethereum
const wethBaseEthereum = new Map<string, string>([
  [assets.WETH, CHAINLINK_MULTI_ORACLE],
  [assets.DAI, CHAINLINK_MULTI_ORACLE],
  [assets.USDC, CHAINLINK_MULTI_ORACLE],
  [assets.WBTC, CHAINLINK_MULTI_ORACLE],
  [assets.stETH, COMPOSITE_MULTI_ORACLE],
  [assets.wstETH, COMPOSITE_MULTI_ORACLE],
  [assets.ENS, COMPOSITE_MULTI_ORACLE],
  [assets.LINK, CHAINLINK_MULTI_ORACLE],
  [assets.UNI, CHAINLINK_MULTI_ORACLE],
  [assets.yvUSDC, YEARNVAULT_MULTI_ORACLE],
  [assets.MKR, COMPOSITE_MULTI_ORACLE],
  [assets.FRAX, CHAINLINK_MULTI_ORACLE],
]);

ETHEREUM_ORACLES.set(assets.WETH, wethBaseEthereum);

// FRAX base on Ethereum
const fraxBaseEthereum = new Map<string, string>([
  [assets.WETH, CHAINLINK_MULTI_ORACLE],
  [assets.DAI, CHAINLINK_MULTI_ORACLE],
  [assets.USDC, CHAINLINK_MULTI_ORACLE],
  [assets.WBTC, CHAINLINK_MULTI_ORACLE],
  [assets.stETH, COMPOSITE_MULTI_ORACLE],
  [assets.wstETH, COMPOSITE_MULTI_ORACLE],
  [assets.ENS, COMPOSITE_MULTI_ORACLE],
  [assets.LINK, CHAINLINK_MULTI_ORACLE],
  [assets.UNI, CHAINLINK_MULTI_ORACLE],
  [assets.MKR, COMPOSITE_MULTI_ORACLE],
]);

ETHEREUM_ORACLES.set(assets.FRAX, fraxBaseEthereum);

/* chain id 42161, 421611 (aribtrum mainnet and arbitrum rinkeby use the same oracle contracts) */

// USDC base on Arbiturm
const usdcBaseArbitrum = new Map<string, string>([
  [assets.WETH, CHAINLINK_USD_ORACLE],
  [assets.DAI, CHAINLINK_USD_ORACLE],
  [assets.USDC, CHAINLINK_USD_ORACLE],
  [assets.WBTC, CHAINLINK_USD_ORACLE],
  [assets.stETH, CHAINLINK_USD_ORACLE],
  [assets.wstETH, CHAINLINK_USD_ORACLE],
  [assets.ENS, CHAINLINK_USD_ORACLE],
  [assets.LINK, CHAINLINK_USD_ORACLE],
  [assets.UNI, CHAINLINK_USD_ORACLE],
  [assets.yvUSDC, YEARNVAULT_MULTI_ORACLE],
  [assets.MKR, CHAINLINK_USD_ORACLE],
]);

ARBITRUM_ORACLES.set(assets.USDC, usdcBaseArbitrum);

// DAI base on Arbiturm
const daiBaseArbitrum = new Map<string, string>([
  [assets.WETH, CHAINLINK_USD_ORACLE],
  [assets.DAI, CHAINLINK_USD_ORACLE],
  [assets.USDC, CHAINLINK_USD_ORACLE],
  [assets.WBTC, CHAINLINK_USD_ORACLE],
  [assets.stETH, CHAINLINK_USD_ORACLE],
  [assets.wstETH, CHAINLINK_USD_ORACLE],
  [assets.ENS, CHAINLINK_USD_ORACLE],
  [assets.LINK, CHAINLINK_USD_ORACLE],
  [assets.UNI, CHAINLINK_USD_ORACLE],
  [assets.yvUSDC, YEARNVAULT_MULTI_ORACLE],
  [assets.MKR, CHAINLINK_USD_ORACLE],
]);
ARBITRUM_ORACLES.set(assets.DAI, daiBaseArbitrum);

/* Set a general ORACLES MAP for export */
ORACLES.set(1, ETHEREUM_ORACLES);
ORACLES.set(4, ETHEREUM_ORACLES);
ORACLES.set(5, ETHEREUM_ORACLES);
ORACLES.set(42, ETHEREUM_ORACLES);
ORACLES.set(42161, ARBITRUM_ORACLES);
ORACLES.set(421611, ARBITRUM_ORACLES);
