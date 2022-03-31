import { IAssetInfo, TokenType } from '../types';

export const UNKNOWN = '0x000000000000';

export const WETH = '0x303000000000';
export const DAI = '0x303100000000';
export const USDC = '0x303200000000';
export const WBTC = '0x303300000000';
export const stETH = '0x303500000000';
export const wstETH = '0x303400000000';
export const LINK = '0x303600000000';
export const ENS = '0x303700000000';
export const UNI = '0x313000000000';
export const yvUSDC = '0x303900000000';
export const MKR = '0x313100000000';

export const FDAI2203 = '0x313200000000';
export const FUSDC2203 = '0x313300000000';

export const FDAI2206 = '0x313400000000';
export const FUSDC2206 = '0x313500000000';

export const ETH_BASED_ASSETS = ['WETH', 'ETH', WETH];
export const IGNORE_BASE_ASSETS = ['ENS'];

export const DAI_PERMIT_ASSETS = ['DAI', DAI];
export const NON_PERMIT_ASSETS = [
  'WBTC',
  'LINK',
  WBTC,
  LINK,
  'ETH',
  'WETH',
  WETH,
  yvUSDC,
  'yvUSDC',
  FDAI2203,
  'FDAI2203',
  FUSDC2203,
  'FUSDC2203',
  FDAI2206,
  'FDAI2206',
  FUSDC2206,
  'FUSDC2206',
];

export const ASSET_INFO = new Map<string, IAssetInfo>();

ASSET_INFO.set(UNKNOWN, {
  version: '1',
  name: 'UNKNOWN',
  decimals: 18,
  symbol: 'UNKNOWN',
  showToken: true,
  isWrappedToken: false,
  color: '#FFFFFFFF',
  digitFormat: 2,
  tokenType: TokenType.ERC20_,
});

ASSET_INFO.set(DAI, {
  version: '1',
  name: 'Dai stable coin',
  decimals: 18,
  symbol: 'DAI',
  showToken: true,
  isWrappedToken: false,
  color: '#F5AC37',
  digitFormat: 2,
  tokenType: TokenType.ERC20_DaiPermit,
});

ASSET_INFO.set(USDC, {
  version: '1',
  name: 'USDC Stable coin',
  decimals: 18,
  symbol: 'USDC',
  showToken: true,
  isWrappedToken: false,
  color: '#2775CA',
  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,
});

ASSET_INFO.set(WBTC, {
  version: '1',
  name: 'Wrapped Bitcoin',
  decimals: 18,
  symbol: 'WBTC',
  showToken: true,
  isWrappedToken: false,
  color: '#5A5564',
  digitFormat: 6,
  tokenType: TokenType.ERC20_,
});

ASSET_INFO.set(ENS, {
  version: '1',
  name: 'Ethereum Naming Service',
  decimals: 18,
  symbol: 'ENS',
  showToken: true,
  isWrappedToken: false,
  color: '#000000',
  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,
});

ASSET_INFO.set(WETH, {
  version: '1',
  name: 'Wrapped Ether',
  decimals: 18,
  symbol: 'WETH',
  displaySymbol: 'ETH',
  showToken: true,
  isWrappedToken: false,
  color: '#FFFFFF',
  digitFormat: 6,
  tokenType: TokenType.ERC20_,
});

ASSET_INFO.set(wstETH, {
  version: '1',
  name: 'Wrapped Staked Ether',
  decimals: 18,
  symbol: 'wstETH',
  displaySymbol: 'wstETH',
  showToken: true,
  isWrappedToken: true,
  wrapHandlerAddress: '',
  wrappedTokenId: '',
  wrappedTokenAddress: '',
  color: '#00A3FF',
  digitFormat: 6,
  unwrappedTokenId: '0x303500000000',
  tokenType: TokenType.ERC20_Permit,

});

ASSET_INFO.set(stETH, {
  version: '1',
  name: 'Staked Eth',
  decimals: 18,
  symbol: 'stETH',
  showToken: false,
  isWrappedToken: false,
  wrapHandlerAddress: '0x491aB93faa921C8E634F891F96512Be14fD3DbB1',
  wrappedTokenId: '0x303400000000',
  wrappedTokenAddress: '0xB12C63eD91e901995E68023293AC1A308ffA6c3c',
  color: '#00A3FF',
  digitFormat: 6,
  unwrappedTokenId: '0x303500000000',
  tokenType: TokenType.ERC20_Permit,
});

ASSET_INFO.set(LINK, {
  version: '1',
  name: 'ChainLink',
  decimals: 18,
  symbol: 'LINK',
  showToken: true,
  isWrappedToken: false,
  color: '#2A5ADA',
  digitFormat: 6,
  tokenType: TokenType.ERC20_,
});

ASSET_INFO.set(yvUSDC, {
  version: '1',
  name: 'curve',
  decimals: 18,
  symbol: 'yvUSDC',
  showToken: true,
  isWrappedToken: false,
  color: '#3366CC',
  digitFormat: 2,
  tokenType: TokenType.ERC20_,
  limitToSeries: ['0x303230350000', '0x303230360000', '0x303230370000' ],
});

ASSET_INFO.set(UNI, {
  version: '1',
  name: 'Uniswap token',
  decimals: 18,
  symbol: 'UNI',
  showToken: true,
  isWrappedToken: false,
  color: '#FF007A',
  digitFormat: 6,
  tokenType: TokenType.ERC20_Permit,
});

ASSET_INFO.set(MKR, {
  version: '1',
  name: 'Maker Token',
  decimals: 18,
  symbol: 'MKR',
  showToken: false,
  isWrappedToken: false,
  color: '#FF007A',
  digitFormat: 6,
  tokenType: TokenType.ERC20_MKR,
});

ASSET_INFO.set(FDAI2203, {
  version: '1',
  name: 'FDAI2203',
  decimals: 8,
  symbol: 'FDAI2203',
  showToken: true,
  isWrappedToken: false,
  color: '#FF007A',
  digitFormat: 6,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 563371972493313,
  limitToSeries: ['0x303130350000']
});

ASSET_INFO.set(FUSDC2203, {
  version: '1',
  name: 'FUSDC2203',
  decimals: 8,
  symbol: 'FUSDC2203',
  showToken: true,
  isWrappedToken: false,
  color: '#FF007A',
  digitFormat: 6,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 844846949203969,
  limitToSeries: ['0x303230350000']
});

ASSET_INFO.set(FDAI2206, {
  version: '1',
  name: 'FDAI2206',
  decimals: 8,
  symbol: 'FDAI2206',
  showToken: false,
  isWrappedToken: false,
  color: '#FF007A',
  digitFormat: 6,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 563373963149313,
  limitToSeries: ['0x303130360000']
});

ASSET_INFO.set(FUSDC2206, {
  version: '1',
  name: 'FUSDC2206',
  decimals: 8,
  symbol: 'FUSDC2206',
  showToken: false,
  isWrappedToken: false,
  color: '#FF007A',
  digitFormat: 6,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 844848939859969,
  limitToSeries: ['0x303230360000']
});
