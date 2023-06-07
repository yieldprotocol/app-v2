import daiJuneMerkle from './dai-june-tree.json';
import daiMarchMerkle from './dai-march-tree.json';
import ethJuneMerkle from './eth-june-tree.json';
import ethMarchMerkle from './eth-march-tree.json';
import usdcJuneMerkle from './usdc-june-tree.json';
import usdcMarchMerkle from './usdc-march-tree.json';

type MerkleData = typeof daiJuneMerkle;

const TREES: Map<string, MerkleData> = new Map([
  ['dai-june', daiJuneMerkle],
  ['dai-march', daiMarchMerkle],
  ['eth-june', ethJuneMerkle],
  ['eth-march', ethMarchMerkle],
  ['usdc-june', usdcJuneMerkle],
  ['usdc-march', usdcMarchMerkle],
]);

export default TREES;
