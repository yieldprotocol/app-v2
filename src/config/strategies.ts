import { BaseProvider } from '@ethersproject/providers';
import { Strategy__factory } from '../contracts';
import { DAI, FRAX, USDC, WETH, USDT } from './assets';

export enum StrategyType {
  V1 = 'V1',
  V2 = 'V2', // needs to be upgraded to V2_1
  V2_1 = 'V2_1',
}

export type AssociatedStrategy = {
  [value in StrategyType]?: string;
};

export interface StrategyInfo {
  id: string;
  address: string;
  type: StrategyType;
  associatedStrategy?: AssociatedStrategy | string; // if V2 strategy, then the V1 associated strategy (and vice versa)
  symbol?: string;
  name?: string;
  baseId?: string;
  decimals?: number;
  version?: string;
  active?: boolean;
  associatedSeries?: string;
}

// map each chain id to its corresponding strategies' data
const STRATEGIES = new Map<number, StrategyInfo[]>();

STRATEGIES.set(1, [
  /* V1 strategies */
  {
    id: '0x1030FF000FFF',
    address: '0xcf30A5A994f9aCe5832e30C138C9697cda5E1247',
    associatedStrategy: {
      V2: '',
      V2_1: '0x3AE72b6F5Fb854eaa2B2b862359B6fCA7e4bC2fc',
    },
    type: StrategyType.V1,
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedSeries: '0x0FBd5ca8eE61ec921B3F61B707f1D7D64456d2d1',
  },
  {
    id: '0x1031FF000FFF',
    address: '0x7ACFe277dEd15CabA6a8Da2972b1eb93fe1e2cCD',
    associatedStrategy: {
      V2: '',
      V2_1: '0x160bF035154858FAEE3EE2d4592e5393d259c3A6',
    },
    type: StrategyType.V1,
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedSeries: '0x79A6Be1Ae54153AA6Fc7e4795272c63F63B2a6DC',
  },
  {
    id: '0x1032FF000FFF',
    address: '0xFBc322415CBC532b54749E31979a803009516b5D',
    associatedStrategy: {
      V2: '',
      V2_1: '0xa874c4dF3CAA250307C0351AAa13d3d20f70c321',
    },
    type: StrategyType.V1,
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
    associatedSeries: '0x22E1e5337C5BA769e98d732518b2128dE14b553C',
  },
  {
    id: '0x1031FF000FFE',
    address: '0x1144e14E9B0AA9e181342c7e6E0a9BaDB4ceD295',
    type: StrategyType.V1,
    associatedStrategy: {
      V2: '0x9ca2a34ea52bc1264D399aCa042c0e83091FEECe',
      V2_1: '0xAB4a4bDE7C182e47339BB9920212851CEAE0eAA1',
    },
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0x9ca4D6fbE0Ba91d553e74805d2E2545b04AbEfEA',
  },
  {
    id: '0x1032FF000FFE',
    address: '0x8e8D6aB093905C400D583EfD37fbeEB1ee1c0c39',
    type: StrategyType.V1,
    associatedStrategy: {
      V2: '0x5dd6DcAE25dFfa0D46A04C9d99b4875044289fB2',
      V2_1: '0xeDa2fEc6953b90aA163C2737AEf9a731B44CE17b',
    },
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    version: '1',
    associatedSeries: '0x667f185407C4CAb52aeb681f0006e4642d8091DF',
  },
  {
    id: '0x1030FF000FFE',
    address: '0x831dF23f7278575BA0b136296a285600cD75d076',
    type: StrategyType.V1,
    associatedStrategy: {
      V2: '0xb268E2C85861B74ec75fe728Ae40D9A2308AD9Bb',
      V2_1: '0xDa072f54cDB9100e62FDE31c60fbEe555dc43a76',
    },
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0x124c9F7E97235Fe3E35820f95D10aFfCe4bE9168',
  },
  {
    id: '0x1138FF000000',
    address: '0xbD6277E36686184A5343F83a4be5CeD0f8CD185A', //
    type: StrategyType.V1,
    associatedStrategy: {
      V2: '',
      V2_1: '0x4B010fA49E8b673D0682CDeFCF7834328076748C',
    },
    symbol: 'YSFRAX6MJD',
    baseId: FRAX,
    name: 'Yield Strategy FRAX 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0xFA71e5f0072401dA161b1FC25a9636927AF690D0',
  },
  {
    id: '0x1138FF000001',
    address: '0x1565f539e96c4d440c38979dbc86fd711c995dd6',
    associatedStrategy: {
      V2: '0x93dEe161a396aF75c7458a65687895299bFeB437',
      V2_1: '',
    },
    type: StrategyType.V1,
    symbol: 'YSFRAX6MMS',
    baseId: FRAX,
    name: 'Yield Strategy FRAX 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedSeries: '0xB38Ba395D15392796B51057490bBc790871dd6a0',
  },
  /* V2 strategies */
  {
    id: '0x1030FF000FFE',
    address: '0xb268E2C85861B74ec75fe728Ae40D9A2308AD9Bb',
    type: StrategyType.V2,
    associatedStrategy: {
      V1: '0x831dF23f7278575BA0b136296a285600cD75d076',
      V2_1: '0xDa072f54cDB9100e62FDE31c60fbEe555dc43a76',
    },
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0x124c9f7e97235fe3e35820f95d10affce4be9168',
  },
  {
    id: '0x1031FF000FFE',
    address: '0x9ca2a34ea52bc1264D399aCa042c0e83091FEECe',
    type: StrategyType.V2,
    associatedStrategy: {
      V1: '0x1144e14E9B0AA9e181342c7e6E0a9BaDB4ceD295',
      V2_1: '0xAB4a4bDE7C182e47339BB9920212851CEAE0eAA1',
    },
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0x9ca4d6fbe0ba91d553e74805d2e2545b04abefea',
  },
  {
    id: '0x1032FF000FFE',
    address: '0x5dd6DcAE25dFfa0D46A04C9d99b4875044289fB2',
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    type: StrategyType.V2,
    associatedStrategy: {
      V1: '0x8e8D6aB093905C400D583EfD37fbeEB1ee1c0c39',
      V2_1: '0xeDa2fEc6953b90aA163C2737AEf9a731B44CE17b',
    },
    version: '1',
    associatedSeries: '0x667f185407c4cab52aeb681f0006e4642d8091df',
  },
  {
    id: '0x10A0FF000FFE',
    address: '0x428e229ac5bc52a2e07c379b2f486fefefd674b1',
    type: StrategyType.V2,
    associatedStrategy: {
      V1: '', // no v1 for USDT
      V2_1: '0x87df4c7E6E8E76ba82C4C239261A8D070576E76F',
    },
    symbol: 'YSUSDT6MJD',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Jun Dec',
    decimals: 6,
    version: '1',
    associatedSeries: '0xa0e4b17042f20d9badbda9961c2d0987c90f6439',
  },
  {
    id: '0x10A0FF000FFF',
    address: '0xf708005cee17b2c5fe1a01591e32ad6183a12eae',
    type: StrategyType.V2,
    associatedStrategy: {
      V1: '', // no v1 for USDT
      V2_1: '0xE7C82f5964b810B6AE01ab116991D5E110C846f5',
    },
    symbol: 'YSUSDT6MMS',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Mar Sep',
    decimals: 6,
    version: '1',
    associatedSeries: '0x8a6ff4c631816888444807541578ab8465edddc2',
  },
  // {
  //   id: '',
  //   address: '0xa6dbc40c75037895dee8d2415f1ce9e0fb08cf49', // does this v2 exist? - jacob b
  //   associatedStrategy: {
  //     V1: '0x7ACFe277dEd15CabA6a8Da2972b1eb93fe1e2cCD', //
  //     V2_1: '0x160bF035154858FAEE3EE2d4592e5393d259c3A6', //
  //   },
  //   type: StrategyType.V2,
  //   symbol: 'YSDAI6MMS',
  //   baseId: DAI,
  //   name: 'Yield Strategy DAI 6M Mar Sep',
  //   decimals: 18,
  //   version: '1',
  //   associatedSeries: '', //
  // },
  // {
  //   id: '',
  //   address: '0x59e9db2c8995ceeaf6a9ad0896601a5d3289444e', // does this v2 exist? - jacob b
  //   associatedStrategy: {
  //     V1: '0xFBc322415CBC532b54749E31979a803009516b5D',
  //     V2_1: '0xa874c4dF3CAA250307C0351AAa13d3d20f70c321',
  //   },
  //   type: StrategyType.V2,
  //   symbol: 'YSUSDC6MMS',
  //   baseId: USDC,
  //   name: 'Yield Strategy USDC 6M Mar Sep',
  //   decimals: 6,
  //   version: '1',

  //   associatedSeries: '',
  // },
  // {
  //   id: '',
  //   address: '0x11f30c6b1173ec6e0a6d622c8f17eef3dc593764', // does this v2 exist? - jacob b
  //   associatedStrategy: {
  //     V1: '0xcf30A5A994f9aCe5832e30C138C9697cda5E1247', //
  //     V2_1: '0x3AE72b6F5Fb854eaa2B2b862359B6fCA7e4bC2fc', //
  //   },
  //   type: StrategyType.V2,
  //   symbol: 'YSETH6MMS',
  //   baseId: WETH,
  //   name: 'Yield Strategy ETH 6M Mar Sep',
  //   decimals: 18,
  //   version: '1',
  //   associatedSeries: '',
  // },
  {
    id: '',
    address: '0x93dEe161a396aF75c7458a65687895299bFeB437', // does this v2 exist? - zero addrs for fyToken and pool on etherscan - jacob b
    associatedStrategy: {
      V1: '0x1565f539e96c4d440c38979dbc86fd711c995dd6',
      V2_1: '',
    },
    type: StrategyType.V2,
    symbol: 'YSFRAX6MMS',
    baseId: FRAX,
    name: 'Yield Strategy FRAX 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedSeries: '0xB38Ba395D15392796B51057490bBc790871dd6a0', //
  },

  // v2.1 str
  {
    id: '0x1138FF000000',
    address: '0x4B010fA49E8b673D0682CDeFCF7834328076748C', // has a zero fyToken addr. does this exist? - jacob b
    type: StrategyType.V2_1,
    associatedStrategy: {
      V1: '0xbD6277E36686184A5343F83a4be5CeD0f8CD185A',
      V2: '',
    },
    symbol: 'YSFRAX6MJD',
    baseId: FRAX,
    name: 'Yield Strategy FRAX 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0xFA71e5f0072401dA161b1FC25a9636927AF690D0'
  },
  {
    id: '0x1030FF000000',
    address: '0xDa072f54cDB9100e62FDE31c60fbEe555dc43a76',
    type: StrategyType.V2_1,
    associatedStrategy: {
      V2: '0xb268E2C85861B74ec75fe728Ae40D9A2308AD9Bb',
      V1: '0x831dF23f7278575BA0b136296a285600cD75d076',
    },
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0xc8110b03629211b946c2783637ABC9402b50EcDf',
  },
  {
    id: '', // UNDIVESTED
    address: '0x3AE72b6F5Fb854eaa2B2b862359B6fCA7e4bC2fc',
    associatedStrategy: {
      V1: '0xcf30A5A994f9aCe5832e30C138C9697cda5E1247',
      V2: '',
    },
    type: StrategyType.V2_1,
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedSeries: '0xD842A9f77e142f420BcdBCd6cFAC3548a68906dB',
  },
  {
    id: '',
    address: '0x160bF035154858FAEE3EE2d4592e5393d259c3A6',
    associatedStrategy: {
      V1: '0x7ACFe277dEd15CabA6a8Da2972b1eb93fe1e2cCD',
      V2: '',
    },
    type: StrategyType.V2_1,
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedSeries: '0xB917a6CD3f811A84c1c5B972E2c715a6d93f40aa',
  },
  {
    id: '',
    address: '0xa874c4dF3CAA250307C0351AAa13d3d20f70c321',
    associatedStrategy: {
      V1: '0xFBc322415CBC532b54749E31979a803009516b5D',
      V2: ''
    },
    type: StrategyType.V2_1,
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
    associatedSeries: '0x74c4cEa80c1afEAda2907B55FDD9C958Da4a53F2',
  },
  {
    id: '',
    address: '0xAB4a4bDE7C182e47339BB9920212851CEAE0eAA1',
    type: StrategyType.V2_1,
    associatedStrategy: {
      V1: '0x1144e14E9B0AA9e181342c7e6E0a9BaDB4ceD295',
      V2: '0x9ca2a34ea52bc1264D399aCa042c0e83091FEECe',
    },
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0xc7f12Ea237bE7BE6028285052CF3727EaF0e597B',
  },

  {
    id: '',
    address: '0xeDa2fEc6953b90aA163C2737AEf9a731B44CE17b',
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    type: StrategyType.V2_1,
    associatedStrategy: {
      V1: '0x8e8D6aB093905C400D583EfD37fbeEB1ee1c0c39',
      V2: '0x5dd6DcAE25dFfa0D46A04C9d99b4875044289fB2',
    },
    version: '1',
    associatedSeries: '0x9912ED921832A8F6fc4a07E0892E5974A252043C',
  },
  {
    id: '',
    address: '0x87df4c7E6E8E76ba82C4C239261A8D070576E76F',
    type: StrategyType.V2_1,
    associatedStrategy: {
      V1: '', // no v1 for USDT
      V2: '0x428e229ac5bc52a2e07c379b2f486fefefd674b1',
    },
    symbol: 'YSUSDT6MJD',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Jun Dec',
    decimals: 6,
    version: '1',
    associatedSeries: '0xD28380De0e7093AC62bCb88610b9f4f4Fb58Be74',
  },
  {
    id: '',
    address: '0xE7C82f5964b810B6AE01ab116991D5E110C846f5',
    type: StrategyType.V2_1,
    associatedStrategy: {
      V1: '', // no v1 for USDT
      V2: '0xf708005cee17b2c5fe1a01591e32ad6183a12eae',
    },
    symbol: 'YSUSDT6MMS',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Mar Sep',
    decimals: 6,
    version: '1',
    associatedSeries: '0x299c9e28D2c5efa09aa147abB4f1CB4a8dc7AbE0',
  },
]);

STRATEGIES.set(42161, [
  {
    id: 'YSDAI6MMS',
    address: '0xE779cd75E6c574d83D3FD6C92F3CBE31DD32B1E1',
    associatedStrategy: {
      V2: '0x5aeB4EFaAA0d27bd606D618BD74Fe883062eAfd0',
      V2_1: '0x4771522accAC6fEcf89A6365cEaF05667ed95886',
    },
    type: StrategyType.V1,
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedSeries: '0xEE508c827a8990c04798B242fa801C5351012B23',
  },
  {
    id: 'YSUSDC6MMS',
    address: '0x92A5B31310a3ED4546e0541197a32101fCfBD5c8',
    associatedStrategy: {
      V2: '0x3b4FFD93CE5fCf97e61AA8275Ec241C76cC01a47',
      V2_1: '0x7012aF43F8a3c1141Ee4e955CC568Ad2af59C3fa',
    },
    type: StrategyType.V1,
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
    associatedSeries: '0x5Bb78E530D9365aeF75664c5093e40B0001F7CCd',
  },
  {
    id: 'YSETH6MMS',
    address: '0xD5B43b2550751d372025d048553352ac60f27151',
    associatedStrategy: {
      V2: '0x5582b8398FB586F1b79edd1a6e83f1c5aa558955',
      V2_1: '0x0A4B2e37BFEF8e54DeA997A87749A403353134e8',
    },
    type: StrategyType.V1,
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedSeries: '0xd947360575E6F01Ce7A210C12F2EE37F5ab12d11',
  },
  {
    id: 'YSDAI6MJD',
    address: '0xa3cAF61FD23d374ce13c742E4E9fA9FAc23Ddae6',
    associatedStrategy: {
      V2: '0x4276BEaA49DE905eED06FCDc0aD438a19D3861DD',
      V2_1: '0x9847D09cb0eEA77f7875A6904BFA22AE06b34CCE',
    },
    type: StrategyType.V1,
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0x60a6A7fabe11ff36cbE917a17666848f0FF3A60a',
  },
  {
    id: 'YSUSDC6MJD',
    address: '0x54F08092e3256131954dD57C04647De8b2E7A9a9',
    associatedStrategy: {
      V2: '0x33e6B154efC7021dD55464c4e11a6AfE1f3D0635',
      V2_1: '0xCeAf1CBf0CFDD1f7Ea4C1C850c0bC032a60431DB',
    },
    type: StrategyType.V1,
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    version: '1',
    associatedSeries: '0xCbB7Eba13F9E1d97B2138F588f5CA2F5167F06cc',
  },
  {
    id: 'YSETH6MJD',
    address: '0x3353E1E2976DBbc191a739871faA8E6E9D2622c7',
    associatedStrategy: {
      V2: '0xad1983745D6c739537fEaB5bed45795f47A940b3',
      V2_1: '0xC7D2E96Ca94E1870605c286268313785886D2257',
    },
    type: StrategyType.V1,
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0x523803c57a497c3AD0E850766c8276D4864edEA5',
  },

  //V2 Strategies
  {
    id: '0x1030FF000FFE',
    address: '0xad1983745D6c739537fEaB5bed45795f47A940b3',
    type: StrategyType.V2,
    associatedStrategy: {
      V2_1: '0xC7D2E96Ca94E1870605c286268313785886D2257',
      V1: '0x3353E1E2976DBbc191a739871faA8E6E9D2622c7',
    },
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0x8c41fc42e8Ebf66eA5F3190346c2d5b94A80480F',
  },
  {
    id: '0x1031FF000FFE',
    address: '0x4276BEaA49DE905eED06FCDc0aD438a19D3861DD',
    type: StrategyType.V2,
    associatedStrategy: {
      V2_1: '0x9847D09cb0eEA77f7875A6904BFA22AE06b34CCE',
      V1: '0xa3cAF61FD23d374ce13c742E4E9fA9FAc23Ddae6',
    },
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedSeries: '0xCA9d3B5dE1550c79155b1311Ef54EBc73954D470',
  },
  {
    id: '0x1032FF000FFE',
    address: '0x33e6B154efC7021dD55464c4e11a6AfE1f3D0635',
    associatedStrategy: {
      V2_1: '0xCeAf1CBf0CFDD1f7Ea4C1C850c0bC032a60431DB',
      V1: '0x54F08092e3256131954dD57C04647De8b2E7A9a9',
    },
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    type: StrategyType.V2,
    version: '1',
    associatedSeries: '0x3B560caa508CA8E58f07263f58Ee2353044C0d5c',
  },

  {
    id: '0x10A0FF000FFE',
    address: '0x861509a3fa7d87faa0154aae2cb6c1f92639339a',
    associatedStrategy: { V2_1: '0x8b814aD71e611e7a38eE64Ec16ce421A477956e1' },
    type: StrategyType.V2,
    symbol: 'YSUSDT6MJD',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Jun Dec',
    decimals: 6,
    version: '1',
    associatedSeries: '0x9Ca40B35c3A8A717D4d54faC0905BBf889dDb281',
  },

  {
    id: '0x10A0FF000FFF',
    address: '0xfe2aba5ba890af0ee8b6f2d488b1f85c9e7c5643',
    associatedStrategy: { V2_1: '0x2C918C4db3843F715556c65646f9E4a04C4BfBa6' },
    type: StrategyType.V2,
    symbol: 'YSUSDT6MMS',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Mar Sep',
    decimals: 6,
    version: '1',
    associatedSeries: '0x9b19889794a30056a1e5be118ee0a6647b184c5f',
  },

  {
    id: '0x1032FF000FFF',
    address: '0x3b4FFD93CE5fCf97e61AA8275Ec241C76cC01a47',
    type: StrategyType.V2,
    associatedStrategy: { V2_1: '0x7012aF43F8a3c1141Ee4e955CC568Ad2af59C3fa' },
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
    associatedSeries: '0x5bb78e530d9365aef75664c5093e40b0001f7ccd',
  },
  {
    id: '0x1030FF000FFF',
    address: '0x5582b8398FB586F1b79edd1a6e83f1c5aa558955',
    type: StrategyType.V2,
    associatedStrategy: { V2_1: '0x0A4B2e37BFEF8e54DeA997A87749A403353134e8' },
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedSeries: '0xd947360575e6f01ce7a210c12f2ee37f5ab12d11',
  },
  {
    id: '0x1031FF000FFF',
    address: '0x5aeB4EFaAA0d27bd606D618BD74Fe883062eAfd0',
    type: StrategyType.V2,
    associatedStrategy: { V2_1: '0x4771522accAC6fEcf89A6365cEaF05667ed95886' },
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedSeries: '0xee508c827a8990c04798b242fa801c5351012b23',
  },

  // V2.1 strategies
  {
    id: '0x1031FF000001',
    address: '0x4771522accAC6fEcf89A6365cEaF05667ed95886',
    type: StrategyType.V2_1,
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedStrategy: {
      V2: '0x5aeB4EFaAA0d27bd606D618BD74Fe883062eAfd0',
      V1: '0xE779cd75E6c574d83D3FD6C92F3CBE31DD32B1E1',
    },
    associatedSeries: '0xEE508c827a8990c04798B242fa801C5351012B23',
  },
  {
    id: '0x10A0FF000001',
    address: '0x2C918C4db3843F715556c65646f9E4a04C4BfBa6',
    type: StrategyType.V2_1,
    symbol: 'YSUSDT6MMS',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Mar Sep',
    decimals: 6,
    version: '1',
    associatedStrategy: {
      V2: '0xfe2aba5ba890af0ee8b6f2d488b1f85c9e7c5643',
      V1: '', // no v1
    },
    associatedSeries: '0x9B19889794A30056A1E5Be118ee0a6647B184c5f',
  },
  {
    id: '0x1032FF000000',
    address: '0xCeAf1CBf0CFDD1f7Ea4C1C850c0bC032a60431DB',
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    type: StrategyType.V2_1,
    version: '1',
    associatedStrategy: {
      V2: '0x33e6B154efC7021dD55464c4e11a6AfE1f3D0635',
      V1: '0x54F08092e3256131954dD57C04647De8b2E7A9a9',
    },
    associatedSeries: '0x3B560caa508CA8E58f07263f58Ee2353044C0d5c',
  },
  {
    id: '0x10A0FF000000',
    address: '0x8b814aD71e611e7a38eE64Ec16ce421A477956e1',
    type: StrategyType.V2_1,
    symbol: 'YSUSDT6MJD',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Jun Dec',
    decimals: 6,
    version: '1',
    associatedStrategy: {
      V2: '0x861509a3fa7d87faa0154aae2cb6c1f92639339a',
      V1: '', // no v1
    },
    associatedSeries: '0x9Ca40B35c3A8A717D4d54faC0905BBf889dDb281',
  },
  {
    id: '0x1032FF000001',
    address: '0x7012aF43F8a3c1141Ee4e955CC568Ad2af59C3fa',
    type: StrategyType.V2_1,
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
    associatedStrategy: {
      V2: '0x3b4FFD93CE5fCf97e61AA8275Ec241C76cC01a47',
      V1: '0x92A5B31310a3ED4546e0541197a32101fCfBD5c8',
    },
    associatedSeries: '0x5Bb78E530D9365aeF75664c5093e40B0001F7CCd',
  },
  {
    id: '0x1030FF000001',
    address: '0x0A4B2e37BFEF8e54DeA997A87749A403353134e8',
    type: StrategyType.V2_1,
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
    associatedStrategy: {
      V2: '0x5582b8398FB586F1b79edd1a6e83f1c5aa558955',
      V1: '0xD5B43b2550751d372025d048553352ac60f27151',
    },
    associatedSeries: '0xd947360575E6F01Ce7A210C12F2EE37F5ab12d11',
  },
  {
    id: '0x1030FF000000',
    address: '0xC7D2E96Ca94E1870605c286268313785886D2257',
    type: StrategyType.V2_1,
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedStrategy: {
      V2: '0xad1983745D6c739537fEaB5bed45795f47A940b3',
      V1: '0x3353E1E2976DBbc191a739871faA8E6E9D2622c7',
    },
    associatedSeries: '0x8c41fc42e8Ebf66eA5F3190346c2d5b94A80480F',
  },
  {
    id: '0x1031FF000000',
    address: '0x9847D09cb0eEA77f7875A6904BFA22AE06b34CCE',
    type: StrategyType.V2_1,
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
    associatedStrategy: {
      V2: '0x4276BEaA49DE905eED06FCDc0aD438a19D3861DD',
      V1: '0xa3cAF61FD23d374ce13c742E4E9fA9FAc23Ddae6',
    },
    associatedSeries: '0xCA9d3B5dE1550c79155b1311Ef54EBc73954D470',
  },
]);

export default STRATEGIES;

export const validateStrategies = async (provider: BaseProvider) => {
  console.log('VALIDATING STRATEGIES');
  const preText = '### STRATEGY VALIDATION ERROR ### ';
  const chainId = (await provider.getNetwork()).chainId;
  const strategyList = STRATEGIES.get(chainId)!;
  strategyList.forEach(async (s: StrategyInfo) => {
    const strategy = Strategy__factory.connect(s.address, provider);
    try {
      const [symbol, baseId, name, decimals, version] = await Promise.all([
        strategy.symbol(),
        strategy.baseId(),
        strategy.name(),
        strategy.decimals(),
        strategy.version(),
      ]);
      s.symbol !== symbol && console.log(preText, s.address, ': symbol mismatch');
      s.baseId !== baseId && console.log(preText, s.address, ': baseId mismatch');
      s.name !== name && console.log(preText, s.address, ': name mismatch');
      s.decimals !== decimals && console.log(preText, s.address, ': decimals mismatch');
      s.version !== version && console.log(preText, s.address, ': version mismatch');
    } catch (e) {
      console.log(preText, s.address, ': Contract not reachable.');
    }
  });
};
