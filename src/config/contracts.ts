import { Contract } from 'ethers';

export enum ContractNames {
  CAULDRON = 'Cauldron',
  VR_CAULDRON = 'VRCauldron',
  WITCH = 'Witch',
  VR_WITCH = 'VRWitch',
  WITCHV2 = 'WitchV2',
  LADLE = 'Ladle',
  VR_LADLE = 'VRLadle',
  WRAP_ETHER_MODULE = 'WrapEtherModule',
  CONVEX_LADLE_MODULE = 'ConvexLadleModule',
  TRANSFER_1155_MODULE = 'Transfer1155Module',
}

export type ContractMap = Map<ContractNames, Contract>;

interface ContractAddresses {
  addresses: Map<number, Map<ContractNames, string>>;
}

export const contractAddresses: ContractAddresses = {
  addresses: new Map([
    [
      1,
      new Map([
        [ContractNames.CAULDRON, '0xc88191F8cb8e6D4a668B047c1C8503432c3Ca867'],
        [ContractNames.VR_CAULDRON, '0x567758c5f081B0E8596Ef3Ecd5B9bf83265F6B97'],
        [ContractNames.LADLE, '0x6cB18fF2A33e981D1e38A663Ca056c0a5265066A'],
        [ContractNames.VR_LADLE, '0x726385Cc84389831956f4dE883aB6001b9aDB91a'],
        [ContractNames.VR_WITCH, '0xc508Ee2FF40fA6C33d3D333661028f1EfA68277A'],
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
        [ContractNames.VR_CAULDRON, '0x51453309441579de245a9e99800b6b7f19e48e1a'],
        [ContractNames.VR_WITCH, '0x090e8a0fc6df49f25c3f619bc3bc1cc6d6150b45'],
        [ContractNames.VR_LADLE, '0x2ad615c6a63186d4fe24fa6a82277832a7468601'],
      ]),
    ],
  ]),
};

export default contractAddresses;
