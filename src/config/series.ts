export interface SeriesStaticInfo {
  id: string;
  fyTokenAddress: string;
  poolAddress: string;
}

export const SERIES_1 = new Map<string, SeriesStaticInfo>();
export const SERIES_42161 = new Map<string, SeriesStaticInfo>();

const USDC_2112_SERIES_ID = '0x303230340000';
const USDC_2203_SERIES_ID = '0x303230350000';
const USDC_2206_SERIES_ID = '0x303230360000';
const USDC_2209_SERIES_ID = '0x303230370000';
const USDC_2212_SERIES_ID = '0x303230380000';
const USDC_2303_SERIES_ID = '0x303230390000';

const DAI_2112_SERIES_ID = '0x303130340000';
const DAI_2203_SERIES_ID = '0x303130350000';
const DAI_2206_SERIES_ID = '0x303130360000';
const DAI_2209_SERIES_ID = '0x303130370000';
const DAI_2212_SERIES_ID = '0x303130380000';
const DAI_2303_SERIES_ID = '0x303130390000';

const WETH_2206_SERIES_ID = '0x303030360000';
const WETH_2209_SERIES_ID = '0x303030370000';
const WETH_2212_SERIES_ID = '0x303030380000';
const WETH_2303_SERIES_ID = '0x303030390000';

const FRAX_2206_SERIES_ID = '0x303330360000';
const FRAX_2209_SERIES_ID = '0x303330370000';
const FRAX_2212_SERIES_ID = '0x313830380000';
const FRAX_2303_SERIES_ID = '0x313830390000';

// 2306
const USDC_2306_SERIES_ID = '0x0032FF00028B';
const DAI_2306_SERIES_ID = '0x0031FF00028B';
const WETH_2306_SERIES_ID = '0x0030FF00028B';
const FRAX_2306_SERIES_ID = '0x0138FF00028B';

/* 2112 */
SERIES_1.set(USDC_2112_SERIES_ID, {
  id: USDC_2112_SERIES_ID,
  fyTokenAddress: '0x30FaDeEaAB2d7a23Cb1C35c05e2f8145001fA533',
  poolAddress: '0x407353d527053F3a6140AAA7819B93Af03114227',
});

SERIES_1.set(DAI_2112_SERIES_ID, {
  id: DAI_2112_SERIES_ID,
  fyTokenAddress: '0x0119451f94E98716c3fa17ff31d19C98d134DD6d',
  poolAddress: '0x3771C99c087a81dF4633b50D8B149aFaA83E3c9E',
});

/* 2203 */
SERIES_1.set(USDC_2203_SERIES_ID, {
  id: USDC_2203_SERIES_ID,
  fyTokenAddress: '0x33c4F1A98CF0F540D8a1F6119129337eC5973E29',
  poolAddress: '0x80142add3A597b1eD1DE392A56B2cef3d8302797',
});

SERIES_1.set(DAI_2203_SERIES_ID, {
  id: DAI_2203_SERIES_ID,
  fyTokenAddress: '0x30d94Da9ee56d3EF0c97EBa22223784F6bCf37B9',
  poolAddress: '0x2e4B70D0F020E62885E82bf75bc123e1Aa8c79cA',
});

/* 2206 */
SERIES_1.set(WETH_2206_SERIES_ID, {
  id: WETH_2206_SERIES_ID,
  fyTokenAddress: '0x7Eaf9612Fbaa544FefbFB3C9A934c9441084816e',
  poolAddress: '0x341B0976F962eC34eEaF31cdF2464Ab3B15B6301',
});

SERIES_1.set(USDC_2206_SERIES_ID, {
  id: USDC_2206_SERIES_ID,
  fyTokenAddress: '0x4568bBcf929AB6B4d716F2a3D5A967a1908B4F1C',
  poolAddress: '0xEf82611C6120185D3BF6e020D1993B49471E7da0',
});

SERIES_1.set(DAI_2206_SERIES_ID, {
  id: DAI_2206_SERIES_ID,
  fyTokenAddress: '0x2043452d7f1aaed1b5A266EFAa80e2D04872EB88',
  poolAddress: '0x5D14Ab14adB3a3D9769a67a1D09634634bdE4C9B',
});

SERIES_1.set(FRAX_2206_SERIES_ID, {
  id: FRAX_2206_SERIES_ID,
  fyTokenAddress: '0x7F0dD461D77F84cDd3ceD46F9D550e35F1969a24',
  poolAddress: '0xA4d45197E3261721B8A8d901489Df5d4D2E79eD7',
});

/* 2209 */
SERIES_1.set(USDC_2209_SERIES_ID, {
  id: USDC_2209_SERIES_ID,
  fyTokenAddress: '0x53C2a1bA37FF3cDaCcb3EA030DB3De39358e5593',
  poolAddress: '0xf5Fd5A9Db9CcCc6dc9f5EF1be3A859C39983577C',
});

SERIES_1.set(WETH_2209_SERIES_ID, {
  id: WETH_2209_SERIES_ID,
  fyTokenAddress: '0x53358d088d835399F1E97D2a01d79fC925c7D999',
  poolAddress: '0xc3348D8449d13C364479B1F114bcf5B73DFc0dc6',
});

SERIES_1.set(DAI_2209_SERIES_ID, {
  id: DAI_2209_SERIES_ID,
  fyTokenAddress: '0xFCb9B8C5160Cf2999f9879D8230dCed469E72eeb',
  poolAddress: '0x6BaC09a67Ed1e1f42c29563847F77c28ec3a04FC',
});

SERIES_1.set(FRAX_2209_SERIES_ID, {
  id: FRAX_2209_SERIES_ID,
  fyTokenAddress: '0x3353E1E2976DBbc191a739871faA8E6E9D2622c7',
  poolAddress: '0x4b32C37Be5949e77ba3726E863a030BD77942A97',
});

/* 2212 */
SERIES_1.set(DAI_2212_SERIES_ID, {
  id: DAI_2212_SERIES_ID,
  fyTokenAddress: '0xcDfBf28Db3B1B7fC8efE08f988D955270A5c4752',
  poolAddress: '0x52956Fb3DC3361fd24713981917f2B6ef493DCcC',
});

SERIES_1.set(WETH_2212_SERIES_ID, {
  id: WETH_2212_SERIES_ID,
  fyTokenAddress: '0x386a0A72FfEeB773381267D69B61aCd1572e074D',
  poolAddress: '0x9D34dF69958675450ab8E53c8Df5531203398Dc9',
});

SERIES_1.set(FRAX_2212_SERIES_ID, {
  id: FRAX_2212_SERIES_ID,
  fyTokenAddress: '0xc20952b2c8bb6689e7ec2f70aeba392c378ec413',
  poolAddress: '0xFa38F3717daD95085FF725aA93608Af3fa1D9e58',
});

SERIES_1.set(USDC_2212_SERIES_ID, {
  id: USDC_2212_SERIES_ID,
  fyTokenAddress: '0x38b8BF13c94082001f784A642165517F8760988f',
  poolAddress: '0xB2fff7FEA1D455F0BCdd38DA7DeE98af0872a13a',
});

/* 2303 */
SERIES_1.set(USDC_2303_SERIES_ID, {
  id: USDC_2303_SERIES_ID,
  fyTokenAddress: '0x22E1e5337C5BA769e98d732518b2128dE14b553C',
  poolAddress: '0x48b95265749775310B77418Ff6f9675396ABE1e8',
});

SERIES_1.set(DAI_2303_SERIES_ID, {
  id: DAI_2303_SERIES_ID,
  fyTokenAddress: '0x79A6Be1Ae54153AA6Fc7e4795272c63F63B2a6DC',
  poolAddress: '0xBdc7Bdae87dfE602E91FDD019c4C0334C38f6A46',
});

SERIES_1.set(FRAX_2303_SERIES_ID, {
  id: FRAX_2303_SERIES_ID,
  fyTokenAddress: '0x2eb907fb4b71390dC5CD00e6b81B7dAAcE358193',
  poolAddress: '0x1D2eB98042006B1bAFd10f33743CcbB573429daa',
});

SERIES_1.set(WETH_2303_SERIES_ID, {
  id: WETH_2303_SERIES_ID,
  fyTokenAddress: '0x0FBd5ca8eE61ec921B3F61B707f1D7D64456d2d1',
  poolAddress: '0x1b2145139516cB97568B76a2FdbE37D2BCD61e63',
});

// /* 2306 */
// SERIES_1.set(WETH_2306_SERIES_ID, {
//   id:WETH_2306_SERIES_ID ,
//   fyTokenAddress: '0x4bcAd19a61682f5bF0e8B4AB6E45Fd441cdd0a69',
//   poolAddress: '0x59784B822Ee864a7F64F521094A4c9fbBdb4Cd72',
// });
// SERIES_1.set(DAI_2306_SERIES_ID, {
//   id: DAI_2306_SERIES_ID,
//   fyTokenAddress: '0x85976CAcFECe6c615FdA280EB35F9dEb65D08EA2',
//   poolAddress: '0xb8e1B61f689524A3585c365cF765b0504003c5f4',
// });
// SERIES_1.set(USDC_2306_SERIES_ID, {
//   id: USDC_2306_SERIES_ID,
//   fyTokenAddress: '0xc7D20961f8D8410F261e35Afbe5988046BEC0f96',
//   poolAddress: '0x924014515288e7acde50229c84512c61594bd0Fa',
// });
// SERIES_1.set(FRAX_2306_SERIES_ID, {
//   id:FRAX_2306_SERIES_ID ,
//   fyTokenAddress: '0x7BCBB18C0c4e2a53431AC5F9dA2C82bF58ebE0c5',
//   poolAddress: '0xdbEe5521334667331c1802a8a69E13E21269bceB',
// });

/**
 *
 *
 * 42161
 *
 *
 * */

/* 2203*/
SERIES_42161.set(USDC_2203_SERIES_ID, {
  id: USDC_2203_SERIES_ID,
  fyTokenAddress: '0xa9Bc738c017771A4cF01730F215E6E2b34DCa9B8',
  poolAddress: '0xf76906AA78ECD4FcFB8a7923fB40fA42c07F20D6',
});

SERIES_42161.set(DAI_2203_SERIES_ID, {
  id: DAI_2203_SERIES_ID,
  fyTokenAddress: '0x0e7727F4ee78D60f1D3aa30744B3ab6610F04170',
  poolAddress: '0x7Fc2c417021d46a4790463030Fb01A948D54Fc04',
});

/* 2206 */
SERIES_42161.set(USDC_2206_SERIES_ID, {
  id: USDC_2206_SERIES_ID,
  fyTokenAddress: '0xC4b24Ec9fB2DC32b3a545e0d873d2598031B80C5',
  poolAddress: '0x8C8A448FD8d3e44224d97146B25F4DeC425af309',
});

SERIES_42161.set(DAI_2206_SERIES_ID, {
  id: DAI_2206_SERIES_ID,
  fyTokenAddress: '0xa3eCAF5c5E98C1a500f4596576dAD3328A701C73',
  poolAddress: '0x6651f8E1ff6863Eb366a319F9A94191346D0e323',
});

/* 2209 */
SERIES_42161.set(USDC_2209_SERIES_ID, {
  id: USDC_2209_SERIES_ID,
  fyTokenAddress: '0xeC1b42EC9a1650238acE42fD57bc719cCC87851C',
  poolAddress: '0x13aB946C6A9645EDfF2A33880e0Fc37f67122170',
});

SERIES_42161.set(DAI_2209_SERIES_ID, {
  id: DAI_2209_SERIES_ID,
  fyTokenAddress: '0x4f9B5e639447456DDC784Bc441F5A6FD7CE80729',
  poolAddress: '0xFCb9B8C5160Cf2999f9879D8230dCed469E72eeb',
});

SERIES_42161.set(WETH_2209_SERIES_ID, {
  id: WETH_2209_SERIES_ID,
  fyTokenAddress: '0xe1e878364EfC19712a2833C5C60B68d215f9a4Ab',
  poolAddress: '0x0FA29EEb169CDE6c779326d7b16c54529ECA1DD5',
});

/* 2212 */
SERIES_42161.set(USDC_2212_SERIES_ID, {
  id: USDC_2212_SERIES_ID,
  fyTokenAddress: '0xD4aeA765BC2c56f09074254eb5a3f5FF9d709449',
  poolAddress: '0x81Ae3D05e4F0d0DD29d6840424a0b761A7fdB51c',
});

SERIES_42161.set(DAI_2212_SERIES_ID, {
  id: DAI_2212_SERIES_ID,
  fyTokenAddress: '0xe8Ec1A61f6C86e8d33C327FEdad559c20b9A66a2',
  poolAddress: '0x25e46aD1cC867c5253a179F45e1aB46144c8aBc0',
});

SERIES_42161.set(WETH_2212_SERIES_ID, {
  id: WETH_2212_SERIES_ID,
  fyTokenAddress: '0x5655A973A49e1F9c1408bb9A617Fd0DBD0352464',
  poolAddress: '0x7F0dD461D77F84cDd3ceD46F9D550e35F1969a24',
});

/* 2303 */
SERIES_42161.set(DAI_2303_SERIES_ID, {
  id: DAI_2303_SERIES_ID,
  fyTokenAddress: '0x0FBd5ca8eE61ec921B3F61B707f1D7D64456d2d1',
  poolAddress: '0x2eb907fb4b71390dC5CD00e6b81B7dAAcE358193',
});

SERIES_42161.set(DAI_2303_SERIES_ID, {
  id: DAI_2303_SERIES_ID,
  fyTokenAddress: '0x3295a74Bca0d6FdFeF648BA8549d305a8bA9cc13',
  poolAddress: '0x22E1e5337C5BA769e98d732518b2128dE14b553C',
});

SERIES_42161.set(WETH_2303_SERIES_ID, {
  id: WETH_2303_SERIES_ID,
  fyTokenAddress: '0x8a9262C7C6eC9bb143Eb68798AdB377c95F47138',
  poolAddress: '0x79A6Be1Ae54153AA6Fc7e4795272c63F63B2a6DC',
});





[
  {
    id: '0x303130360000',
    baseId: '0x303100000000',
    baseAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    maturity: 1656039600,
    name: 'FYDAI2206',
    symbol: 'FYDAI2206',
    version: '1',
    address: '0x2043452d7f1aaed1b5A266EFAa80e2D04872EB88',
    fyTokenAddress: '0x2043452d7f1aaed1b5A266EFAa80e2D04872EB88',
    decimals: 18,
    poolAddress: '0x5D14Ab14adB3a3D9769a67a1D09634634bdE4C9B',
    poolVersion: '1',
    poolName: 'Yield FYDAI2206 LP Token',
    poolSymbol: 'FYDAI2206LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0571a826b3',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xc000000000000000',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x015555555555555555',
    },
  },
  {
    id: '0x303030360000',
    baseId: '0x303000000000',
    baseAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    maturity: 1656039600,
    name: 'FYETH2206',
    symbol: 'FYETH2206',
    version: '1',
    address: '0x7Eaf9612Fbaa544FefbFB3C9A934c9441084816e',
    fyTokenAddress: '0x7Eaf9612Fbaa544FefbFB3C9A934c9441084816e',
    decimals: 18,
    poolAddress: '0x341B0976F962eC34eEaF31cdF2464Ab3B15B6301',
    poolVersion: '1',
    poolName: 'FYETH2206 LP',
    poolSymbol: 'FYETH2206LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0367091830',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xc000000000000000',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x015555555555555555',
    },
  },
  {
    id: '0x303130350000',
    baseId: '0x303100000000',
    baseAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    maturity: 1648177200,
    name: 'FYDAI Mar 22',
    symbol: 'FYDAI2203',
    version: '1',
    address: '0x30d94Da9ee56d3EF0c97EBa22223784F6bCf37B9',
    fyTokenAddress: '0x30d94Da9ee56d3EF0c97EBa22223784F6bCf37B9',
    decimals: 18,
    poolAddress: '0x2e4B70D0F020E62885E82bf75bc123e1Aa8c79cA',
    poolVersion: '1',
    poolName: 'Yield FYDAI Mar 22 LP Token',
    poolSymbol: 'FYDAI2203LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0d9c2460c1',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xf333333333333333',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x010d79435e50d79435',
    },
  },
  {
    id: '0x303330370000',
    baseId: '0x313800000000',
    baseAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    maturity: 1664550000,
    name: 'FYFRAX2209',
    symbol: 'FYFRAX2209',
    version: '1',
    address: '0x3353E1E2976DBbc191a739871faA8E6E9D2622c7',
    fyTokenAddress: '0x3353E1E2976DBbc191a739871faA8E6E9D2622c7',
    decimals: 18,
    poolAddress: '0x4b32C37Be5949e77ba3726E863a030BD77942A97',
    poolVersion: '1',
    poolName: 'FYFRAX2209 LP',
    poolSymbol: 'FYFRAX2209LP',
    ts: {
      type: 'BigNumber',
      hex: '0x03ada8f78e',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xcccccccccccccccc',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x014000000000000000',
    },
  },
  {
    id: '0x303230350000',
    baseId: '0x303200000000',
    baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    maturity: 1648177200,
    name: 'FYUSDC Mar 22',
    symbol: 'FYUSDC2203',
    version: '1',
    address: '0x33c4F1A98CF0F540D8a1F6119129337eC5973E29',
    fyTokenAddress: '0x33c4F1A98CF0F540D8a1F6119129337eC5973E29',
    decimals: 6,
    poolAddress: '0x80142add3A597b1eD1DE392A56B2cef3d8302797',
    poolVersion: '1',
    poolName: 'Yield FYUSDC Mar 22 LP Token',
    poolSymbol: 'FYUSDC2203LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0d9c2460c1',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xf333333333333333',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x010d79435e50d79435',
    },
  },
  {
    id: '0x303030370000',
    baseId: '0x303000000000',
    baseAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    maturity: 1664550000,
    name: 'FYETH2209',
    symbol: 'FYETH2209',
    version: '1',
    address: '0x53358d088d835399F1E97D2a01d79fC925c7D999',
    fyTokenAddress: '0x53358d088d835399F1E97D2a01d79fC925c7D999',
    decimals: 18,
    poolAddress: '0xc3348D8449d13C364479B1F114bcf5B73DFc0dc6',
    poolVersion: '1',
    poolName: 'FYETH2209 LP',
    poolSymbol: 'FYETH2209LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0367091830',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xc000000000000000',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x015555555555555555',
    },
  },
  {
    id: '0x303230370000',
    baseId: '0x303200000000',
    baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    maturity: 1664550000,
    name: 'FYUSDC2209',
    symbol: 'FYUSDC2209',
    version: '1',
    address: '0x53C2a1bA37FF3cDaCcb3EA030DB3De39358e5593',
    fyTokenAddress: '0x53C2a1bA37FF3cDaCcb3EA030DB3De39358e5593',
    decimals: 6,
    poolAddress: '0xf5Fd5A9Db9CcCc6dc9f5EF1be3A859C39983577C',
    poolVersion: '1',
    poolName: 'FYUSDC2209 LP',
    poolSymbol: 'FYUSDC2209LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0489617595',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xc000000000000000',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x015555555555555555',
    },
  },
  {
    id: '0x303130370000',
    baseId: '0x303100000000',
    baseAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    maturity: 1664550000,
    name: 'FYDAI2209',
    symbol: 'FYDAI2209',
    version: '1',
    address: '0xFCb9B8C5160Cf2999f9879D8230dCed469E72eeb',
    fyTokenAddress: '0xFCb9B8C5160Cf2999f9879D8230dCed469E72eeb',
    decimals: 18,
    poolAddress: '0x6BaC09a67Ed1e1f42c29563847F77c28ec3a04FC',
    poolVersion: '1',
    poolName: 'FYDAI2209 LP',
    poolSymbol: 'FYDAI2209LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0489617595',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xc000000000000000',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x015555555555555555',
    },
  },
  {
    id: '0x303130340000',
    baseId: '0x303100000000',
    baseAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    maturity: 1640919600,
    name: 'FYDAI Dec 21',
    symbol: 'FYDAI2112',
    version: '1',
    address: '0x0119451f94E98716c3fa17ff31d19C98d134DD6d',
    fyTokenAddress: '0x0119451f94E98716c3fa17ff31d19C98d134DD6d',
    decimals: 18,
    poolAddress: '0x3771C99c087a81dF4633b50D8B149aFaA83E3c9E',
    poolVersion: '1',
    poolName: 'Yield FYDAI Dec 21 LP Token',
    poolSymbol: 'FYDAI2112LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0d9c2460c1',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xf333333333333333',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x010d79435e50d79435',
    },
  },
  {
    id: '0x303230360000',
    baseId: '0x303200000000',
    baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    maturity: 1656039600,
    name: 'FYUSDC2206',
    symbol: 'FYUSDC2206',
    version: '1',
    address: '0x4568bBcf929AB6B4d716F2a3D5A967a1908B4F1C',
    fyTokenAddress: '0x4568bBcf929AB6B4d716F2a3D5A967a1908B4F1C',
    decimals: 6,
    poolAddress: '0xEf82611C6120185D3BF6e020D1993B49471E7da0',
    poolVersion: '1',
    poolName: 'Yield FYUSDC2206 LP Token',
    poolSymbol: 'FYUSDC2206LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0571a826b3',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xc000000000000000',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x015555555555555555',
    },
  },
  {
    id: '0x303230340000',
    baseId: '0x303200000000',
    baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    maturity: 1640919600,
    name: 'FYUSDC Dec 21',
    symbol: 'FYUSDC2112',
    version: '1',
    address: '0x30FaDeEaAB2d7a23Cb1C35c05e2f8145001fA533',
    fyTokenAddress: '0x30FaDeEaAB2d7a23Cb1C35c05e2f8145001fA533',
    decimals: 6,
    poolAddress: '0x407353d527053F3a6140AAA7819B93Af03114227',
    poolVersion: '1',
    poolName: 'Yield FYUSDC Dec 21 LP Token',
    poolSymbol: 'FYUSDC2112LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0d9c2460c1',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xf333333333333333',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x010d79435e50d79435',
    },
  },
  {
    id: '0x303230390000',
    baseId: '0x303200000000',
    baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    maturity: 1680274800,
    name: 'FYUSDC2303',
    symbol: 'FYUSDC2303',
    version: '1',
    address: '0x22E1e5337C5BA769e98d732518b2128dE14b553C',
    fyTokenAddress: '0x22E1e5337C5BA769e98d732518b2128dE14b553C',
    decimals: 6,
    poolAddress: '0x48b95265749775310B77418Ff6f9675396ABE1e8',
    poolVersion: '1',
    poolName: 'FYUSDC2303 LP',
    poolSymbol: 'FYUSDC2303LP',
    ts: {
      type: 'BigNumber',
      hex: '0x02797afa51',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xe666666666666666',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x011c71c71c71c71c71',
    },
  },
  {
    id: '0x313830390000',
    baseId: '0x313800000000',
    baseAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    maturity: 1680274800,
    name: 'FYFRAX2303',
    symbol: 'FYFRAX2303',
    version: '1',
    address: '0x2eb907fb4b71390dC5CD00e6b81B7dAAcE358193',
    fyTokenAddress: '0x2eb907fb4b71390dC5CD00e6b81B7dAAcE358193',
    decimals: 18,
    poolAddress: '0x1D2eB98042006B1bAFd10f33743CcbB573429daa',
    poolVersion: '1',
    poolName: 'FYFRAX2303 LP',
    poolSymbol: 'FYFRAX2303LP',
    ts: {
      type: 'BigNumber',
      hex: '0x06ce123060',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xe666666666666666',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x011c71c71c71c71c71',
    },
  },
  {
    id: '0x303130380000',
    baseId: '0x303100000000',
    baseAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    maturity: 1672412400,
    name: 'FYDAI2212',
    symbol: 'FYDAI2212',
    version: '1',
    address: '0xcDfBf28Db3B1B7fC8efE08f988D955270A5c4752',
    fyTokenAddress: '0xcDfBf28Db3B1B7fC8efE08f988D955270A5c4752',
    decimals: 18,
    poolAddress: '0x52956Fb3DC3361fd24713981917f2B6ef493DCcC',
    poolVersion: '1',
    poolName: 'FYDAI2212 LP',
    poolSymbol: 'FYDAI2212LP',
    ts: {
      type: 'BigNumber',
      hex: '0x030640f90e',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xe666666666666666',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x011c71c71c71c71c71',
    },
  },
  {
    id: '0x303230380000',
    baseId: '0x303200000000',
    baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    maturity: 1672412400,
    name: 'FYUSDC2212',
    symbol: 'FYUSDC2212',
    version: '1',
    address: '0x38b8BF13c94082001f784A642165517F8760988f',
    fyTokenAddress: '0x38b8BF13c94082001f784A642165517F8760988f',
    decimals: 6,
    poolAddress: '0xB2fff7FEA1D455F0BCdd38DA7DeE98af0872a13a',
    poolVersion: '1',
    poolName: 'FYUSDC2212 LP',
    poolSymbol: 'FYUSDC2212LP',
    ts: {
      type: 'BigNumber',
      hex: '0x02797afa51',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xe666666666666666',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x011c71c71c71c71c71',
    },
  },
  {
    id: '0x303030390000',
    baseId: '0x303000000000',
    baseAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    maturity: 1680274800,
    name: 'FYETH2303',
    symbol: 'FYETH2303',
    version: '1',
    address: '0x0FBd5ca8eE61ec921B3F61B707f1D7D64456d2d1',
    fyTokenAddress: '0x0FBd5ca8eE61ec921B3F61B707f1D7D64456d2d1',
    decimals: 18,
    poolAddress: '0x1b2145139516cB97568B76a2FdbE37D2BCD61e63',
    poolVersion: '1',
    poolName: 'FYETH2303 LP',
    poolSymbol: 'FYETH2303LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0571a826b3',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xe666666666666666',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x011c71c71c71c71c71',
    },
  },
  {
    id: '0x303330360000',
    baseId: '0x313800000000',
    baseAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    maturity: 1656039600,
    name: 'FYFRAX2206',
    symbol: 'FYFRAX2206',
    version: '1',
    address: '0x7F0dD461D77F84cDd3ceD46F9D550e35F1969a24',
    fyTokenAddress: '0x7F0dD461D77F84cDd3ceD46F9D550e35F1969a24',
    decimals: 18,
    poolAddress: '0xA4d45197E3261721B8A8d901489Df5d4D2E79eD7',
    poolVersion: '1',
    poolName: 'FYFRAX2206 LP',
    poolSymbol: 'FYFRAX2206LP',
    ts: {
      type: 'BigNumber',
      hex: '0x03ada8f78e',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xcccccccccccccccc',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x014000000000000000',
    },
  },
  {
    id: '0x313830380000',
    baseId: '0x313800000000',
    baseAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    maturity: 1672412400,
    name: 'FYFRAX2212',
    symbol: 'FYFRAX2212',
    version: '1',
    address: '0xc20952b2c8bb6689e7ec2f70aeba392c378ec413',
    fyTokenAddress: '0xc20952b2c8bb6689e7ec2f70aeba392c378ec413',
    decimals: 18,
    poolAddress: '0xFa38F3717daD95085FF725aA93608Af3fa1D9e58',
    poolVersion: '1',
    poolName: 'FYFRAX2212 LP',
    poolSymbol: 'FYFRAX2212LP',
    ts: {
      type: 'BigNumber',
      hex: '0x06ce123060',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xe666666666666666',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x011c71c71c71c71c71',
    },
  },
  {
    id: '0x303130390000',
    baseId: '0x303100000000',
    baseAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    maturity: 1680274800,
    name: 'FYDAI2303',
    symbol: 'FYDAI2303',
    version: '1',
    address: '0x79A6Be1Ae54153AA6Fc7e4795272c63F63B2a6DC',
    fyTokenAddress: '0x79A6Be1Ae54153AA6Fc7e4795272c63F63B2a6DC',
    decimals: 18,
    poolAddress: '0xBdc7Bdae87dfE602E91FDD019c4C0334C38f6A46',
    poolVersion: '1',
    poolName: 'FYDAI2303 LP',
    poolSymbol: 'FYDAI2303LP',
    ts: {
      type: 'BigNumber',
      hex: '0x030640f90e',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xe666666666666666',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x011c71c71c71c71c71',
    },
  },
  {
    id: '0x303030380000',
    baseId: '0x303000000000',
    baseAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    maturity: 1672412400,
    name: 'FYETH2212',
    symbol: 'FYETH2212',
    version: '1',
    address: '0x386a0A72FfEeB773381267D69B61aCd1572e074D',
    fyTokenAddress: '0x386a0A72FfEeB773381267D69B61aCd1572e074D',
    decimals: 18,
    poolAddress: '0x9D34dF69958675450ab8E53c8Df5531203398Dc9',
    poolVersion: '1',
    poolName: 'FYETH2212 LP',
    poolSymbol: 'FYETH2212LP',
    ts: {
      type: 'BigNumber',
      hex: '0x0571a826b3',
    },
    g1: {
      type: 'BigNumber',
      hex: '0xe666666666666666',
    },
    g2: {
      type: 'BigNumber',
      hex: '0x011c71c71c71c71c71',
    },
  },
];
