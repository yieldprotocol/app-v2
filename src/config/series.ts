import { BaseProvider } from '@ethersproject/providers';
import { Cauldron__factory, FYToken__factory, Pool__factory } from '../contracts';

const commonProperties = { version: '1', poolVersion: '1', decimals: 18 };

export interface ISeriesStatic {
  id: string;
  address: string;
  poolAddress: string;
  baseId: string;

  maturity: number;
  name: string;
  symbol: string;
  decimals: number;
  version: string;

  poolName: string;
  poolSymbol: string;
  poolVersion: string;

  ts: string;
  g1: string;
  g2: string;
}

const USDC_2112 = '0x303230340000';
const USDC_2203 = '0x303230350000';
const USDC_2206 = '0x303230360000';
const USDC_2209 = '0x303230370000';
const USDC_2212 = '0x303230380000';
const USDC_2303 = '0x303230390000';

const DAI_2112 = '0x303130340000';
const DAI_2203 = '0x303130350000';
const DAI_2206 = '0x303130360000';
const DAI_2209 = '0x303130370000';
const DAI_2212 = '0x303130380000';
const DAI_2303 = '0x303130390000';

const WETH_2206 = '0x303030360000';
const WETH_2209 = '0x303030370000';
const WETH_2212 = '0x303030380000';
const WETH_2303 = '0x303030390000';

const FRAX_2206 = '0x303330360000';
const FRAX_2209 = '0x303330370000';
const FRAX_2212 = '0x313830380000';
const FRAX_2303 = '0x313830390000';

// 2306 - New Naming Structure
const USDC_2306 = '0x0032ff00028b';
const DAI_2306 = '0x0031ff00028b';
const WETH_2306 = '0x0030ff00028b';
const FRAX_2306 = '0x0138ff00028b';
const USDT_2306 = '0x00A0FF00028B';
const USDT_2303 = '0x00A0FF000288';

export const validateSeries = async (provider: BaseProvider, cauldronAddress: string) => {
  const preText = '### SERIES SET VALIDATION ERROR ### ';
  const chainId = (await provider.getNetwork()).chainId;

  const seriesList = SERIES.get(chainId)!; // TODO throw if not available

  seriesList.forEach(async (s: ISeriesStatic) => {
    const poolContract = Pool__factory.connect(s.poolAddress, provider);
    const fyTokenContract = FYToken__factory.connect(s.address, provider);
    const cauldron = Cauldron__factory.connect(cauldronAddress, provider);

    try {
      const { maturity, baseId } = await cauldron.series(s.id);
      s.maturity !== maturity && console.log(preText, s.address, ': series maturity mismatch');
      s.baseId !== baseId && console.log(preText, s.address, ': baseId mismatch');

      const [name, symbol, version, decimals, poolName, poolVersion, poolSymbol, ts, g1, g2, baseAddress] =
        await Promise.all([
          fyTokenContract.name(),
          fyTokenContract.symbol(),
          fyTokenContract.version(),
          fyTokenContract.decimals(),
          poolContract.name(),
          poolContract.version(),
          poolContract.symbol(),
          poolContract.ts(),
          poolContract.g1(),
          poolContract.g2(),
          poolContract.base(),
        ]);

      console.table([
        name,
        maturity,
        baseId,
        symbol,
        version,
        decimals,
        poolName,
        poolVersion,
        poolSymbol,
        ts,
        g1,
        g2,
        baseAddress,
      ]);

      s.symbol !== symbol && console.log(preText, s.address, ': symbol mismatch');
      s.name !== name && console.log(preText, s.address, ': name mismatch');
      s.decimals !== decimals && console.log(preText, s.address, ': decimals mismatch');
      s.version !== version && console.log(preText, s.address, ': version mismatch', version, s.version);
      s.poolSymbol !== poolSymbol && console.log(preText, s.address, ': pool symbol mismatch');
      // s.baseAddress !== baseAddress && console.log(preText, s.address, ': base Address mismatch');
      s.poolName !== poolName && console.log(preText, s.address, ': pool name mismatch');
      s.poolVersion !== poolVersion && console.log(preText, s.address, ': pool version mismatch');
      s.ts !== ts.toString() && console.log(preText, s.address, ': pool ts mismatch');
      s.g1 !== g1.toString() && console.log(preText, s.address, ': pool g1 mismatch');
      s.g2 !== g2.toString() && console.log(preText, s.address, ': pool g2 mismatch');
    } catch (e) {
      console.log(preText, s.address, ': Contract not reachable');
    }
  });
};

export const SERIES = new Map<number, Map<string, ISeriesStatic>>();

SERIES.set(
  1,
  new Map([
    [
      USDC_2209,
      {
        id: USDC_2209,
        baseId: '0x303200000000',
        // baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        maturity: 1664550000,
        name: 'FYUSDC2209',
        symbol: 'FYUSDC2209',
        address: '0x53C2a1bA37FF3cDaCcb3EA030DB3De39358e5593',
        decimals: 6,
        version: '1',
        poolAddress: '0xf5Fd5A9Db9CcCc6dc9f5EF1be3A859C39983577C',
        poolName: 'FYUSDC2209 LP',
        poolSymbol: 'FYUSDC2209LP',
        poolVersion: '1',
        ts: '19484734869',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],
    [
      WETH_2209,
      {
        id: WETH_2209,
        baseId: '0x303000000000',
        // baseAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        maturity: 1664550000,
        name: 'FYETH2209',
        symbol: 'FYETH2209',
        address: '0x53358d088d835399F1E97D2a01d79fC925c7D999',
        decimals: 18,
        version: '1',
        poolAddress: '0xc3348D8449d13C364479B1F114bcf5B73DFc0dc6',
        poolName: 'FYETH2209 LP',
        poolSymbol: 'FYETH2209LP',
        poolVersion: '1',
        ts: '14613551152',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],
    [
      FRAX_2209,
      {
        id: FRAX_2209,
        baseId: '0x313800000000',
        // baseAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
        maturity: 1664550000,
        name: 'FYFRAX2209',
        symbol: 'FYFRAX2209',
        address: '0x3353E1E2976DBbc191a739871faA8E6E9D2622c7',
        decimals: 18,
        version: '1',
        poolAddress: '0x4b32C37Be5949e77ba3726E863a030BD77942A97',
        poolName: 'FYFRAX2209 LP',
        poolSymbol: 'FYFRAX2209LP',
        poolVersion: '1',
        ts: '15798433678',
        g1: '14757395258967641292',
        g2: '23058430092136939520',
      },
    ],
    [
      DAI_2212,
      {
        id: DAI_2212,
        baseId: '0x303100000000',
        // baseAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        maturity: 1672412400,
        name: 'FYDAI2212',
        symbol: 'FYDAI2212',
        address: '0xcDfBf28Db3B1B7fC8efE08f988D955270A5c4752',
        decimals: 18,
        version: '1',
        poolAddress: '0x52956Fb3DC3361fd24713981917f2B6ef493DCcC',
        poolName: 'FYDAI2212 LP',
        poolSymbol: 'FYDAI2212LP',
        poolVersion: '1',
        ts: '12989823246',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
    [
      DAI_2303,
      {
        id: DAI_2303,
        baseId: '0x303100000000',
        // baseAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        maturity: 1680274800,
        name: 'FYDAI2303',
        symbol: 'FYDAI2303',
        address: '0x79A6Be1Ae54153AA6Fc7e4795272c63F63B2a6DC',
        decimals: 18,
        version: '1',
        poolAddress: '0xBdc7Bdae87dfE602E91FDD019c4C0334C38f6A46',
        poolName: 'FYDAI2303 LP',
        poolSymbol: 'FYDAI2303LP',
        poolVersion: '1',
        ts: '12989823246',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
    [
      DAI_2112,
      {
        id: DAI_2112,
        baseId: '0x303100000000',
        // baseAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        maturity: 1640919600,
        name: 'FYDAI Dec 21',
        symbol: 'FYDAI2112',
        address: '0x0119451f94E98716c3fa17ff31d19C98d134DD6d',
        decimals: 18,
        version: '1',
        poolAddress: '0x3771C99c087a81dF4633b50D8B149aFaA83E3c9E',
        poolName: 'Yield FYDAI Dec 21 LP Token',
        poolSymbol: 'FYDAI2112LP',
        poolVersion: '1',
        ts: '58454204609',
        g1: '17524406870024074035',
        g2: '19417625340746896437',
      },
    ],
    [
      USDC_2206,
      {
        id: USDC_2206,
        baseId: '0x303200000000',
        // baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        maturity: 1656039600,
        name: 'FYUSDC2206',
        symbol: 'FYUSDC2206',
        address: '0x4568bBcf929AB6B4d716F2a3D5A967a1908B4F1C',
        decimals: 6,
        version: '1',
        poolAddress: '0xEf82611C6120185D3BF6e020D1993B49471E7da0',
        poolName: 'Yield FYUSDC2206 LP Token',
        poolSymbol: 'FYUSDC2206LP',
        poolVersion: '1',
        ts: '23381681843',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],
    [
      WETH_2212,
      {
        id: WETH_2212,
        baseId: '0x303000000000',
        // baseAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        maturity: 1672412400,
        name: 'FYETH2212',
        symbol: 'FYETH2212',
        address: '0x386a0A72FfEeB773381267D69B61aCd1572e074D',
        decimals: 18,
        version: '1',
        poolAddress: '0x9D34dF69958675450ab8E53c8Df5531203398Dc9',
        poolName: 'FYETH2212 LP',
        poolSymbol: 'FYETH2212LP',
        poolVersion: '1',
        ts: '23381681843',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
    [
      DAI_2209,
      {
        id: DAI_2209,
        baseId: '0x303100000000',
        // baseAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        maturity: 1664550000,
        name: 'FYDAI2209',
        symbol: 'FYDAI2209',
        address: '0xFCb9B8C5160Cf2999f9879D8230dCed469E72eeb',
        decimals: 18,
        version: '1',
        poolAddress: '0x6BaC09a67Ed1e1f42c29563847F77c28ec3a04FC',
        poolName: 'FYDAI2209 LP',
        poolSymbol: 'FYDAI2209LP',
        poolVersion: '1',
        ts: '19484734869',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],
    [
      WETH_2206,
      {
        id: WETH_2206,
        baseId: '0x303000000000',
        // baseAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        maturity: 1656039600,
        name: 'FYETH2206',
        symbol: 'FYETH2206',
        address: '0x7Eaf9612Fbaa544FefbFB3C9A934c9441084816e',
        decimals: 18,
        version: '1',
        poolAddress: '0x341B0976F962eC34eEaF31cdF2464Ab3B15B6301',
        poolName: 'FYETH2206 LP',
        poolSymbol: 'FYETH2206LP',
        poolVersion: '1',
        ts: '14613551152',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],
    [
      USDC_2212,
      {
        id: USDC_2212,
        baseId: '0x303200000000',
        // baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        maturity: 1672412400,
        name: 'FYUSDC2212',
        symbol: 'FYUSDC2212',
        address: '0x38b8BF13c94082001f784A642165517F8760988f',
        decimals: 6,
        version: '1',
        poolAddress: '0xB2fff7FEA1D455F0BCdd38DA7DeE98af0872a13a',
        poolName: 'FYUSDC2212 LP',
        poolSymbol: 'FYUSDC2212LP',
        poolVersion: '1',
        ts: '10628037201',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
    [
      DAI_2203,
      {
        id: DAI_2203,
        baseId: '0x303100000000',
        // baseAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        maturity: 1648177200,
        name: 'FYDAI Mar 22',
        symbol: 'FYDAI2203',
        address: '0x30d94Da9ee56d3EF0c97EBa22223784F6bCf37B9',
        decimals: 18,
        version: '1',
        poolAddress: '0x2e4B70D0F020E62885E82bf75bc123e1Aa8c79cA',
        poolName: 'Yield FYDAI Mar 22 LP Token',
        poolSymbol: 'FYDAI2203LP',
        poolVersion: '1',
        ts: '58454204609',
        g1: '17524406870024074035',
        g2: '19417625340746896437',
      },
    ],
    [
      WETH_2303,
      {
        id: WETH_2303,
        baseId: '0x303000000000',
        // baseAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        maturity: 1680274800,
        name: 'FYETH2303',
        symbol: 'FYETH2303',
        address: '0x0FBd5ca8eE61ec921B3F61B707f1D7D64456d2d1',
        decimals: 18,
        version: '1',
        poolAddress: '0x1b2145139516cB97568B76a2FdbE37D2BCD61e63',
        poolName: 'FYETH2303 LP',
        poolSymbol: 'FYETH2303LP',
        poolVersion: '1',
        ts: '23381681843',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
    [
      USDC_2203,
      {
        id: USDC_2203,
        baseId: '0x303200000000',
        // baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        maturity: 1648177200,
        name: 'FYUSDC Mar 22',
        symbol: 'FYUSDC2203',
        address: '0x33c4F1A98CF0F540D8a1F6119129337eC5973E29',
        decimals: 6,
        version: '1',
        poolAddress: '0x80142add3A597b1eD1DE392A56B2cef3d8302797',
        poolName: 'Yield FYUSDC Mar 22 LP Token',
        poolSymbol: 'FYUSDC2203LP',
        poolVersion: '1',
        ts: '58454204609',
        g1: '17524406870024074035',
        g2: '19417625340746896437',
      },
    ],
    [
      FRAX_2206,
      {
        id: FRAX_2206,
        baseId: '0x313800000000',
        // baseAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
        maturity: 1656039600,
        name: 'FYFRAX2206',
        symbol: 'FYFRAX2206',
        address: '0x7F0dD461D77F84cDd3ceD46F9D550e35F1969a24',
        decimals: 18,
        version: '1',
        poolAddress: '0xA4d45197E3261721B8A8d901489Df5d4D2E79eD7',
        poolName: 'FYFRAX2206 LP',
        poolSymbol: 'FYFRAX2206LP',
        poolVersion: '1',
        ts: '15798433678',
        g1: '14757395258967641292',
        g2: '23058430092136939520',
      },
    ],
    [
      FRAX_2303,
      {
        id: FRAX_2303,
        baseId: '0x313800000000',
        // baseAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
        maturity: 1680274800,
        name: 'FYFRAX2303',
        symbol: 'FYFRAX2303',
        address: '0x2eb907fb4b71390dC5CD00e6b81B7dAAcE358193',
        decimals: 18,
        version: '1',
        poolAddress: '0x1D2eB98042006B1bAFd10f33743CcbB573429daa',
        poolName: 'FYFRAX2303 LP',
        poolSymbol: 'FYFRAX2303LP',
        poolVersion: '1',
        ts: '29227102304',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
    [
      USDC_2303,
      {
        id: USDC_2303,
        baseId: '0x303200000000',
        // baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        maturity: 1680274800,
        name: 'FYUSDC2303',
        symbol: 'FYUSDC2303',
        address: '0x22E1e5337C5BA769e98d732518b2128dE14b553C',
        decimals: 6,
        version: '1',
        poolAddress: '0x48b95265749775310B77418Ff6f9675396ABE1e8',
        poolName: 'FYUSDC2303 LP',
        poolSymbol: 'FYUSDC2303LP',
        poolVersion: '1',
        ts: '10628037201',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
    [
      USDC_2112,
      {
        id: USDC_2112,
        baseId: '0x303200000000',
        // baseAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        maturity: 1640919600,
        name: 'FYUSDC Dec 21',
        symbol: 'FYUSDC2112',
        address: '0x30FaDeEaAB2d7a23Cb1C35c05e2f8145001fA533',
        decimals: 6,
        version: '1',
        poolAddress: '0x407353d527053F3a6140AAA7819B93Af03114227',
        poolName: 'Yield FYUSDC Dec 21 LP Token',
        poolSymbol: 'FYUSDC2112LP',
        poolVersion: '1',
        ts: '58454204609',
        g1: '17524406870024074035',
        g2: '19417625340746896437',
      },
    ],
    [
      FRAX_2212,
      {
        id: FRAX_2212,
        baseId: '0x313800000000',
        // baseAddress: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
        maturity: 1672412400,
        name: 'FYFRAX2212',
        symbol: 'FYFRAX2212',
        address: '0xc20952b2c8bb6689e7ec2f70aeba392c378ec413',
        decimals: 18,
        version: '1',
        poolAddress: '0xFa38F3717daD95085FF725aA93608Af3fa1D9e58',
        poolName: 'FYFRAX2212 LP',
        poolSymbol: 'FYFRAX2212LP',
        poolVersion: '1',
        ts: '29227102304',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
    [
      DAI_2206,
      {
        id: DAI_2206,
        baseId: '0x303100000000',
        maturity: 1656039600,
        name: 'FYDAI2206',
        symbol: 'FYDAI2206',
        address: '0x2043452d7f1aaed1b5A266EFAa80e2D04872EB88',
        decimals: 18,
        version: '1',
        poolAddress: '0x5D14Ab14adB3a3D9769a67a1D09634634bdE4C9B',
        poolName: 'Yield FYDAI2206 LP Token',
        poolSymbol: 'FYDAI2206LP',
        poolVersion: '1',
        ts: '23381681843',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],

    [
      WETH_2306,
      {
        id: WETH_2306,
        baseId: '0x303000000000',
        maturity: 1688137200,
        name: 'FYETH2306',
        symbol: 'FYETH2306',
        address: '0x124c9F7E97235Fe3E35820f95D10aFfCe4bE9168',
        decimals: 18,
        version: '1',
        poolAddress: '0xD129B0351416C75C9f0623fB43Bb93BB4107b2A4',
        poolName: 'FYETH2306 LP',
        poolSymbol: 'FYETH2306LP',
        poolVersion: '1',
        ts: '23381681843',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    [
      DAI_2306,
      {
        id: DAI_2306,
        baseId: '0x303100000000',
        maturity: 1688137200,
        name: 'FYDAI2306',
        symbol: 'FYDAI2306',
        address: '0x9ca4D6fbE0Ba91d553e74805d2E2545b04AbEfEA',
        decimals: 18,
        version: '1',
        poolAddress: '0xC2a463278387e649eEaA5aE5076e283260B0B1bE',
        poolName: 'FYDAI2306 LP',
        poolSymbol: 'FYDAI2306LP',
        poolVersion: '1',
        ts: '12989823246',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    [
      USDC_2306,
      {
        id: USDC_2306,
        baseId: '0x303200000000',
        maturity: 1688137200,
        name: 'FYUSDC2306',
        symbol: 'FYUSDC2306',
        address: '0x667f185407C4CAb52aeb681f0006e4642d8091DF',
        decimals: 6,
        version: '1',
        poolAddress: '0x06aaF385809c7BC00698f1E266eD4C78d6b8ba75',
        poolName: 'FYUSDC2306 LP',
        poolSymbol: 'FYUSDC2306LP',
        poolVersion: '1',
        ts: '10628037201',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    [
      FRAX_2306,
      {
        id: FRAX_2306,
        baseId: '0x313800000000',
        maturity: 1688137200,
        name: 'FYFRAX2306',
        symbol: 'FYFRAX2306',
        address: '0xFA71e5f0072401dA161b1FC25a9636927AF690D0',
        decimals: 18,
        version: '1',
        poolAddress: '0x2E8F62e3620497DbA8A2D7A18EA8212215805F22',
        poolName: 'FYFRAX2306 LP',
        poolSymbol: 'FYFRAX2306LP',
        poolVersion: '1',
        ts: '29227102304',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
    [
      USDT_2306,
      {
        id: USDT_2306,
        baseId: '0x30a000000000',
        maturity: 1688137200,
        name: 'FYUSDT2306',
        symbol: 'FYUSDT2306',
        address: '0xa0e4b17042f20d9badbda9961c2d0987c90f6439',
        decimals: 6,
        version: '1',
        poolAddress: '0xb4dbec738ffe47981d337c02cb5746e456ecd505',
        poolName: 'FYUSDT2306 LP',
        poolSymbol: 'FYUSDT2306LP',
        poolVersion: '1',
        ts: '12989823246',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
    [
      USDT_2303,
      {
        id: USDT_2303,
        baseId: '0x30a000000000',
        maturity: 1680274800,
        name: 'FYUSDT2303',
        symbol: 'FYUSDT2303',
        address: '0x8a6ff4c631816888444807541578ab8465edddc2',
        decimals: 6,
        version: '1',
        poolAddress: '0x7472df92ae587f97939de92bdfc23dbacd8a3816',
        poolName: 'FYUSDT2303 LP',
        poolSymbol: 'FYUSDT2303LP',
        poolVersion: '1',
        ts: '12989823246',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
  ])
);

/**
 *
 *
 * 42161
 *
 *
 * */
SERIES.set(
  42161,
  new Map([
    [
      DAI_2203,
      {
        id: DAI_2203,
        baseId: '0x303100000000',
        // baseAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        maturity: 1648177200,
        name: 'FYDAI2203',
        symbol: 'FYDAI2203',
        address: '0x0e7727F4ee78D60f1D3aa30744B3ab6610F04170',
        decimals: 18,
        version: '1',
        poolAddress: '0x7Fc2c417021d46a4790463030Fb01A948D54Fc04',
        poolName: 'FYDAI2203 LP',
        poolSymbol: 'FYDAI2203LP',
        poolVersion: '1',
        ts: '23381681843',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],

    [
      USDC_2203,
      {
        id: USDC_2203,
        baseId: '0x303200000000',
        // baseAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        maturity: 1648177200,
        name: 'FYUSDC2203',
        symbol: 'FYUSDC2203',
        address: '0xa9Bc738c017771A4cF01730F215E6E2b34DCa9B8',
        decimals: 6,
        version: '1',
        poolVersion: '1',
        poolAddress: '0xf76906AA78ECD4FcFB8a7923fB40fA42c07F20D6',
        poolName: 'FYUSDC2203 LP',
        poolSymbol: 'FYUSDC2203LP',
        ts: '23381681843',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],

    /* 2206 */
    [
      DAI_2206,
      {
        id: DAI_2206,
        baseId: '0x303100000000',
        // baseAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        maturity: 1656039600,
        name: 'FYDAI2206',
        symbol: 'FYDAI2206',
        address: '0xa3eCAF5c5E98C1a500f4596576dAD3328A701C73',
        decimals: 18,
        version: '1',
        poolAddress: '0x6651f8E1ff6863Eb366a319F9A94191346D0e323',
        poolName: 'FYDAI2206 LP',
        poolSymbol: 'FYDAI2206LP',
        poolVersion: '1',
        ts: '23381681843',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],
    [
      USDC_2206,
      {
        id: USDC_2206,
        baseId: '0x303200000000',
        // baseAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        maturity: 1656039600,
        name: 'FYUSDC2206',
        symbol: 'FYUSDC2206',
        address: '0xC4b24Ec9fB2DC32b3a545e0d873d2598031B80C5',
        decimals: 6,
        version: '1',
        poolAddress: '0x8C8A448FD8d3e44224d97146B25F4DeC425af309',
        poolName: 'FYUSDC2206 LP',
        poolSymbol: 'FYUSDC2206LP',
        poolVersion: '1',
        ts: '23381681843',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],

    /* 2209 */
    [
      USDC_2209,
      {
        id: USDC_2209,
        baseId: '0x303200000000',
        // baseAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        maturity: 1664550000,
        name: 'FYUSDC2209',
        symbol: 'FYUSDC2209',
        address: '0xeC1b42EC9a1650238acE42fD57bc719cCC87851C',
        decimals: 6,
        version: '1',
        poolAddress: '0x13aB946C6A9645EDfF2A33880e0Fc37f67122170',
        poolName: 'FYUSDC2209 LP',
        poolSymbol: 'FYUSDC2209LP',
        poolVersion: '1',
        ts: '19484734869',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],
    [
      DAI_2209,
      {
        id: DAI_2209,
        baseId: '0x303100000000',
        // baseAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        maturity: 1664550000,
        name: 'FYDAI2209',
        symbol: 'FYDAI2209',
        address: '0x4f9B5e639447456DDC784Bc441F5A6FD7CE80729',
        decimals: 18,
        version: '1',
        poolAddress: '0xFCb9B8C5160Cf2999f9879D8230dCed469E72eeb',
        poolName: 'FYDAI2209 LP',
        poolSymbol: 'FYDAI2209LP',
        poolVersion: '1',
        ts: '19484734869',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],
    [
      WETH_2209,
      {
        id: WETH_2209,
        baseId: '0x303000000000',
        // baseAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        maturity: 1664550000,
        name: 'FYETH2209',
        symbol: 'FYETH2209',
        address: '0xe1e878364EfC19712a2833C5C60B68d215f9a4Ab',
        decimals: 18,
        version: '1',
        poolAddress: '0x0FA29EEb169CDE6c779326d7b16c54529ECA1DD5',
        poolName: 'FYETH2209 LP',
        poolSymbol: 'FYETH2209LP',
        poolVersion: '1',
        ts: '14613551152',
        g1: '13835058055282163712',
        g2: '24595658764946068821',
      },
    ],

    /* 2212 */

    [
      USDC_2212,
      {
        id: USDC_2212,
        baseId: '0x303200000000',
        // baseAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        maturity: 1672412400,
        name: 'FYUSDC2212',
        symbol: 'FYUSDC2212',
        address: '0xD4aeA765BC2c56f09074254eb5a3f5FF9d709449',
        decimals: 6,
        version: '1',
        poolAddress: '0x81Ae3D05e4F0d0DD29d6840424a0b761A7fdB51c',
        poolName: 'FYUSDC2212 LP',
        poolSymbol: 'FYUSDC2212LP',
        poolVersion: '1',
        ts: '10628037201',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    [
      DAI_2212,
      {
        id: DAI_2212,
        baseId: '0x303100000000',
        // baseAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        maturity: 1672412400,
        name: 'FYDAI2212',
        symbol: 'FYDAI2212',
        address: '0xe8Ec1A61f6C86e8d33C327FEdad559c20b9A66a2',
        decimals: 18,
        version: '1',
        poolAddress: '0x25e46aD1cC867c5253a179F45e1aB46144c8aBc0',
        poolName: 'FYDAI2212 LP',
        poolSymbol: 'FYDAI2212LP',
        poolVersion: '1',
        ts: '12989823246',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
    [
      WETH_2212,
      {
        id: WETH_2212,
        baseId: '0x303000000000',
        // baseAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        maturity: 1672412400,
        name: 'FYETH2212',
        symbol: 'FYETH2212',
        address: '0x5655A973A49e1F9c1408bb9A617Fd0DBD0352464',
        decimals: 18,
        version: '1',
        poolAddress: '0x7F0dD461D77F84cDd3ceD46F9D550e35F1969a24',
        poolName: 'FYETH2212 LP',
        poolSymbol: 'FYETH2212LP',
        poolVersion: '1',
        ts: '23381681843',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    /* 2303 */
    [
      USDC_2303,
      {
        id: USDC_2303,
        baseId: '0x303200000000',
        // baseAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        maturity: 1680274800,
        name: 'FYUSDC2303',
        symbol: 'FYUSDC2303',
        address: '0x0FBd5ca8eE61ec921B3F61B707f1D7D64456d2d1',
        decimals: 6,
        version: '1',
        poolAddress: '0x2eb907fb4b71390dC5CD00e6b81B7dAAcE358193',
        poolName: 'FYUSDC2303 LP',
        poolSymbol: 'FYUSDC2303LP',
        poolVersion: '1',
        ts: '10628037201',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    [
      WETH_2303,
      {
        id: WETH_2303,
        baseId: '0x303000000000',
        // baseAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        maturity: 1680274800,
        name: 'FYETH2303',
        symbol: 'FYETH2303',
        address: '0x8a9262C7C6eC9bb143Eb68798AdB377c95F47138',
        decimals: 18,
        version: '1',
        poolAddress: '0x79A6Be1Ae54153AA6Fc7e4795272c63F63B2a6DC',
        poolName: 'FYETH2303 LP',
        poolSymbol: 'FYETH2303LP',
        poolVersion: '1',
        ts: '23381681843',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    [
      DAI_2303,
      {
        id: DAI_2303,
        baseId: '0x303100000000',
        // baseAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        maturity: 1680274800,
        name: 'FYDAI2303',
        symbol: 'FYDAI2303',
        address: '0x3295a74Bca0d6FdFeF648BA8549d305a8bA9cc13',
        decimals: 18,
        version: '1',
        poolAddress: '0x22E1e5337C5BA769e98d732518b2128dE14b553C',
        poolName: 'FYDAI2303 LP',
        poolSymbol: 'FYDAI2303LP',
        poolVersion: '1',
        ts: '12989823246',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    /* 2306 */
    [
      WETH_2306,
      {
        id: WETH_2306,
        baseId: '0x303000000000',
        maturity: 1688137200,
        name: 'FYETH2306',
        symbol: 'FYETH2306',
        address: '0x523803c57a497c3AD0E850766c8276D4864edEA5',
        decimals: 18,
        version: '1',
        poolAddress: '0x2769ABE33010c710e24eA6aF8A2683C630BbD7D0',
        poolName: 'FYETH2306 LP',
        poolSymbol: 'FYETH2306LP',
        poolVersion: '1',
        ts: '23381681843',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    [
      DAI_2306,
      {
        id: DAI_2306,
        baseId: '0x303100000000',
        maturity: 1688137200,
        name: 'FYDAI2306',
        symbol: 'FYDAI2306',
        address: '0x60a6A7fabe11ff36cbE917a17666848f0FF3A60a',
        decimals: 18,
        version: '1',
        poolAddress: '0x02DbfAca22DF7e86897aDF65eb74188D79DAbeA6',
        poolName: 'FYDAI2306 LP',
        poolSymbol: 'FYDAI2306LP',
        poolVersion: '1',
        ts: '12989823246',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    [
      USDC_2306,
      {
        id: USDC_2306,
        baseId: '0x303200000000',
        maturity: 1688137200,
        name: 'FYUSDC2306',
        symbol: 'FYUSDC2306',
        address: '0xcbb7eba13f9e1d97b2138f588f5ca2f5167f06cc',
        decimals: 6,
        version: '1',
        poolAddress: '0x536edc2a3db3bfe558cae74cedccd30f07f7121b',
        poolName: 'FYUSDC2306 LP',
        poolSymbol: 'FYUSDC2306LP',
        poolVersion: '1',
        ts: '10628037201',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    [
      USDT_2306,
      {
        id: USDT_2306,
        baseId: '0x30a000000000',
        maturity: 1688137200,
        name: 'FYUSDT2306',
        symbol: 'FYUSDT2306',
        address: '0x035072cb2912daab7b578f468bd6f0d32a269e32',
        decimals: 6,
        version: '1',
        poolAddress: '0xc6078e090641cC32b05a7F3F102F272A4Ee19867',
        poolName: 'FYUSDT2306 LP',
        poolSymbol: 'FYUSDT2306LP',
        poolVersion: '1',
        ts: '16701201316',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],

    [
      USDT_2303,
      {
        id: USDT_2303,
        baseId: '0x30a000000000',
        maturity: 1680274800,
        name: 'FYUSDT2303',
        symbol: 'FYUSDT2303',
        address: '0xc24da474a71c44d2b644089020ba255908ada6e1',
        decimals: 6,
        version: '1',
        poolAddress: '0xb268E2C85861B74ec75fe728Ae40D9A2308AD9Bb',
        poolName: 'FYUSDT2303 LP',
        poolSymbol: 'FYUSDT2303LP',
        poolVersion: '1',
        ts: '16701201316',
        g1: '16602069666338596454',
        g2: '20496382304121724017',
      },
    ],
  ])
);
