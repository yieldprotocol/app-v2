import { WETH, DAI, USDC, WBTC, stETH, wstETH, ENS, LINK, UNI } from './assets';

const COMPOSITE_MULTI_ORACLE = 'CompositeMultiOracle';
const CHAINLINK_MULTI_ORACLE = 'ChainlinkMultiOracle';
const CHAINLINK_USD_ORACLE = 'ChainlinkUSDOracle';
const ACCUMULATOR_MULTI_ORACLE = 'AccumulatorMultiOracle';

// map chain id to oracle info
export const ORACLE_INFO = new Map<number, Map<string, Map<string, string>>>();

// map asset (quote) and other asset (base) to a specific oracle based on where there is relevant price info for the pair
export const CHAIN_ID_1_ASSET_ORACLE_INFO = new Map<string, Map<string, string>>();
export const CHAIN_ID_4_ASSET_ORACLE_INFO = new Map<string, Map<string, string>>();
export const CHAIN_ID_42_ASSET_ORACLE_INFO = new Map<string, Map<string, string>>();
export const CHAIN_ID_421611_ASSET_ORACLE_INFO = new Map<string, Map<string, string>>();

/* chain id 1, 4, 42 */
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

// WETH base
const wethIlkOracle1 = new Map<string, string>();
wethIlkOracle1.set(WETH, CHAINLINK_MULTI_ORACLE);
wethIlkOracle1.set(DAI, CHAINLINK_MULTI_ORACLE);
wethIlkOracle1.set(USDC, CHAINLINK_MULTI_ORACLE);
wethIlkOracle1.set(WBTC, CHAINLINK_MULTI_ORACLE);
wethIlkOracle1.set(stETH, COMPOSITE_MULTI_ORACLE);
wethIlkOracle1.set(wstETH, CHAINLINK_MULTI_ORACLE);
wethIlkOracle1.set(ENS, COMPOSITE_MULTI_ORACLE);
wethIlkOracle1.set(LINK, CHAINLINK_MULTI_ORACLE);
wethIlkOracle1.set(UNI, CHAINLINK_MULTI_ORACLE);
CHAIN_ID_1_ASSET_ORACLE_INFO.set(WETH, wethIlkOracle1);

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
ORACLE_INFO.set(4, CHAIN_ID_1_ASSET_ORACLE_INFO);
ORACLE_INFO.set(42, CHAIN_ID_1_ASSET_ORACLE_INFO);
ORACLE_INFO.set(421611, CHAIN_ID_421611_ASSET_ORACLE_INFO);
