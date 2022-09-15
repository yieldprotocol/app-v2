export enum PoolType {
  TV,
  NONTV,
}
export interface SeriesInfo {
  fyTokenAddress: string;
  poolAddress: string;
  poolType: PoolType;
}

export const SERIES_1 = new Map<string, SeriesInfo>();
export const SERIES_42161 = new Map<string, SeriesInfo>();

SERIES_1.set('0x303230350000', {
  fyTokenAddress: '0x33c4F1A98CF0F540D8a1F6119129337eC5973E29',
  poolAddress: '0x80142add3A597b1eD1DE392A56B2cef3d8302797',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303030380000', {
  fyTokenAddress: '0x386a0A72FfEeB773381267D69B61aCd1572e074D',
  poolAddress: '0x9D34dF69958675450ab8E53c8Df5531203398Dc9',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303230360000', {
  fyTokenAddress: '0x4568bBcf929AB6B4d716F2a3D5A967a1908B4F1C',
  poolAddress: '0xEf82611C6120185D3BF6e020D1993B49471E7da0',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x313830380000', {
  fyTokenAddress: '0xC20952b2C8bB6689e7EC2F70Aeba392C378EC413',
  poolAddress: '0x57002Dd4609fd79f65e2e2a4bE9aa6e901Af9D9C',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303130340000', {
  fyTokenAddress: '0x0119451f94E98716c3fa17ff31d19C98d134DD6d',
  poolAddress: '0x3771C99c087a81dF4633b50D8B149aFaA83E3c9E',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303230340000', {
  fyTokenAddress: '0x30FaDeEaAB2d7a23Cb1C35c05e2f8145001fA533',
  poolAddress: '0x407353d527053F3a6140AAA7819B93Af03114227',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303130360000', {
  fyTokenAddress: '0x2043452d7f1aaed1b5A266EFAa80e2D04872EB88',
  poolAddress: '0x5D14Ab14adB3a3D9769a67a1D09634634bdE4C9B',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303030360000', {
  fyTokenAddress: '0x7Eaf9612Fbaa544FefbFB3C9A934c9441084816e',
  poolAddress: '0x341B0976F962eC34eEaF31cdF2464Ab3B15B6301',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303030370000', {
  fyTokenAddress: '0x53358d088d835399F1E97D2a01d79fC925c7D999',
  poolAddress: '0xc3348D8449d13C364479B1F114bcf5B73DFc0dc6',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303330360000', {
  fyTokenAddress: '0x7F0dD461D77F84cDd3ceD46F9D550e35F1969a24',
  poolAddress: '0xA4d45197E3261721B8A8d901489Df5d4D2E79eD7',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303130380000', {
  fyTokenAddress: '0xcDfBf28Db3B1B7fC8efE08f988D955270A5c4752',
  poolAddress: '0x52956Fb3DC3361fd24713981917f2B6ef493DCcC',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303130370000', {
  fyTokenAddress: '0xFCb9B8C5160Cf2999f9879D8230dCed469E72eeb',
  poolAddress: '0x6BaC09a67Ed1e1f42c29563847F77c28ec3a04FC',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303130350000', {
  fyTokenAddress: '0x30d94Da9ee56d3EF0c97EBa22223784F6bCf37B9',
  poolAddress: '0x2e4B70D0F020E62885E82bf75bc123e1Aa8c79cA',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303230380000', {
  fyTokenAddress: '0x38b8BF13c94082001f784A642165517F8760988f',
  poolAddress: '0xB2fff7FEA1D455F0BCdd38DA7DeE98af0872a13a',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303230370000', {
  fyTokenAddress: '0x53C2a1bA37FF3cDaCcb3EA030DB3De39358e5593',
  poolAddress: '0xf5Fd5A9Db9CcCc6dc9f5EF1be3A859C39983577C',
  poolType: PoolType.NONTV,
});

SERIES_1.set('0x303330370000', {
  fyTokenAddress: '0x3353E1E2976DBbc191a739871faA8E6E9D2622c7',
  poolAddress: '0x4b32C37Be5949e77ba3726E863a030BD77942A97',
  poolType: PoolType.NONTV,
});

SERIES_42161.set('0x303130360000', {
  fyTokenAddress: '0xa3eCAF5c5E98C1a500f4596576dAD3328A701C73',
  poolAddress: '0x6651f8E1ff6863Eb366a319F9A94191346D0e323',
  poolType: PoolType.NONTV,
});

/**
 *
 *
 * 426161
 *
 *
 * */

SERIES_42161.set('0x303130350000', {
  fyTokenAddress: '0x0e7727F4ee78D60f1D3aa30744B3ab6610F04170',
  poolAddress: '0x7Fc2c417021d46a4790463030Fb01A948D54Fc04',
  poolType: PoolType.NONTV,
});

SERIES_42161.set('0x303230370000', {
  fyTokenAddress: '0xeC1b42EC9a1650238acE42fD57bc719cCC87851C',
  poolAddress: '0x13aB946C6A9645EDfF2A33880e0Fc37f67122170',
  poolType: PoolType.NONTV,
});

SERIES_42161.set('0x303230350000', {
  fyTokenAddress: '0xa9Bc738c017771A4cF01730F215E6E2b34DCa9B8',
  poolAddress: '0xf76906AA78ECD4FcFB8a7923fB40fA42c07F20D6',
  poolType: PoolType.NONTV,
});

SERIES_42161.set('0x303030370000', {
  fyTokenAddress: '0xe1e878364EfC19712a2833C5C60B68d215f9a4Ab',
  poolAddress: '0x0FA29EEb169CDE6c779326d7b16c54529ECA1DD5',
  poolType: PoolType.NONTV,
});

SERIES_42161.set('0x303130370000', {
  fyTokenAddress: '0x4f9B5e639447456DDC784Bc441F5A6FD7CE80729',
  poolAddress: '0xFCb9B8C5160Cf2999f9879D8230dCed469E72eeb',
  poolType: PoolType.NONTV,
});

SERIES_42161.set('0x303230360000', {
  fyTokenAddress: '0xC4b24Ec9fB2DC32b3a545e0d873d2598031B80C5',
  poolAddress: '0x8C8A448FD8d3e44224d97146B25F4DeC425af309',
  poolType: PoolType.NONTV,
});

// SERIES_42161.set('0x303130380000', {
//   fyTokenAddress: '0xe8Ec1A61f6C86e8d33C327FEdad559c20b9A66a2',
//   poolAddress: '0xcf9067aa60bc6ec5acf4f9be70203efa4f6f71e3',
//   poolType: PoolType.NONTV,
// });

// SERIES_42161.set('0x303230380000', {
//   fyTokenAddress: '0xD4aeA765BC2c56f09074254eb5a3f5FF9d709449',
//   poolAddress: '0x323db6599b9e2487c0ec9728a9593a76aaf720eb',
//   poolType: PoolType.NONTV,
// });
