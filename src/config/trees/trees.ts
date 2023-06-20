import { Address } from 'wagmi';
import daiJuneMerkle from './trees-new/dai-june-v2-tree.json';
import daiMarchMerkle from './trees-new/dai-march-v1-tree.json';
import ethJuneMerkle from './trees-new/eth-june-v2-tree.json';
import ethMarchMerkle from './trees-new/eth-march-v1-tree.json';
import usdcJuneMerkle from './trees-new/usdc-june-v2-tree.json';
import usdcMarchMerkle from './trees-new/usdc-march-v1-tree.json';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { BigNumber } from 'ethers';

// token addresses for reference
enum TokenAddressesV1 {
  ETH_March = '0xcf30a5a994f9ace5832e30c138c9697cda5e1247',
  ETH_June = '0x831df23f7278575ba0b136296a285600cd75d076',
  USDC_March = '0xfbc322415cbc532b54749e31979a803009516b5d',
  USDC_June = '0x8e8d6ab093905c400d583efd37fbeeb1ee1c0c39',
  DAI_March = '0x7acfe277ded15caba6a8da2972b1eb93fe1e2ccd',
  DAI_June = '0x1144e14e9b0aa9e181342c7e6e0a9badb4ced295',
}

enum TokenAddressesV2 {
  ETH_June = '0xb268E2C85861B74ec75fe728Ae40D9A2308AD9Bb',
  USDC_June = '0x5dd6DcAE25dFfa0D46A04C9d99b4875044289fB2',
  DAI_June = '0x9ca2a34ea52bc1264D399aCa042c0e83091FEECe',
}

// for each tree
// assess whether tree corresponds to a v1 token balance (march trees can call upgrade directly)
// get the user's v1 balance
// burn the v1 balance for v2
// fetch the v2 token balance (includes the newly burned v1 tokens {was burned to v2})
// upgrade using the lesser of the tree balance or fetched balance

export enum TREE_NAMES {
  DAI_JUNE_V2 = 'dai-june-v2',
  DAI_MARCH_V1 = 'dai-march-v1',
  ETH_JUNE_V2 = 'eth-june-v2',
  ETH_MARCH_V1 = 'eth-march-v1',
  USDC_JUNE_V2 = 'usdc-june-v2',
  USDC_MARCH_V1 = 'usdc-march-v1',
}

interface TreeData {
  treeName: TREE_NAMES;
  tree: StandardMerkleTree<string[]>;
  proofs?: string[]; // uninitialized to start
  treeBalance?: BigNumber; // the upgradeable token amount in the tree data; uninitialized to start
  v1TokenAddress: Address;
  v2TokenAddress?: Address; // march v1 strategies don't have a corresponding v2 strategy
}

export interface TreeDataAsync extends TreeData {
  upgradeableBalance: BigNumber;
  v1StrategyBal: BigNumber;
  v2StrategyBal: BigNumber;
}

export type TreeMap = Map<TREE_NAMES, TreeData>;
export type TreeMapAsync = Map<TREE_NAMES, TreeDataAsync>;

// interface for merkle tree data directly from openzeppelin
interface StandardMerkleTreeData<T extends any[]> {
  format: 'standard-v1';
  tree: string[];
  values: {
    value: T;
    treeIndex: number;
  }[];
  leafEncoding: string[];
}

const daiJuneMerkle_ = daiJuneMerkle as StandardMerkleTreeData<string[]>;
const daiMarchMerkle_ = daiMarchMerkle as StandardMerkleTreeData<string[]>;
const ethJuneMerkle_ = ethJuneMerkle as StandardMerkleTreeData<string[]>;
const ethMarchMerkle_ = ethMarchMerkle as StandardMerkleTreeData<string[]>;
const usdcJuneMerkle_ = usdcJuneMerkle as StandardMerkleTreeData<string[]>;
const usdcMarchMerkle_ = usdcMarchMerkle as StandardMerkleTreeData<string[]>;

const daiJune = StandardMerkleTree.load(daiJuneMerkle_);
const daiMarch = StandardMerkleTree.load(daiMarchMerkle_);
const ethJune = StandardMerkleTree.load(ethJuneMerkle_);
const ethMarch = StandardMerkleTree.load(ethMarchMerkle_);
const usdcJune = StandardMerkleTree.load(usdcJuneMerkle_);
const usdcMarch = StandardMerkleTree.load(usdcMarchMerkle_);

export const TREES: TreeMap = new Map();

TREES.set(TREE_NAMES.DAI_JUNE_V2, {
  treeName: TREE_NAMES.DAI_JUNE_V2,
  tree: daiJune,
  v1TokenAddress: '0x1144e14e9b0aa9e181342c7e6e0a9badb4ced295',
  v2TokenAddress: '0x9ca2a34ea52bc1264D399aCa042c0e83091FEECe',
});

TREES.set(TREE_NAMES.DAI_MARCH_V1, {
  treeName: TREE_NAMES.DAI_MARCH_V1,
  tree: daiMarch,
  v1TokenAddress: '0x7acfe277ded15caba6a8da2972b1eb93fe1e2ccd',
});

TREES.set(TREE_NAMES.ETH_JUNE_V2, {
  treeName: TREE_NAMES.ETH_JUNE_V2,
  tree: ethJune,
  v1TokenAddress: '0x831df23f7278575ba0b136296a285600cd75d076',
  v2TokenAddress: '0xb268E2C85861B74ec75fe728Ae40D9A2308AD9Bb',
});

TREES.set(TREE_NAMES.ETH_MARCH_V1, {
  treeName: TREE_NAMES.ETH_MARCH_V1,
  tree: ethMarch,
  v1TokenAddress: '0xcf30a5a994f9ace5832e30c138c9697cda5e1247',
});

TREES.set(TREE_NAMES.USDC_JUNE_V2, {
  treeName: TREE_NAMES.USDC_JUNE_V2,
  tree: usdcJune,
  v1TokenAddress: '0x8e8d6ab093905c400d583efd37fbeeb1ee1c0c39',
  v2TokenAddress: '0x5dd6DcAE25dFfa0D46A04C9d99b4875044289fB2',
});

TREES.set(TREE_NAMES.USDC_MARCH_V1, {
  treeName: TREE_NAMES.USDC_MARCH_V1,
  tree: usdcMarch,
  v1TokenAddress: '0xfbc322415cbc532b54749e31979a803009516b5d',
});
