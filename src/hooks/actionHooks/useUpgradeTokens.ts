import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { useChain } from '../useChain';
import useAccountPlus from '../useAccountPlus';
import useContracts from '../useContracts';
import { useProvider, useBalance } from 'wagmi';
import { Contract } from 'ethers';
import { TokenUpgrade__factory } from '../../contracts';

import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { MerkleTree } from 'merkletreejs';
import { utils } from 'ethers';

import { TREES, MerkleData } from '../../config/trees/trees';

export const useUpgradeTokens = () => {
  const { address } = useAccountPlus();
  const provider = useProvider();

  const [addressProofs, setAddressProofs] = useState<Map<string, string[][]> | null>(null);

  useEffect(() => {
    console.log('is this firing?');
    if (address && !addressProofs?.size) {
      const userCanUpgrade = searchMerkleTrees(address);
    }
  }, [address, addressProofs?.size]);

  const upgradeTokenAddr = '0xb862b371Dc7944c3323b3029c908ED22c257d108';

  const tester = '0xfc282d2bfc0b38a93034ad06dc467c2b1a768e32';

  console.log('TREES', TREES);

  const searchMerkleTrees = (address: string): Map<string, string[][]> => {
    const matchingProofs: Map<string, string[][]> = new Map();

    for (const [treeName, tree] of TREES) {
      const entries = tree.entries();
      for (const [index, value] of entries) {
        if (value.includes(address)) {
          const proof = tree.getProof(index);
          const existingProofs = matchingProofs.get(treeName) || [];
          matchingProofs.set(treeName, [...existingProofs, proof]);
          console.log('Tree:', treeName);
          console.log('Value:', value);
          console.log('Proof:', proof);
        }
      }
    }
    setAddressProofs(matchingProofs);
    return matchingProofs;
  };

  // console.log('tester', searchMerkleTrees(tester));

  const upgradeTokens = async (termsAccepted: boolean) => {
    console.log('in upgradeTokens', termsAccepted);

    // return if terms not accepted
    if (!termsAccepted) return;
    const termsHash = termsAccepted ? '0x9f6699a0964b1bd6fe6c9fb8bebea236c08311ddd25781bbf5d372d00d32936b' : '';

    const upgradeContract = TokenUpgrade__factory.connect(upgradeTokenAddr, provider);
  };

  return { upgradeTokens, searchMerkleTrees, addressProofs };
};

export default useUpgradeTokens;
