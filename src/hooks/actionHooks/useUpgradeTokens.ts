import { ethers } from 'ethers';
import { useChain } from '../useChain';
import useAccountPlus from '../useAccountPlus';
import useContracts from '../useContracts';
import { useProvider, useBalance } from 'wagmi';
import { Contract } from 'ethers';
import { TokenUpgrade__factory } from '../../contracts';

import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { MerkleTree } from 'merkletreejs';
import { utils } from 'ethers';

import TREES from '../../config/trees/trees';

export const useUpgradeTokens = () => {
  const { address: account } = useAccountPlus();
  const provider = useProvider();

  const upgradeTokenAddr = '0xb862b371Dc7944c3323b3029c908ED22c257d108';

  const upgradeTokens = async (termsAccepted: boolean) => {
    console.log('in upgradeTokens', termsAccepted);

    // return if terms not accepted
    if (!termsAccepted) return;
    const termsHash = termsAccepted ? '0x9f6699a0964b1bd6fe6c9fb8bebea236c08311ddd25781bbf5d372d00d32936b' : '';

    const upgradeContract = TokenUpgrade__factory.connect(upgradeTokenAddr, provider);
  };

  return { upgradeTokens };
};

export default useUpgradeTokens;
