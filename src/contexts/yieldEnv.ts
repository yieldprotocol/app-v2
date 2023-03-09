import { Contract } from 'ethers';

export enum ContractNames {
  CAULDRON = 'Cauldron',
  WITCH = 'Witch',
  WITCHV2 = 'WitchV2',
  LADLE = 'Ladle',
  WRAP_ETHER_MODULE = 'WrapEtherModule',
  CONVEX_LADLE_MODULE = 'ConvexLadleModule',
  TRANSFER_1155_MODULE = 'Transfer1155Module',
}

export type ContractMap = Map<ContractNames, Contract>;

interface YieldEnv {
  addresses: Map<number, Map<ContractNames, string>>;
}

const yieldEnv: YieldEnv = {
  addresses: new Map([
    [
      1,
      new Map([
        [ContractNames.CAULDRON, '0xc88191F8cb8e6D4a668B047c1C8503432c3Ca867'],
        [ContractNames.LADLE, '0x6cB18fF2A33e981D1e38A663Ca056c0a5265066A'],
        [ContractNames.WITCH, '0x53C3760670f6091E1eC76B4dd27f73ba4CAd5061'],
        [ContractNames.WITCHV2, '0x08d2f5c96bb1f6be04b49bcd869d5af01db4c400'],
        [ContractNames.TRANSFER_1155_MODULE, '0x97f1d43A217aDD678bB6Dcd3C5D51F40b6729d06'],
        [ContractNames.WRAP_ETHER_MODULE, '0x22768FCaFe7BB9F03e31cb49823d1Ece30C0b8eA'],
        [ContractNames.CONVEX_LADLE_MODULE, '0x9Bf195997581C99cef8be95a3a816Ca19Cf1A3e6'],
      ]),
    ],
    [
      42161,
      new Map([
        [ContractNames.CAULDRON, '0x23cc87FBEBDD67ccE167Fa9Ec6Ad3b7fE3892E30'],
        [ContractNames.LADLE, '0x16E25cf364CeCC305590128335B8f327975d0560'],
        [ContractNames.WITCH, '0x08173D0885B00BDD640aaE57D05AbB74cd00d669'],
        [ContractNames.WITCHV2, '0x07c2c74811cb14a5003c3ccff7ec436d504fffb6'],
        [ContractNames.WRAP_ETHER_MODULE, '0x4cd01ed221d6d198e2656c16c32803bf78134568'],
      ]),
    ],
  ]),
};

export default yieldEnv;
