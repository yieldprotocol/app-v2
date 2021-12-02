import { WETH, DAI, USDC, WBTC, stETH, wstETH, ENS, LINK, UNI } from './assets';

const COMPOSITE_MULTI_ORACLE = 'COMPOSITE_MULTI_ORACLE';
const CHAINLINK_MULTI_ORACLE = 'CHAINLINK_MULTI_ORACLE';
const CHAINLINK_USD_ORACLE = 'CHAINLINK_USD_ORACLE';
const ACCUMULATOR_MULTI_ORACLE = 'AccumulatorMultiOracle';

interface IOracleInfo {
  [number]: Map<string, IAssetOracleInfo>;
}

interface IAssetOracleInfo {
  [string]: Map<string, string>;
}

// map chain id to oracle info
export const ORACLE_INFO = new Map<IOracleInfo>();

// map asset (baseId) and other asset (ilkId) to a specific oracle based on where there is relevant price info
export const CHAIN_ID_1_ASSET_ORACLE_INFO = new Map<IAssetOracleInfo>();
export const CHAIN_ID_42_ASSET_ORACLE_INFO = new Map<IAssetOracleInfo>();
export const CHAIN_ID_421611_ASSET_ORACLE_INFO = new Map<IAssetOracleInfo>();

/* chain id 1, 42 */
// USDC base
const usdcIlkOracle1 = new Map<string, string>();
usdcIlkOracle1.set(WETH, CHAINLINK_MULTI_ORACLE);
usdcIlkOracle1.set(DAI, CHAINLINK_MULTI_ORACLE);
usdcIlkOracle1.set(USDC, CHAINLINK_MULTI_ORACLE);
usdcIlkOracle1.set(WBTC, CHAINLINK_MULTI_ORACLE);
usdcIlkOracle1.set(stETH, COMPOSITE_MULTI_ORACLE);
usdcIlkOracle1.set(wstETH, CHAINLINK_MULTI_ORACLE);
usdcIlkOracle1.set(ENS, COMPOSITE_MULTI_ORACLE);
usdcIlkOracle1.set(LINK, CHAINLINK_MULTI_ORACLE);
usdcIlkOracle1.set(UNI, CHAINLINK_MULTI_ORACLE);
CHAIN_ID_1_ASSET_ORACLE_INFO.set(USDC, usdcIlkOracle1);

// DAI base
const daiIlkOracle1 = new Map<string, string>();
daiIlkOracle1.set(WETH, CHAINLINK_MULTI_ORACLE);
daiIlkOracle1.set(DAI, CHAINLINK_MULTI_ORACLE);
daiIlkOracle1.set(USDC, CHAINLINK_MULTI_ORACLE);
daiIlkOracle1.set(WBTC, CHAINLINK_MULTI_ORACLE);
daiIlkOracle1.set(stETH, COMPOSITE_MULTI_ORACLE);
daiIlkOracle1.set(wstETH, CHAINLINK_MULTI_ORACLE);
daiIlkOracle1.set(ENS, COMPOSITE_MULTI_ORACLE);
daiIlkOracle1.set(LINK, CHAINLINK_MULTI_ORACLE);
daiIlkOracle1.set(UNI, CHAINLINK_MULTI_ORACLE);
CHAIN_ID_1_ASSET_ORACLE_INFO.set(DAI, daiIlkOracle1);

/* chain id 421611 */
// USDC base
const usdcIlkOracle421611 = new Map<string, string>();
usdcIlkOracle421611.set(WETH, CHAINLINK_USD_ORACLE);
usdcIlkOracle421611.set(DAI, CHAINLINK_USD_ORACLE);
usdcIlkOracle421611.set(USDC, CHAINLINK_USD_ORACLE);
usdcIlkOracle421611.set(WBTC, CHAINLINK_USD_ORACLE);
usdcIlkOracle421611.set(stETH, CHAINLINK_USD_ORACLE);
usdcIlkOracle421611.set(wstETH, CHAINLINK_USD_ORACLE);
usdcIlkOracle421611.set(ENS, CHAINLINK_USD_ORACLE);
usdcIlkOracle421611.set(LINK, CHAINLINK_USD_ORACLE);
usdcIlkOracle421611.set(UNI, CHAINLINK_USD_ORACLE);
CHAIN_ID_421611_ASSET_ORACLE_INFO.set(USDC, usdcIlkOracle421611);

// DAI base
const daiIlkOracle421611 = new Map<string, string>();
daiIlkOracle421611.set(WETH, CHAINLINK_USD_ORACLE);
daiIlkOracle421611.set(DAI, CHAINLINK_USD_ORACLE);
daiIlkOracle421611.set(USDC, CHAINLINK_USD_ORACLE);
daiIlkOracle421611.set(WBTC, CHAINLINK_USD_ORACLE);
daiIlkOracle421611.set(stETH, CHAINLINK_USD_ORACLE);
daiIlkOracle421611.set(wstETH, CHAINLINK_USD_ORACLE);
daiIlkOracle421611.set(ENS, CHAINLINK_USD_ORACLE);
daiIlkOracle421611.set(LINK, CHAINLINK_USD_ORACLE);
daiIlkOracle421611.set(UNI, CHAINLINK_USD_ORACLE);
CHAIN_ID_421611_ASSET_ORACLE_INFO.set(DAI, daiIlkOracle421611);

ORACLE_INFO.set(1, CHAIN_ID_1_ASSET_ORACLE_INFO);
ORACLE_INFO.set(42, CHAIN_ID_1_ASSET_ORACLE_INFO);
ORACLE_INFO.set(421611, CHAIN_ID_421611_ASSET_ORACLE_INFO);
