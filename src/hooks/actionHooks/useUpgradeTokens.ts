import { ethers, BigNumberish, BigNumber } from 'ethers';
import { useState, useEffect, useMemo, useCallback } from 'react';

import useAccountPlus from '../useAccountPlus';
import { useSigner } from 'wagmi';
import { ERC20__factory, TokenUpgrade__factory } from '../../contracts';
import { toast } from 'react-toastify';

import { TREES } from '../../config/trees/trees';
import useFork from '../useFork';

enum TokenAddress {
  ETH_March = '0xcf30a5a994f9ace5832e30c138c9697cda5e1247',
  ETH_June = '0x831df23f7278575ba0b136296a285600cd75d076',
  USDC_March = '0xfbc322415cbc532b54749e31979a803009516b5d',
  USDC_June = '0x8e8d6ab093905c400d583efd37fbeeb1ee1c0c39',
  DAI_March = '0x7acfe277ded15caba6a8da2972b1eb93fe1e2ccd',
  DAI_June = '0x1144e14e9b0aa9e181342c7e6e0a9badb4ced295',
}

const UPGRADE_TOKEN_ADDRESS = '0x9Ca89fC21fdbdE431Df9080426F7B630012FE551';
const TOS_HASH = '0x9f6699a0964b1bd6fe6c9fb8bebea236c08311ddd25781bbf5d372d00d32936b';

export const useUpgradeTokens = () => {
  const { address: account } = useAccountPlus();
  // const account = '0x185a4dc360CE69bDCceE33b3784B0282f7961aea'; // forge tests used this account
  const { provider, useForkedEnv } = useFork();
  const { data: _signer } = useSigner();
  const signer = useMemo(
    () => (useForkedEnv ? provider?.getSigner(account) : _signer),
    [_signer, account, provider, useForkedEnv]
  );

  // the balances in the proof files
  const [balances, setBalances] = useState<Map<string, BigNumberish | undefined>>(new Map());

  // maps a user/account address to proofs
  const [accountProofs, setAccountProofs] = useState<Map<string, string[]>>();

  // get merkle tree data
  useEffect(() => {
    if (!account) return;

    const matchingProofs = new Map<string, string[]>();
    const balances = new Map<string, BigNumberish>();

    for (const [tokenAddr, merkleTree] of TREES) {
      console.log('🦄 ~ file: useUpgradeTokens.ts:45 ~ searchMerkleTrees ~ tokenAddr:', tokenAddr);
      for (const [index, value] of merkleTree.entries()) {
        if (value.includes(account)) {
          const proof = merkleTree.getProof(index);
          matchingProofs.set(tokenAddr, proof);

          balances.set(tokenAddr, value[1]);

          console.log('Token address:', tokenAddr);
          console.log('Proof:', proof);
          console.log('Balances:', balances);
        }
      }
    }
    setBalances(balances);
    setAccountProofs(matchingProofs);
  }, [account]);

  // TODO check if user/account has upgradeable tokens
  useEffect(() => {
    if (account) {
      // const userCanUpgrade = searchMerkleTrees(account);
    }
  }, [account]);

  const upgradeTokens = useCallback(
    async (termsAccepted: boolean) => {
      // return if terms not accepted
      if (!termsAccepted || !account || !signer || !accountProofs) return;

      const acceptanceToken = ethers.utils.keccak256(ethers.utils.concat([account, ethers.utils.arrayify(TOS_HASH)]));

      for (const [tokenAddress, proof] of accountProofs.entries()) {
        try {
          // Retrieve the balance for the token address from the balance map
          const balance = balances.get(tokenAddress);

          // Ensure balance data is available, otherwise there are no tokens to upgrade
          if (!balance) {
            console.warn('Balance data not available for token:', tokenAddress);
            return;
          }

          const tokenContract = ERC20__factory.connect(tokenAddress, signer);

          // check allowance
          const allowance = tokenContract.allowance(account, UPGRADE_TOKEN_ADDRESS);

          if (!(await allowance).gte(balance)) {
            const approve = await tokenContract.approve(UPGRADE_TOKEN_ADDRESS, balance);
            await approve.wait();
          }

          const upgradeContract = TokenUpgrade__factory.connect(UPGRADE_TOKEN_ADDRESS, signer);
          const upgradeTx = await upgradeContract.upgrade(tokenAddress, acceptanceToken, account, balance, proof);
          await upgradeTx.wait();

          console.log('Token upgrade successful for token:', tokenAddress);
          toast.success('Token upgrade successful');
        } catch (error) {
          console.error('Error upgrading tokens for token:', tokenAddress, error);
          toast.error('Error upgrading tokens');
        }
      }
    },
    [account, accountProofs, balances, signer]
  );

  return { upgradeTokens, accountProofs };
};

export default useUpgradeTokens;
