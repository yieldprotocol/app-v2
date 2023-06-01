import { BaseProvider } from '@ethersproject/providers';
import { Strategy__factory } from '../contracts';
import { DAI, FRAX, USDC, WETH, USDT } from './assets';

export enum StrategyType {
  V1 = 'V1',
  V2 = 'V2',
  V2_1 = 'V2_1',
}

export type AssociatedStrategy = {
  [value in StrategyType]?: string;
};

export interface StrategyInfo {
  id: string;
  address: string;
  type: StrategyType;
  associatedStrategy?: AssociatedStrategy; // if V2 strategy, then the V1 associated strategy (and vice versa)
  symbol?: string;
  name?: string;
  baseId?: string;
  decimals?: number;
  version?: string;
  active?: boolean;
}

// map each chain id to its corresponding strategies' data
const STRATEGIES = new Map<number, StrategyInfo[]>();

STRATEGIES.set(1, [
  /* V1 strategies */
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
  },

  //V2 Strategies
  {
    id: '0x1030FF000FFE',
    address: '0xad1983745D6c739537fEaB5bed45795f47A940b3',
    type: StrategyType.V2,
    associatedStrategy: { V2_1: '0xC7D2E96Ca94E1870605c286268313785886D2257' },
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '0x1031FF000FFE',
    address: '0x4276BEaA49DE905eED06FCDc0aD438a19D3861DD',
    type: StrategyType.V2,
    associatedStrategy: { V2_1: '0x9847D09cb0eEA77f7875A6904BFA22AE06b34CCE' },
    symbol: 'YSDAI6MJD',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '0x1032FF000FFE',
    address: '0x33e6B154efC7021dD55464c4e11a6AfE1f3D0635',
    associatedStrategy: { V2_1: '0xCeAf1CBf0CFDD1f7Ea4C1C850c0bC032a60431DB' },
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    type: StrategyType.V2,
    version: '1',
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
  },

  {
    id: '0x10A0FF000FFF',
    address: '0xfe2aba5ba890af0ee8b6f2d488b1f85c9e7c5643',
    associatedStrategy : { V2_1: '0x2C918C4db3843F715556c65646f9E4a04C4BfBa6'},
    type: StrategyType.V2,
    symbol: 'YSUSDT6MMS',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Mar Sep',
    decimals: 6,
    version: '1',
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
  },

  // V2.1 strategies
  {
    id: '0x1031FF000001',
    address: '0x4771522accAC6fEcf89A6365cEaF05667ed95886', //
    type: StrategyType.V2_1,
    symbol: 'YSDAI6MMS',
    baseId: DAI,
    name: 'Yield Strategy DAI 6M Mar Sep',
    decimals: 18,
    version: '1',
  },
  {
    id: '0x10A0FF000001',
    address: '0x2C918C4db3843F715556c65646f9E4a04C4BfBa6', //
    type: StrategyType.V2_1,
    symbol: 'YSUSDT6MMS',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Mar Sep',
    decimals: 6,
    version: '1',
  },
  {
    id: '0x1032FF000000',
    address: '0xCeAf1CBf0CFDD1f7Ea4C1C850c0bC032a60431DB', //
    symbol: 'YSUSDC6MJD',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Jun Dec',
    decimals: 6,
    type: StrategyType.V2_1,
    version: '1',
  },
  {
    id: '0x10A0FF000000',
    address: '0x8b814aD71e611e7a38eE64Ec16ce421A477956e1', //
    type: StrategyType.V2_1,
    symbol: 'YSUSDT6MJD',
    baseId: USDT,
    name: 'Yield Strategy USDT 6M Jun Dec',
    decimals: 6,
    version: '1',
  },
  {
    id: '0x1032FF000001',
    address: '0x7012aF43F8a3c1141Ee4e955CC568Ad2af59C3fa', //
    type: StrategyType.V2_1,
    symbol: 'YSUSDC6MMS',
    baseId: USDC,
    name: 'Yield Strategy USDC 6M Mar Sep',
    decimals: 6,
    version: '1',
  },
  {
    id: '0x1030FF000001',
    address: '0x0A4B2e37BFEF8e54DeA997A87749A403353134e8', //
    type: StrategyType.V2_1,
    symbol: 'YSETH6MMS',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Mar Sep',
    decimals: 18,
    version: '1',
  },
  {
    id: '0x1030FF000000',
    address: '0xC7D2E96Ca94E1870605c286268313785886D2257', //
    type: StrategyType.V2_1,
    symbol: 'YSETH6MJD',
    baseId: WETH,
    name: 'Yield Strategy ETH 6M Jun Dec',
    decimals: 18,
    version: '1',
  },
  {
    id: '0x1031FF000000',
    address: '0x9847D09cb0eEA77f7875A6904BFA22AE06b34CCE', //
    type: StrategyType.V2_1,
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
