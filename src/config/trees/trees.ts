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
  ['0x1144e14e9b0aa9e181342c7e6e0a9badb4ced295', daiJune],
  ['0x7acfe277ded15caba6a8da2972b1eb93fe1e2ccd', daiMarch],
  ['0x831df23f7278575ba0b136296a285600cd75d076', ethJune],
  ['0xcf30a5a994f9ace5832e30c138c9697cda5e1247', ethMarch],
  ['0x8e8d6ab093905c400d583efd37fbeeb1ee1c0c39', usdcJune],
  ['0xfbc322415cbc532b54749e31979a803009516b5d', usdcMarch],
]);
