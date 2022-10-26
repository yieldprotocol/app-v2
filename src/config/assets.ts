import { TokenType } from '../types';

export interface AssetInfo {
  assetAddress: string;
  joinAddress: string;

  tokenType: TokenType;
  tokenIdentifier?: number | string; // used for identifying tokens in a multitoken contract

  name: string;
  version: string;
  symbol: string;
  decimals: number;
  isYieldBase?: boolean;

  showToken: boolean; // Display/hide the token on the UI

  digitFormat: number; // this is the 'reasonable' number of digits to show. accuracy equivalent to +- 1 us cent.
  displaySymbol?: string; // override for symbol display

  limitToSeries?: string[];

  wrapHandlerAddresses?: Map<number, string>; // mapping a chain id to the corresponding wrap handler address
  unwrapHandlerAddresses?: Map<number, string>; // mapping a chain id to the correpsonding unwrap handler address
  proxyId?: string;
}

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
export const FRAX = '0x313800000000';

/* Notional fCash assets */
export const FDAI2203 = '0x313200000000';
export const FUSDC2203 = '0x313300000000';

export const FDAI2206 = '0x313400000000';
export const FUSDC2206 = '0x313500000000';

export const FDAI2209 = '0x313600000000';
export const FUSDC2209 = '0x313700000000';

/* Convex Curve LP token assets */
export const CVX3CRV = '0x313900000000';

export const FETH2212 = '0x323800000000';
export const FDAI2212 = '0x323300000000';
export const FUSDC2212 = '0x323400000000';

export const FETH2303 = '0x323900000000';
export const FDAI2303 = '0x323500000000';
export const FUSDC2303 = '0x323600000000';


// joins


// [
//   "0x323300000000",
//   "0x83e99A843607CfFFC97A3acA15422aC672a463eF"
// ],
// [
//   "0x323400000000",
//   "0xA9078E573EC536c4066A5E89F715553Ed67B13E0"
// ],

//   "0x323500000000",
//   "0xE6A63e2166fcEeB447BFB1c0f4f398083214b7aB"
// ],
// [
//   "0x323600000000",
//   "0x3FdDa15EccEE67248048a560ab61Dd2CdBDeA5E6"
// ]

// [
//   "0x323800000000",
//   "0xe888E0403e3e992fDbB473650547428e90F9DDFC"
// ],

// [
//   "0x323900000000",
//   "0xC4cb2489a845384277564613A0906f50dD66e482"
// ],
// [

export const CONVEX_BASED_ASSETS = [
  'CVX3CRV',
  CVX3CRV,
  'CVX3CRV MOCK',
  'Curve.fi DAI/USDC/USDT Convex Deposit Mock',
  'cvx3Crv',
];
export const ETH_BASED_ASSETS = ['WETH', 'ETH', WETH];
export const IGNORE_BASE_ASSETS = ['ENS'];

export const ASSETS_42161 = new Map<string, AssetInfo>();

export const ASSETS_1 = new Map<string, AssetInfo>();

ASSETS_1.set(DAI, {
  assetAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  joinAddress: '0x4fE92119CDf873Cf8826F4E6EcfD4E578E3D44Dc',

  version: '1',
  name: 'Dai stable coin',
  decimals: 18,
  symbol: 'DAI',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC20_DaiPermit,
  isYieldBase: true,
});

ASSETS_1.set(USDC, {
  assetAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  joinAddress: '0x0d9A1A773be5a83eEbda23bf98efB8585C3ae4f4',

  version: '1',
  name: 'USDC Stable coin',
  decimals: 18,
  symbol: 'USDC',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,
  isYieldBase: true,
});

ASSETS_1.set(WBTC, {
  assetAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  joinAddress: '0x00De0AEFcd3069d88f85b4F18b144222eaAb92Af',

  version: '1',
  name: 'Wrapped Bitcoin',
  decimals: 18,
  symbol: 'WBTC',
  showToken: true,
  digitFormat: 6,
  tokenType: TokenType.ERC20_,
});

ASSETS_1.set(ENS, {
  assetAddress: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
  joinAddress: '0x5AAfd8F0bfe3e1e6bAE781A6641096317D762969',

  version: '1',
  name: 'Ethereum Naming Service',
  decimals: 18,
  symbol: 'ENS',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,
});

ASSETS_1.set(WETH, {
  assetAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  joinAddress: '0x3bDb887Dc46ec0E964Df89fFE2980db0121f0fD0',

  version: '1',
  name: 'Wrapped Ether',
  decimals: 18,
  symbol: 'WETH',
  displaySymbol: 'ETH',
  showToken: true,
  digitFormat: 6,
  tokenType: TokenType.ERC20_,
  isYieldBase: true,
});

ASSETS_1.set(wstETH, {
  assetAddress: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  joinAddress: '0x5364d336c2d2391717bD366b29B6F351842D7F82',

  version: '1',
  name: 'Wrapped Staked Ether',
  decimals: 18,
  symbol: 'wstETH',
  displaySymbol: 'wstETH',
  showToken: true,
  digitFormat: 6,
  tokenType: TokenType.ERC20_Permit,
  wrapHandlerAddresses: new Map([]),
  unwrapHandlerAddresses: new Map([
    [1, '0x491aB93faa921C8E634F891F96512Be14fD3DbB1'],
    [4, '0x64BA0F1D2E5479BF132936328e8c533c95646fE8'],
    [5, '0x9f65A6c2b2F12117573323443C8C2290f4C1e675'],
  ]),
});

ASSETS_1.set(stETH, {
  assetAddress: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  joinAddress: '0x5364d336c2d2391717bD366b29B6F351842D7F82',

  version: '1',
  name: 'Staked Eth',
  decimals: 18,
  symbol: 'stETH',
  showToken: false,
  digitFormat: 6,
  tokenType: TokenType.ERC20_Permit,
  wrapHandlerAddresses: new Map([[1, '0x491aB93faa921C8E634F891F96512Be14fD3DbB1']]),
  unwrapHandlerAddresses: new Map([]),
  proxyId: wstETH,
});

ASSETS_1.set(LINK, {
  assetAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  joinAddress: '0xbDaBb91cDbDc252CBfF3A707819C5f7Ec2B92833',

  version: '1',
  name: 'ChainLink',
  decimals: 18,
  symbol: 'LINK',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC20_,
});

ASSETS_1.set(yvUSDC, {
  assetAddress: '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
  joinAddress: '0x403ae7384E89b086Ea2935d5fAFed07465242B38',

  version: '1',
  name: 'Yearn Vault USDC',
  decimals: 18,
  symbol: 'yvUSDC',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC20_,
  limitToSeries: ['0x303230350000', '0x303230360000', '0x303230370000', '0x303230380000', '0x303230390000'],
});

ASSETS_1.set(UNI, {
  assetAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  joinAddress: '0x41567f6A109f5bdE283Eb5501F21e3A0bEcbB779',

  version: '1',
  name: 'Uniswap token',
  decimals: 18,
  symbol: 'UNI',
  showToken: true,
  digitFormat: 4,
  tokenType: TokenType.ERC20_Permit,
});

ASSETS_1.set(FDAI2203, {
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0xb8d37d6Fcbc6882480633aBF3682b1D4ae2aB124',

  version: '1',
  name: 'fDAI2203',
  decimals: 8,
  symbol: 'FDAI2203',
  showToken: false,
  digitFormat: 2,

  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 563371972493313,
  limitToSeries: ['0x303130350000'],

  wrapHandlerAddresses: new Map([]),
  unwrapHandlerAddresses: new Map([]),
});

ASSETS_1.set(FUSDC2203, {
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x4970B046565BEE1DE8308E41BD22d0061A251911',

  version: '1',
  name: 'fUSDC2203',
  decimals: 8,
  symbol: 'FUSDC2203',
  showToken: false,
  digitFormat: 2,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 844846949203969,
  limitToSeries: ['0x303230350000'],
});

ASSETS_1.set(FDAI2206, {
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x9f41f9eE1A7B24b6B016a7e61a4161A0CFCf5987',

  version: '1',
  name: 'fDAI2206',
  decimals: 8,
  symbol: 'FDAI2206',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 563373963149313,
  limitToSeries: ['0x303130360000'],
});

ASSETS_1.set(FUSDC2206, {
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x62DdD41F8A65B03746656D85b6B2539aE42e23e8',

  version: '1',
  name: 'fUSDC2206',
  decimals: 8,
  symbol: 'FUSDC2206',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 844848939859969,
  limitToSeries: ['0x303230360000'],
});

ASSETS_1.set(FDAI2209, {
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x399bA81A1f1Ed0221c39179C50d4d4Bc85C3F3Ab',

  version: '1',
  name: 'fDAI2209',
  decimals: 8,
  symbol: 'FDAI2209',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 563375953805313,
  limitToSeries: ['0x303130370000'],
});

ASSETS_1.set(FUSDC2209, {
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x0Bfd3B8570A4247157c5468861d37dA55AAb9B4b',
  version: '1',
  name: 'fUSDC2209',
  decimals: 8,
  symbol: 'FUSDC2209',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 844850930515969,
  limitToSeries: ['0x303230370000'],
});


ASSETS_1.set(FETH2212 , {
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0xe888E0403e3e992fDbB473650547428e90F9DDFC',
  version: '1',
  name: 'fETH2212',
  decimals: 8,
  symbol: 'FETH2212',
  showToken: true,
  digitFormat: 6,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 281902967750657,
  limitToSeries: ['0x303030380000'],
});

ASSETS_1.set(FETH2303, {
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0xC4cb2489a845384277564613A0906f50dD66e482',
  version: '1',
  name: 'fETH2303',
  decimals: 8,
  symbol: 'FETH2303',
  showToken: true,
  digitFormat: 6,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 281904958406657,
  limitToSeries: ['0x303030390000'],
});

ASSETS_1.set(FUSDC2212, { 
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0xA9078E573EC536c4066A5E89F715553Ed67B13E0',
  version: '1',
  name: 'fUSDC2212',
  decimals: 8,
  symbol: 'FUSDC2212',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 844852921171969 ,
  limitToSeries: ['0x303230380000'],
});
ASSETS_1.set(FUSDC2303, {
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x3FdDa15EccEE67248048a560ab61Dd2CdBDeA5E6',
  version: '1',
  name: 'fUSDC2303',
  decimals: 8,
  symbol: 'FUSDC2303',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 844854911827969,
  limitToSeries: ['0x303230390000'],
});
ASSETS_1.set(FDAI2212, {
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0x83e99A843607CfFFC97A3acA15422aC672a463eF',
  version: '1',
  name: 'fDAI2212',
  decimals: 8,
  symbol: 'FDAI2212',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 563377944461313,
  limitToSeries: ['0x303130380000'],
});
ASSETS_1.set(FDAI2303, {
  assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
  joinAddress: '0xE6A63e2166fcEeB447BFB1c0f4f398083214b7aB',
  version: '1',
  name: 'fDAI2303,',
  decimals: 8,
  symbol: 'FDAI2303,',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC1155_,
  tokenIdentifier: 563379935117313,
  limitToSeries: ['0x303130390000'],
});



ASSETS_1.set(FRAX, {
  assetAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
  joinAddress: '0x5655A973A49e1F9c1408bb9A617Fd0DBD0352464',

  version: '1',
  name: 'frax',
  decimals: 18,
  symbol: 'FRAX',
  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC20_,
  limitToSeries: [],
  isYieldBase: true,
});

// ASSETS_1.set(CVX3CRV, {

//   assetAddress: '',
//   joinAddress: '',

//   version: '1',
//   name: 'cvx3crv',
//   decimals: 18,
//   symbol: 'cvx3crv',
//   showToken: false,
//   digitFormat: 2,
//   tokenType: TokenType.ERC20_,
//   limitToSeries: [
//     '0x303130360000', // june dai
//     '0x303130370000', // sept dai
//     '0x303230370000', // sept usdc
//     '0x303230360000', // june usdc
//   ],
// });

ASSETS_42161.set(DAI, {
  version: '2',
  name: 'Dai stable coin',
  decimals: 18,
  symbol: 'DAI',

  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,

  assetAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  joinAddress: '0xc31cce4fFA203d8F8D865b6cfaa4F36AD77E9810',
  isYieldBase: true,
});

ASSETS_42161.set(USDC, {
  version: '1',
  name: 'USDC Stable coin',
  decimals: 18,
  symbol: 'USDC',

  showToken: true,
  digitFormat: 2,
  tokenType: TokenType.ERC20_Permit,

  assetAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  joinAddress: '0x1229C71482E458fa2cd51d13eB157Bd2b5D5d1Ee',
  isYieldBase: true,
});

ASSETS_42161.set(WETH, {
  version: '1',
  name: 'Wrapped Ether',
  decimals: 18,
  symbol: 'WETH',

  displaySymbol: 'ETH',
  showToken: true,
  digitFormat: 6,
  tokenType: TokenType.ERC20_,

  assetAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  joinAddress: '0xaf93a04d5D8D85F69AF65ED66A9717DB0796fB10',
  isYieldBase: true,
});
