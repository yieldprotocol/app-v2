import { BaseProvider } from '@ethersproject/providers';
import { Strategy__factory } from '../contracts';
import { DAI, FRAX, USDC, WETH, USDT } from './assets';

export enum StrategyType {
  V1 = 'V1',
  V2 = 'V2',
  V2_1 = 'V2.1',
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
  active?:boolean;
}

// map each chain id to its corresponding strategies' data
const STRATEGIES = new Map<number, StrategyInfo[]>();

STRATEGIES.set(1, [
  /* V1 strategies */
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
  // V2.1 strategies
  {
    id: '',
    address: '0x96b87c0aacb01a09c0de249238d56c6d3a9629a8', //
    type: StrategyType.V2_1,
    associatedStrategy: '0x5aeB4EFaAA0d27bd606D618BD74Fe883062eAfd0', // v2 strat
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0x29a98294d9da369458d33ed9dd69f0dd36f14484', //
    type: StrategyType.V2_1,
    associatedStrategy: '0xfe2aba5ba890af0ee8b6f2d488b1f85c9e7c5643', // v2 strat
    symbol: 'YSUSDT6MMS',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Mar Sep',
    decimals: 6,
    version: '1',
  },
  {
    id: '',
    address: '0xbd54fa0318f8337023548f42566637ebcc57fb51', //
    associatedStrategy: '0x33e6B154efC7021dD55464c4e11a6AfE1f3D0635', // v2 strat
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    type: StrategyType.V2_1,
    version: '1',
  },
  {
    id: '',
    address: '0xf5fd98286fd9d3d94cd63098cc3ce0df5891de73', //
    type: StrategyType.V2_1,
    associatedStrategy: '0x861509a3fa7d87faa0154aae2cb6c1f92639339a', // v2 strat
    symbol: 'YSUSDT6MJD',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Jun Dec',
    decimals: 6,
    version: '1',
  },
  {
    id: '',
    address: '0xd9446472697d0616a0183dad96567bbe5edd1dd4', //
    type: StrategyType.V2_1,
    associatedStrategy: '0x3b4FFD93CE5fCf97e61AA8275Ec241C76cC01a47', // v2 strat
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
  },
  {
    id: '',
    address: '0xfab75a23dd3ecc91d866cb151cee7830857f49cc', //
    type: StrategyType.V2_1,
    associatedStrategy: '0x5582b8398FB586F1b79edd1a6e83f1c5aa558955', // v2 strat
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0xc315b7b54b496b0d986684f4682e1d7acfb997e9', //
    type: StrategyType.V2_1,
    associatedStrategy: '0xad1983745D6c739537fEaB5bed45795f47A940b3', // v2 strat
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '',
    address: '0x38069499bd940ce637b3ed19c2cbc9df498d90d5', //
    type: StrategyType.V2_1,
    associatedStrategy: '0x4276BEaA49DE905eED06FCDc0aD438a19D3861DD', // v2 strat
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
  },

  /*
    v1 have an associatedStrategy to a v2 strategy, 
    v2 have an associated strategy to a v1 strategy,
    v2.1 have an associated strategy to a v2 strategy
    is this right?
  */
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
