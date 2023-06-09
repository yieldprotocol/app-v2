import { ethers, BigNumberish, BigNumber } from 'ethers';
import { useState, useEffect } from 'react';

import useAccountPlus from '../useAccountPlus';
import { useProvider, useSigner } from 'wagmi';
import { TokenUpgrade__factory } from '../../contracts';
import { toast } from 'react-toastify';

import { TREES } from '../../config/trees/trees';

enum TokenAddress {
  ETH_March = '0xcf30a5a994f9ace5832e30c138c9697cda5e1247',
  ETH_June = '0x831df23f7278575ba0b136296a285600cd75d076',
  USDC_March = '0xfbc322415cbc532b54749e31979a803009516b5d',
  USDC_June = '0x8e8d6ab093905c400d583efd37fbeeb1ee1c0c39',
  DAI_March = '0x7acfe277ded15caba6a8da2972b1eb93fe1e2ccd',
  DAI_June = '0x1144e14e9b0aa9e181342c7e6e0a9badb4ced295',
}

export const useUpgradeTokens = () => {
  const tester = '0xfc282d2bfc0b38a93034ad06dc467c2b1a768e32'; // addr to test with

  const { address } = useAccountPlus();
  const provider = useProvider();
  const { data: signer } = useSigner();

  const balances = new Map<string, BigNumberish | undefined>();

  const [addressProofs, setAddressProofs] = useState<Map<string, string[][]> | null>(null);

  useEffect(() => {
    console.log('is this firing?');
    if (address && !addressProofs?.size) {
      const userCanUpgrade = searchMerkleTrees(address);
    }
  }, [address, addressProofs?.size]);

  const upgradeTokenAddr = '0x9Ca89fC21fdbdE431Df9080426F7B630012FE551';

  const searchMerkleTrees = (address: string): Map<string, string[]> => {
    const matchingProofs: Map<string, string[]> = new Map();

    for (const [treeName, tree] of TREES) {
      const entries = tree.entries();
      for (const [index, value] of entries) {
        if (value.includes(address)) {
          const proof = tree.getProof(index);
          matchingProofs.set(treeName, [...proof]);

          balances.set(treeName, value[1]);

          console.log('Tree:', treeName);
          console.log('Value:', value);
          console.log('Proof:', proof);
          console.log('Balances:', balances);
        }
      }
    }
    // setAddressProofs(matchingProofs);
    console.log('matchingProofs', matchingProofs);
    return matchingProofs;
  };

  const upgradeTokens = async (termsAccepted: boolean) => {
    // return if terms not accepted
    if (!termsAccepted) return;
    const tosHash = termsAccepted ? '0x9f6699a0964b1bd6fe6c9fb8bebea236c08311ddd25781bbf5d372d00d32936b' : '';

    const acceptanceToken = ethers.utils.keccak256(
      ethers.utils.concat([ethers.utils.arrayify(address), ethers.utils.arrayify(tosHash)])
    );

    const proofMap = searchMerkleTrees(address);

    for (const [tokenAddress, proof] of proofMap.entries()) {
      try {
        // Retrieve the balance for the token address from the balance map
        // const balanceData = balances.get(tokenAddress);
        const balanceData = BigNumber.from('929712163700000000000');
        const upgradeContract = TokenUpgrade__factory.connect(upgradeTokenAddr, signer);

        // Ensure balance data is available
        if (balanceData === undefined) {
          console.warn('Balance data not available for token:', tokenAddress);
          continue;
        }

        const upgradeTx = await upgradeContract.upgrade(tokenAddress, acceptanceToken, tester, balanceData, proof, {
          gasLimit: 500000,
        });
        await upgradeTx.wait();

        console.log('Token upgrade successful for token:', tokenAddress);
        toast.success('Token upgrade successful');
      } catch (error) {
        console.error('Error upgrading tokens for token:', tokenAddress, error);
        toast.error('Error upgrading tokens');
      }
    }
  };

  return { upgradeTokens, searchMerkleTrees, addressProofs };
};

export default useUpgradeTokens;
