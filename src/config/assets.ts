import { ethers } from "ethers";
import { IAssetInfo } from "../types";

export const WETH =  '0x303000000000';
export const DAI = '0x303100000000';
export const USDC = '0x303200000000';
export const WBTC = '0x303300000000';
export const stETH = '0x303400000000';
export const wstETH = '0x303500000000';
export const LINK = '0x303600000000';
export const ENS = '0x303600000000';

export const ETH_BASED_ASSETS = ['WETH', 'ETH', WETH, ethers.utils.formatBytes32String('ETH').slice(0, 14) ];
export const DAI_PERMIT_ASSETS = [ 'DAI', DAI ];
export const NON_PERMIT_ASSETS = ['WBTC', 'LINK', WBTC, LINK];

export const IGNORE_BASE_ASSETS = ['ETH', 'WETH', WETH];

export const ASSET_INFO = new Map<string, IAssetInfo>();
ASSET_INFO.set('DAI', { showToken: true, isWrappedToken: false, color: '#F5AC37', digitFormat: 2 });
ASSET_INFO.set('USDC', { showToken: true, isWrappedToken: false, color: '#2775CA', digitFormat: 2 });
ASSET_INFO.set('WBTC', { showToken: true, isWrappedToken: false, color: '#5A5564', digitFormat: 6 });
ASSET_INFO.set('USDT', { showToken: true, isWrappedToken: false, color: '#50af95', digitFormat: 2 });
ASSET_INFO.set('LINK', { showToken: false, isWrappedToken: false, color: '#2A5ADA', digitFormat: 2 });
ASSET_INFO.set('ENS', { showToken: true, isWrappedToken: false, color: '#000000', digitFormat: 2 });
ASSET_INFO.set('WETH', {
  displaySymbol: 'ETH',
  showToken: true,
  isWrappedToken: false,
  color: '#FFFFFF',
  digitFormat: 6,
});
ASSET_INFO.set('wstETH', {
  displaySymbol: 'wstETH',
  showToken: true,
  isWrappedToken: false,
  wrapHandlerAddress: '0x491aB93faa921C8E634F891F96512Be14fD3DbB1',
  wrappedTokenId: '',
  wrappedTokenAddress: '',
  color: '#00A3FF',
  digitFormat: 6,
  unwrappedTokenId: "0x303500000000"
});

ASSET_INFO.set('stETH', {
  showToken: false,
  isWrappedToken: false,
  wrapHandlerAddress: '0x491aB93faa921C8E634F891F96512Be14fD3DbB1',
  wrappedTokenId: '0x303400000000',
  wrappedTokenAddress: '0xB12C63eD91e901995E68023293AC1A308ffA6c3c',
  color: '#00A3FF',
  digitFormat: 6,
  unwrappedTokenId: "0x303500000000"
});
