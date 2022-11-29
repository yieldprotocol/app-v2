interface StrategyInfo {
  address: string;
  type: 'V1' | 'V2';
  associatedStrategy?: string; // if V2 strategy, then the V1 associated strategy (and vice versa)
}

// map each chain id to its corresponding strategies' data
const STRATEGIES = new Map<number, StrategyInfo[]>();

STRATEGIES.set(1, [
  { address: '0x7ACFe277dEd15CabA6a8Da2972b1eb93fe1e2cCD', type: 'V1' },
  {
    address: '0x1144e14E9B0AA9e181342c7e6E0a9BaDB4ceD295',
    type: 'V1',
    associatedStrategy: '0x298F6A44bDFE462b6035B099105CA32F71b4C74B',
  },
  {
    type: 'V2',
    address: '0x298F6A44bDFE462b6035B099105CA32F71b4C74B',
    associatedStrategy: '0x1144e14E9B0AA9e181342c7e6E0a9BaDB4ceD295',
  },

  { address: '0xFBc322415CBC532b54749E31979a803009516b5D', type: 'V1' },
  {
    address: '0x8e8D6aB093905C400D583EfD37fbeEB1ee1c0c39',
    type: 'V1',
    associatedStrategy: '0x3EE06a8feEe8018d5Fe275e6Ac050bADD03a305b',
  },
  {
    address: '0x3EE06a8feEe8018d5Fe275e6Ac050bADD03a305b',
    type: 'V2',
    associatedStrategy: '0x8e8D6aB093905C400D583EfD37fbeEB1ee1c0c39',
  },
  { address: '0xcf30A5A994f9aCe5832e30C138C9697cda5E1247', type: 'V1' },
  {
    address: '0x831dF23f7278575BA0b136296a285600cD75d076',
    type: 'V1',
    associatedStrategy: '0x5915b60689a4693ae2B35620A519dA2EDc16DE51',
  },
  {
    associatedStrategy: '0x831dF23f7278575BA0b136296a285600cD75d076',
    type: 'V2',
    address: '0x5915b60689a4693ae2B35620A519dA2EDc16DE51',
  },
  {
    address: '0xbD6277E36686184A5343F83a4be5CeD0f8CD185A',
    type: 'V1',
    associatedStrategy: '0xE58D899B4F6FF23d66aD88F117EeAC07505Fe068',
  },
  {
    associatedStrategy: '0xbD6277E36686184A5343F83a4be5CeD0f8CD185A',
    type: 'V2',
    address: '0xE58D899B4F6FF23d66aD88F117EeAC07505Fe068',
  },
  { address: '0x1565f539e96c4d440c38979dbc86fd711c995dd6', type: 'V1' },
]);

STRATEGIES.set(42161, [
  { address: '0xE779cd75E6c574d83D3FD6C92F3CBE31DD32B1E1', type: 'V1' },
  { address: '0x92A5B31310a3ED4546e0541197a32101fCfBD5c8', type: 'V1' },
  { address: '0xD5B43b2550751d372025d048553352ac60f27151', type: 'V1' },
  { address: '0xa3cAF61FD23d374ce13c742E4E9fA9FAc23Ddae6', type: 'V1' },
  { address: '0x54F08092e3256131954dD57C04647De8b2E7A9a9', type: 'V1' },
  { address: '0x3353E1E2976DBbc191a739871faA8E6E9D2622c7', type: 'V1' },
]);

export default STRATEGIES;
