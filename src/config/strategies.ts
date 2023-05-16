import { BaseProvider } from '@ethersproject/providers';
import { Strategy__factory } from '../contracts';
import { DAI, FRAX, USDC, WETH, USDT } from './assets';

export enum StrategyType {
  V1 = 'V1',
  V2 = 'V2',
}

export interface StrategyInfo {
  id: string;
  address: string;
  type: StrategyType;
  associatedStrategy?: string; // if V2 strategy, then the V1 associated strategy (and vice versa)
  symbol?: string;
  name?: string;
  baseId?: string;
  decimals?: number;
  version?: string;
}

// map each chain id to its corresponding strategies' data
const STRATEGIES = new Map<number, StrategyInfo[]>();

STRATEGIES.set(1, [
  /* V1 strategies */
  {
    id: '0x1031FF000FFF',
    address: '0x7ACFe277dEd15CabA6a8Da2972b1eb93fe1e2cCD',
    associatedStrategy: '0xa6dbc40c75037895dee8d2415f1ce9e0fb08cf49',
    type: StrategyType.V1,
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0x1144e14E9B0AA9e181342c7e6E0a9BaDB4ceD295',
    type: StrategyType.V1,
    associatedStrategy: '0x9ca2a34ea52bc1264D399aCa042c0e83091FEECe',
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '0x1032FF000FFF',
    address: '0xFBc322415CBC532b54749E31979a803009516b5D',
    associatedStrategy: '0x59e9db2c8995ceeaf6a9ad0896601a5d3289444e',
    type: StrategyType.V1,
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
  },
  {
    id: '',
    address: '0x8e8D6aB093905C400D583EfD37fbeEB1ee1c0c39',
    type: StrategyType.V1,
    associatedStrategy: '0x5dd6DcAE25dFfa0D46A04C9d99b4875044289fB2',
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    version: '1',
  },
  {
    id: '0x1030FF000FFF',
    address: '0xcf30A5A994f9aCe5832e30C138C9697cda5E1247',
    associatedStrategy: '0x11f30c6b1173ec6e0a6d622c8f17eef3dc593764',
    type: StrategyType.V1,
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0x831dF23f7278575BA0b136296a285600cD75d076',
    type: StrategyType.V1,
    associatedStrategy: '0xb268E2C85861B74ec75fe728Ae40D9A2308AD9Bb',
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0xbD6277E36686184A5343F83a4be5CeD0f8CD185A',
    type: StrategyType.V1,
    associatedStrategy: '0x4B010fA49E8b673D0682CDeFCF7834328076748C',
    symbol: 'YSFRAX6MJD',
    baseId: FRAX,
    name: 'Yield Strategy FRAX 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: 'YSFRAX6MMS',
    address: '0x1565f539e96c4d440c38979dbc86fd711c995dd6',
    associatedStrategy: '0x45a37d7a93416934ebf7ad85b35bcf39fcd68696',
    type: StrategyType.V1,
    symbol: 'YSFRAX6MMS',
    baseId: FRAX,
    name: 'Yield Strategy FRAX 6M Mar Sep',
    decimals: 18,
    version: '1',
  },

  /* V2 strategies */
  {
    id: '0x1030FF000FFE',
    address: '0xb268E2C85861B74ec75fe728Ae40D9A2308AD9Bb',
    type: StrategyType.V2,
    associatedStrategy: '0x831dF23f7278575BA0b136296a285600cD75d076',
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '0x1031FF000FFE',
    address: '0x9ca2a34ea52bc1264D399aCa042c0e83091FEECe',
    type: StrategyType.V2,
    associatedStrategy: '0x1144e14E9B0AA9e181342c7e6E0a9BaDB4ceD295',
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '0x1032FF000FFE',
    address: '0x5dd6DcAE25dFfa0D46A04C9d99b4875044289fB2',
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    type: StrategyType.V2,
    associatedStrategy: '0x8e8D6aB093905C400D583EfD37fbeEB1ee1c0c39',
    version: '1',
  },
  {
    id: '0x1138FF000000',
    address: '0x4B010fA49E8b673D0682CDeFCF7834328076748C', // strategy
    type: StrategyType.V2,
    associatedStrategy: '0xbD6277E36686184A5343F83a4be5CeD0f8CD185A',
    symbol: 'YSFRAX6MJD',
    baseId: FRAX,
    name: 'Yield Strategy FRAX 6M Jun Dec',
    decimals: 18,
    version: '1',
  },

  {
    id: '0x10A0FF000FFE',
    address: '0x428e229ac5bc52a2e07c379b2f486fefefd674b1',
    type: StrategyType.V2,
    symbol: 'YSUSDT6MJD',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Jun Dec',
    decimals: 6,
    version: '1',
  },

  {
    id: '0x10A0FF000FFF',
    address: '0xf708005cee17b2c5fe1a01591e32ad6183a12eae',
    type: StrategyType.V2,
    symbol: 'YSUSDT6MMS',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Mar Sep',
    decimals: 6,
    version: '1',
  },

  {
    id: '',
    address: '0xa6dbc40c75037895dee8d2415f1ce9e0fb08cf49',
    associatedStrategy: '0x7ACFe277dEd15CabA6a8Da2972b1eb93fe1e2cCD',
    type: StrategyType.V2,
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0x59e9db2c8995ceeaf6a9ad0896601a5d3289444e',
    associatedStrategy: '0xFBc322415CBC532b54749E31979a803009516b5D',
    type: StrategyType.V2,
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
  },
  {
    id: '',
    address: '0x11f30c6b1173ec6e0a6d622c8f17eef3dc593764',
    associatedStrategy: '0xcf30A5A994f9aCe5832e30C138C9697cda5E1247',
    type: StrategyType.V2,
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
  },

  {
    id: '',
    address: '0x93dEe161a396aF75c7458a65687895299bFeB437',
    associatedStrategy: '0x1565f539e96c4d440c38979dbc86fd711c995dd6',
    type: StrategyType.V2,
    symbol: 'YSFRAX6MMS',
    baseId: FRAX,
    name: 'Yield Strategy FRAX 6M Mar Sep',
    decimals: 18,
    version: '1',
  },

  /// New JD STRATEGIES ///
  {
    id: '0x1030FF000000',
    address: '0xFcFc74fA508450C8Ff681E6894Ab2C9852bD32a7',
    // associatedStrategy: '',
    type: StrategyType.V2,
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '0x1031FF000000',
    address: '0x742b05A7AF59C31576E4f31B092Caff580B162C3',
    // associatedStrategy: '',
    type: StrategyType.V2,
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M June Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '0x1032FF000000',
    address: '0x3e63834310D771d6157706c37778FB1B53eAf6F2',
    // associatedStrategy: '',
    type: StrategyType.V2,
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    version: '1',
  },
  {
    id: '0x10A0FF000000',
    address: '0x45eB9E5c68A078BfC92F3d46592E0E35a732F7aC',
    type: StrategyType.V2,
    symbol: 'YSUSDT6MJD',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Jun Dec',
    decimals: 6,
    version: '1',
  },

  // New MS Strategies
  {
    id: '0x10A0FF000001',
    address: '0xB3E47e689D21d75303E28884187a5681cEfaf40B',
    type: StrategyType.V2,
    symbol: 'YSUSDT6MMS',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Mar Sep',
    decimals: 6,
    version: '1',
  },
  {
    id: '0x1031FF000001',
    address: '0x2008E463c4d0364763569dFE16cdF4E6F29bCe8E',
    // associatedStrategy: '0x7ACFe277dEd15CabA6a8Da2972b1eb93fe1e2cCD',
    type: StrategyType.V2,
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
  },
  {
    id: '0x1032FF000001',
    address: '0x85fA3071AD36d12603176C12118d25602D2229aB',
    // associatedStrategy: '0xFBc322415CBC532b54749E31979a803009516b5D',
    type: StrategyType.V2,
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
  },
  {
    id: '0x1030FF000001',
    address: '0x51D2fCCcC9003f0743bfAa4E495cda5BBA749283',
    // associatedStrategy: '0xcf30A5A994f9aCe5832e30C138C9697cda5E1247',
    type: StrategyType.V2,
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
  },

]);

STRATEGIES.set(42161, [
  {
    id: '',
    address: '0xE779cd75E6c574d83D3FD6C92F3CBE31DD32B1E1',
    associatedStrategy: '0x5aeB4EFaAA0d27bd606D618BD74Fe883062eAfd0',
    type: StrategyType.V1,
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0x92A5B31310a3ED4546e0541197a32101fCfBD5c8',
    associatedStrategy: '0x3b4FFD93CE5fCf97e61AA8275Ec241C76cC01a47',
    type: StrategyType.V1,
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
  },
  {
    id: '',
    address: '0xD5B43b2550751d372025d048553352ac60f27151',
    associatedStrategy: '0x5582b8398FB586F1b79edd1a6e83f1c5aa558955',
    type: StrategyType.V1,
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0xa3cAF61FD23d374ce13c742E4E9fA9FAc23Ddae6',
    associatedStrategy: '0x4276BEaA49DE905eED06FCDc0aD438a19D3861DD',
    type: StrategyType.V1,
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0x54F08092e3256131954dD57C04647De8b2E7A9a9',
    associatedStrategy: '0x33e6B154efC7021dD55464c4e11a6AfE1f3D0635',
    type: StrategyType.V1,
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    version: '1',
  },
  {
    id: '',
    address: '0x3353E1E2976DBbc191a739871faA8E6E9D2622c7',
    associatedStrategy: '0xad1983745D6c739537fEaB5bed45795f47A940b3',
    type: StrategyType.V1,
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
  },

  //V2 Strategies
  {
    id: '',
    address: '0xad1983745D6c739537fEaB5bed45795f47A940b3',
    type: StrategyType.V2,
    associatedStrategy: '0x3353E1E2976DBbc191a739871faA8E6E9D2622c7',
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0x4276BEaA49DE905eED06FCDc0aD438a19D3861DD',
    type: StrategyType.V2,
    associatedStrategy: '0xa3cAF61FD23d374ce13c742E4E9fA9FAc23Ddae6',
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0x33e6B154efC7021dD55464c4e11a6AfE1f3D0635',
    associatedStrategy: '0x54F08092e3256131954dD57C04647De8b2E7A9a9',
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    type: StrategyType.V2,
    version: '1',
  },

  {
    id: '',
    address: '0x861509a3fa7d87faa0154aae2cb6c1f92639339a',
    type: StrategyType.V2,
    symbol: 'YSUSDT6MJD',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Jun Dec',
    decimals: 6,
    version: '1',
  },

  {
    id: '',
    address: '0xfe2aba5ba890af0ee8b6f2d488b1f85c9e7c5643',
    type: StrategyType.V2,
    symbol: 'YSUSDT6MMS',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Mar Sep',
    decimals: 6,
    version: '1',
  },

  {
    id: '',
    address: '0x3b4FFD93CE5fCf97e61AA8275Ec241C76cC01a47',
    type: StrategyType.V2,
    associatedStrategy: '0x92A5B31310a3ED4546e0541197a32101fCfBD5c8',
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
  },
  {
    id: '',
    address: '0x5582b8398FB586F1b79edd1a6e83f1c5aa558955',
    type: StrategyType.V2,
    associatedStrategy: '0xD5B43b2550751d372025d048553352ac60f27151',
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0x5aeB4EFaAA0d27bd606D618BD74Fe883062eAfd0',
    type: StrategyType.V2,
    associatedStrategy: '0xE779cd75E6c574d83D3FD6C92F3CBE31DD32B1E1',
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
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
