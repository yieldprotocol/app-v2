interface IAssetInfo {
  showToken: boolean;
  isWrappedToken: boolean; // Note: this is if it a token wrapped by the yield protocol (expect ETH - which is handled differently)

  color: string;
  digitFormat: number; // this is the 'resonable' number of digits to show. accuracy equavalent to +- 1 us cent.

  displaySymbol?: string; // override for symbol display
  wrapHandlerAddress?: string;
  wrappedTokenId?: string;
  wrappedTokenAddress?: string;
}

export const ASSET_INFO = new Map<string, IAssetInfo>();
ASSET_INFO.set('DAI', { showToken: true, isWrappedToken: false, color: '#F5AC37', digitFormat: 2 });
ASSET_INFO.set('USDC', { showToken: true, isWrappedToken: false, color: '#2775CA', digitFormat: 2 });
ASSET_INFO.set('WBTC', { showToken: true, isWrappedToken: false, color: '#5A5564', digitFormat: 6 });
ASSET_INFO.set('USDT', { showToken: true, isWrappedToken: false, color: '#50af95', digitFormat: 2 });
ASSET_INFO.set('LINK', { showToken: false, isWrappedToken: false, color: '#2A5ADA', digitFormat: 2 });
ASSET_INFO.set('ENS', { showToken: false, isWrappedToken: false, color: '#000000', digitFormat: 2 });

ASSET_INFO.set('WETH', {
  displaySymbol: 'ETH',
  showToken: true,
  isWrappedToken: false,
  color: '#FFFFFF',
  digitFormat: 6,
});

ASSET_INFO.set('wstETH', {
  displaySymbol: 'stETH',
  showToken: true,
  isWrappedToken: true,
  wrapHandlerAddress: '0x491aB93faa921C8E634F891F96512Be14fD3DbB1',
  wrappedTokenId: '',
  wrappedTokenAddress: '',
  color: '#00A3FF',
  digitFormat: 6,
});

ASSET_INFO.set('stETH', {
  showToken: true,
  isWrappedToken: false,
  wrapHandlerAddress: '0x491aB93faa921C8E634F891F96512Be14fD3DbB1',
  wrappedTokenId: '0x303400000000',
  wrappedTokenAddress: '0xB12C63eD91e901995E68023293AC1A308ffA6c3c',
  color: '#00A3FF',
  digitFormat: 6,
});
