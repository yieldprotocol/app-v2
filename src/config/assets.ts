import { TokenType, TokenRole } from '../types';

export interface AssetStaticInfo {
  assetAddress: string;
  joinAddress: string;
  tokenType: TokenType;
  name: string;
  version: string;
  symbol: string;
  decimals: number;
  showToken: boolean; // Display/hide the token on the UI
  digitFormat: number; // this is the 'reasonable' number of digits to show. accuracy equivalent to +- 1 us cent.

  tokenRoles: TokenRole[];

  // optionals
  // isYieldBase?: boolean;

  tokenIdentifier?: number | string; // used for identifying tokens in a multitoken contract
  displaySymbol?: string; // override for symbol display
  wrapHandlerAddresses?: Map<number, string>; // mapping a chain id to the corresponding wrap handler address
  unwrapHandlerAddresses?: Map<number, string>; // mapping a chain id to the correpsonding unwrap handler address
  proxyId?: string; // associated token (eg. )
}

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
export const RETH = '0xe03016000000';

/* Notional fCash assets */
export const FDAI2203 = '0x313200000000';
export const FUSDC2203 = '0x313300000000';

export const FDAI2206 = '0x313400000000';
export const FUSDC2206 = '0x313500000000';

export const FDAI2209 = '0x313600000000';
export const FUSDC2209 = '0x313700000000';

export const FETH2212 = '0x323800000000';
export const FDAI2212 = '0x323300000000';
export const FUSDC2212 = '0x323400000000';

export const FETH2303 = '0x323900000000';
export const FDAI2303 = '0x323500000000';
export const FUSDC2303 = '0x323600000000';

export const FETH2306 = '0x40301200028B';
export const FDAI2306 = '0x40311200028B';
export const FUSDC2306 = '0x40321200028B';

export const FETH2309 = '0x40301200028E';
export const FDAI2309 = '0x40311200028E';
export const FUSDC2309 = '0x40321200028E';

export const FETH2312 = '0x403012000291';
export const FDAI2312 = '0x403112000291';
export const FUSDC2312 = '0x403212000291';

/* Convex Curve LP token assets */
export const CVX3CRV = '0x313900000000';

export const CRAB = '0x333800000000';
export const USDT = '0x30a000000000';

export const CONVEX_BASED_ASSETS = [
  'CVX3CRV',
  CVX3CRV,
  'CVX3CRV MOCK',
  'Curve.fi DAI/USDC/USDT Convex Deposit Mock',
  'cvx3Crv',
];
export const ETH_BASED_ASSETS = ['WETH', 'ETH', WETH];
export const IGNORE_BASE_ASSETS = ['ENS'];

export const ASSETS = new Map<number, Map<string, AssetStaticInfo>>();

ASSETS.set(
  1,
  new Map([
    [
      DAI,
      {
        assetAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        joinAddress: '0x4fE92119CDf873Cf8826F4E6EcfD4E578E3D44Dc',
        version: '1',
        name: 'Dai Stablecoin',
        decimals: 18,
        symbol: 'DAI',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC20_DaiPermit,
        tokenRoles: [TokenRole.BASE, TokenRole.COLLATERAL],
      },
    ],
    [
      USDC,
      {
        assetAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        joinAddress: '0x0d9A1A773be5a83eEbda23bf98efB8585C3ae4f4',
        version: '2',
        name: 'USD Coin',
        decimals: 6,
        symbol: 'USDC',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC20_Permit,
        tokenRoles: [TokenRole.BASE, TokenRole.COLLATERAL],
      },
    ],
    [
      WBTC,
      {
        assetAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        joinAddress: '0x00De0AEFcd3069d88f85b4F18b144222eaAb92Af',
        version: '1',
        name: 'Wrapped BTC',
        decimals: 8,
        symbol: 'WBTC',
        showToken: true,
        digitFormat: 6,
        tokenType: TokenType.ERC20_Permit,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      ENS,
      {
        assetAddress: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
        joinAddress: '0x5AAfd8F0bfe3e1e6bAE781A6641096317D762969',
        version: '1',
        name: 'Ethereum Name Service',
        decimals: 18,
        symbol: 'ENS',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC20_Permit,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      WETH,
      {
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
        tokenRoles: [TokenRole.BASE, TokenRole.COLLATERAL],
      },
    ],
    [
      wstETH,
      {
        assetAddress: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
        joinAddress: '0x5364d336c2d2391717bD366b29B6F351842D7F82',
        version: '1',
        name: 'Wrapped liquid staked Ether 2.0',
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
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      stETH,
      {
        assetAddress: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
        joinAddress: '0x5364d336c2d2391717bD366b29B6F351842D7F82',
        version: '1',
        name: 'Liquid staked Ether 2.0',
        decimals: 18,
        symbol: 'stETH',
        showToken: true,
        digitFormat: 6,
        tokenType: TokenType.ERC20_Permit,
        wrapHandlerAddresses: new Map([[1, '0x491aB93faa921C8E634F891F96512Be14fD3DbB1']]),
        unwrapHandlerAddresses: new Map([]),
        proxyId: wstETH,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      LINK,
      {
        assetAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        joinAddress: '0xbDaBb91cDbDc252CBfF3A707819C5f7Ec2B92833',
        version: '1',
        name: 'ChainLink Token',
        decimals: 18,
        symbol: 'LINK',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC20_,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      yvUSDC,
      {
        assetAddress: '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
        joinAddress: '0x403ae7384E89b086Ea2935d5fAFed07465242B38',
        version: '1',
        name: 'USDC yVault',
        decimals: 6,
        symbol: 'yvUSDC',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC20_,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      UNI,
      {
        assetAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        joinAddress: '0x41567f6A109f5bdE283Eb5501F21e3A0bEcbB779',
        version: '1',
        name: 'Uniswap',
        decimals: 18,
        symbol: 'UNI',
        showToken: true,
        digitFormat: 4,
        tokenType: TokenType.ERC20_Permit,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FRAX,
      {
        assetAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
        joinAddress: '0x5655A973A49e1F9c1408bb9A617Fd0DBD0352464',
        version: '1',
        name: 'Frax',
        decimals: 18,
        symbol: 'FRAX',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC20_,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FDAI2203,
      {
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
        wrapHandlerAddresses: new Map([]),
        unwrapHandlerAddresses: new Map([]),
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FUSDC2203,
      {
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
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FDAI2206,
      {
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
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FUSDC2206,
      {
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
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FDAI2209,
      {
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
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FUSDC2209,
      {
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
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FETH2212,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0xe888E0403e3e992fDbB473650547428e90F9DDFC',
        version: '1',
        name: 'Notional fCash ETH Dec 22',
        decimals: 8,
        symbol: 'fETH2212',
        showToken: true,
        digitFormat: 6,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 281902967750657,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FETH2303,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0xC4cb2489a845384277564613A0906f50dD66e482',
        version: '1',
        name: 'Notional fCash ETH March 23',
        decimals: 8,
        symbol: 'fETH2303',
        showToken: true,
        digitFormat: 6,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 281904958406657,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FUSDC2212,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0xA9078E573EC536c4066A5E89F715553Ed67B13E0',
        version: '1',
        name: 'Notional fCash USDC Dec 22',
        decimals: 8,
        symbol: 'fUSDC2212',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 844852921171969,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FUSDC2303,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0x3FdDa15EccEE67248048a560ab61Dd2CdBDeA5E6',
        version: '1',
        name: 'Notional fCash USDC March 23',
        decimals: 8,
        symbol: 'fUSDC2303',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 844854911827969,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FDAI2212,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0x83e99A843607CfFFC97A3acA15422aC672a463eF',
        version: '1',
        name: 'Notional fCash DAI Dec 22',
        decimals: 8,
        symbol: 'fDAI2212',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 563377944461313,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FDAI2303,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0xE6A63e2166fcEeB447BFB1c0f4f398083214b7aB',
        version: '1',
        name: 'Notional fCash DAI March 23',
        decimals: 8,
        symbol: 'fDAI2303',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 563379935117313,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FDAI2306,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0xe295111049A6665b35C054e3D0e896816bD12b2C',
        version: '1',
        name: 'Notional fCash DAI June 23',
        decimals: 8,
        symbol: 'fDAI2306',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 563381925773313,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FUSDC2306,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0x53B0C1b8fEB4dEcdcc068367119110E20c3BCBD3',
        version: '1',
        name: 'Notional fCash USDC June 23',
        decimals: 8,
        symbol: 'fUSDC2306',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 844856902483969,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FETH2306,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0x067Fb37Dd51a4eF6Fea0E006CaF689Db6c705812',
        version: '1',
        name: 'Notional fCash ETH June 23',
        decimals: 8,
        symbol: 'fETH2306',
        showToken: true,
        digitFormat: 6,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 281906949062657,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      CRAB,
      {
        assetAddress: '0x3B960E47784150F5a63777201ee2B15253D713e8',
        joinAddress: '0xc76a01d18463d7aebea574a34b7d70d8aab389b2',
        version: '1',
        name: 'Crab Strategy v2',
        decimals: 18,
        symbol: 'Crabv2',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC20_,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      RETH,
      {
        assetAddress: '0xae78736Cd615f374D3085123A210448E74Fc6393',
        joinAddress: '0x6fb97c793f0d83cda7796f45a2bb697e73a045a8',
        version: '1',
        name: 'Rocket Pool ETH',
        decimals: 18,
        symbol: 'rETH',
        showToken: true,
        digitFormat: 6,
        tokenType: TokenType.ERC20_,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],

    [
      FETH2309,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0xDC94e2A69A59772c1Bf7f1f10267dA657f99D307',
        version: '1',
        name: 'Notional fCash ETH Sept 23',
        decimals: 8,
        symbol: 'fETH2309',
        showToken: true,
        digitFormat: 6,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 281908939718657,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],

    [
      FDAI2309,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0x3ACD66448cA3Df60fB816387D3D10801b70c8D79',
        version: '1',
        name: 'Notional fCash Dai Sept 23',
        decimals: 8,
        symbol: 'fDAI2309',
        showToken: true,
        digitFormat: 6,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 563383916429313,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],

    [
      FUSDC2309,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0x591464275c563f38d2E49496Af4230F984c11848',
        version: '1',
        name: 'Notional fCash USDC Sept 23',
        decimals: 8,
        symbol: 'fUSDC2309',
        showToken: true,
        digitFormat: 6,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 844858893139969,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],

    [
      USDT,
      {
        assetAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        joinAddress: '0x62E53931a07d8679Fb73e543459D1D9f4159F244',
        version: '1',
        name: 'Tether USD',
        decimals: 6,
        symbol: 'USDT',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC20_,
        tokenRoles: [TokenRole.BASE],
      },
    ],

    [
      FETH2312,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0x3f2Dc75f7bbE69E055Cd06Bf2B0123a212a3B216',
        version: '1',
        name: 'Notional fCash ETH Dec 23',
        decimals: 8,
        symbol: 'fETH2312',
        showToken: true,
        digitFormat: 6,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 281910930374657, //
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
    [
      FDAI2312,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0x0be1Bf3A5E67269837b775F0b1f4c275753755Fe',
        version: '1',
        name: 'Notional fCash DAI Dec 23',
        decimals: 8,
        symbol: 'fDAI2312',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 563385907085313, //
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],

    [
      FUSDC2312,
      {
        assetAddress: '0x1344A36A1B56144C3Bc62E7757377D288fDE0369',
        joinAddress: '0xB415e649ECF52dd26C59344355d3359B02fD6921',
        version: '1',
        name: 'Notional fCash USDC Dec 23',
        decimals: 8,
        symbol: 'fUSDC2312',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC1155_,
        tokenIdentifier: 844860883795969,
        tokenRoles: [TokenRole.COLLATERAL],
      },
    ],
  ])
);

ASSETS.set(
  42161,
  new Map([
    [
      DAI,
      {
        version: '2',
        name: 'Dai Stablecoin',
        decimals: 18,
        symbol: 'DAI',

        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC20_Permit,

        assetAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        joinAddress: '0xc31cce4fFA203d8F8D865b6cfaa4F36AD77E9810',
        tokenRoles: [TokenRole.BASE, TokenRole.COLLATERAL],
      },
    ],
    [
      USDC,
      {
        version: '1',
        name: 'USD Coin (Arb1)',
        decimals: 6,
        symbol: 'USDC',

        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC20_Permit,

        assetAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        joinAddress: '0x1229C71482E458fa2cd51d13eB157Bd2b5D5d1Ee',
        tokenRoles: [TokenRole.BASE, TokenRole.COLLATERAL],
      },
    ],
    [
      WETH,
      {
        version: '1',
        name: 'Wrapped Ether',
        decimals: 18,
        symbol: 'WETH',

        displaySymbol: 'ETH',
        showToken: true,
        digitFormat: 6,
        tokenType: TokenType.ERC20_Permit,

        assetAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        joinAddress: '0xaf93a04d5D8D85F69AF65ED66A9717DB0796fB10',
        tokenRoles: [TokenRole.BASE, TokenRole.COLLATERAL],
      },
    ],
    [
      USDT,
      {
        version: '1',
        name: 'Tether USD',
        decimals: 6,
        symbol: 'USDT',

        displaySymbol: 'USDT',
        showToken: true,
        digitFormat: 2,
        tokenType: TokenType.ERC20_Permit,

        assetAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        joinAddress: '0xcb60Bd598bf48be1E24262E8BF1e3703FECA3470',
        tokenRoles: [TokenRole.BASE],
      },
    ],
  ])
);
