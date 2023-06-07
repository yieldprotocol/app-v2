import daiJuneMerkle from './dai-june-tree.json';
import daiMarchMerkle from './dai-march-tree.json';
import ethJuneMerkle from './eth-june-tree.json';
import ethMarchMerkle from './eth-march-tree.json';
import usdcJuneMerkle from './usdc-june-tree.json';
import usdcMarchMerkle from './usdc-march-tree.json';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';

export type MerkleData = typeof daiJuneMerkle;

const daiJune = StandardMerkleTree.load(daiJuneMerkle);
const daiMarch = StandardMerkleTree.load(daiMarchMerkle);
const ethJune = StandardMerkleTree.load(ethJuneMerkle);
const ethMarch = StandardMerkleTree.load(ethMarchMerkle);
const usdcJune = StandardMerkleTree.load(usdcJuneMerkle);
const usdcMarch = StandardMerkleTree.load(usdcMarchMerkle);

export const TREES: Map<string, StandardMerkleTree<string[]>> = new Map([
  ['dai-june', daiJune],
  ['dai-march', daiMarch],
  ['eth-june', ethJune],
  ['eth-march', ethMarch],
  ['usdc-june', usdcJune],
  ['usdc-march', usdcMarch],
]);
