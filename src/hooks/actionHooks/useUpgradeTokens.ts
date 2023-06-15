import { ethers, BigNumberish, BigNumber } from 'ethers';
import { useState, useEffect, useMemo, useCallback, useContext } from 'react';

import useAccountPlus from '../useAccountPlus';
import { useSigner, useBalance } from 'wagmi';
import { ERC20__factory, TokenUpgrade__factory } from '../../contracts';
import { toast } from 'react-toastify';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions, IVault, IAsset } from '../../types';
import { useChain } from '../useChain';
import { UserContext } from '../../contexts/UserContext';
import { Strategy__factory } from '../../contracts';
import { getTxCode } from '../../utils/appUtils';

import { TREES } from '../../config/trees/trees';
import { ChainContext } from '../../contexts/ChainContext';
import useFork from '../useFork';
import useContracts from '../useContracts';
import { ContractNames } from '../../config/contracts';
import { Token } from 'graphql';

/*
  This hook is used to upgrade tokens that were impacted in the Euler hack. Here is the process: 

  NOTE: this was written the morning of June 14, 2023. as of this time, I don't have the final version of the trees. 
        So the specifics of the below steps may change slightly. The final trees should look something like this: 

        - 3 V1 trees for march v1 strategies
        - 3 V2 trees for june v2 strategies

        we didn't have march v2 strategies because the euler hack happened before march v2 was released.

  With that said, here is the process:
          
  1. Once we have the users address, we need to fetch all v1 balances directly from the contract. 
  
  2. If the user has a v1 balance for any of the v1 march strategies, we need to call upgrade and pass these v1 tokens in. 
     No burn is required. It is important to use the balance from the tree when upgrading. Might be a good idea to fetch the
     user's v1 balance and compare it to the balance in the tree. Pass in the lower of the 2 balances.
     If the user has any v1 balances for the June series, we need to burn these to v2. 

  3. When we go to burn our v2 June tokens, we will need to use the fetched balance in the burn. When the burn is complete, we
     can upgrade. When we upgrade these v2 tokens, it is important that we use the v2 balance from the tree. Or perhaps even fetch
     and compare the user's v2 balance to the balance in the tree. Pass in the lower of the 2 balances.

  4. If the upgrade is successful, we show a success toast. if not, an error toast. should probably direct the user to try again
     if it fails. Or maybe to open a support ticket.
*/

enum TokenAddressesV1 {
  ETH_March = '0xcf30a5a994f9ace5832e30c138c9697cda5e1247', //
  ETH_June = '0x831df23f7278575ba0b136296a285600cd75d076',
  USDC_March = '0xfbc322415cbc532b54749e31979a803009516b5d', //
  USDC_June = '0x8e8d6ab093905c400d583efd37fbeeb1ee1c0c39',
  DAI_March = '0x7acfe277ded15caba6a8da2972b1eb93fe1e2ccd', //
  DAI_June = '0x1144e14e9b0aa9e181342c7e6e0a9badb4ced295',
}

enum TokenAddressesV2 {
  ETH_June = '0xb268E2C85861B74ec75fe728Ae40D9A2308AD9Bb',
  USDC_June = '0x5dd6DcAE25dFfa0D46A04C9d99b4875044289fB2',
  DAI_June = '0x9ca2a34ea52bc1264D399aCa042c0e83091FEECe',
}

const UPGRADEABLE_V1s = [TokenAddressesV1.ETH_March, TokenAddressesV1.USDC_March, TokenAddressesV1.DAI_March];
const BURNABLE_V1s = [TokenAddressesV1.ETH_June, TokenAddressesV1.USDC_June, TokenAddressesV1.DAI_June];

const UPGRADE_CONTRACT_ADDRESS = '0x9Ca89fC21fdbdE431Df9080426F7B630012FE551';
const TOS_HASH = '0x9f6699a0964b1bd6fe6c9fb8bebea236c08311ddd25781bbf5d372d00d32936b';

export const useUpgradeTokens = () => {
  const { address: account } = useAccountPlus();
  const { provider, useForkedEnv } = useFork();
  const { sign, transact } = useChain();
  const contracts = useContracts();

  const { data: _signer } = useSigner();
  const signer = useMemo(
    () => (useForkedEnv ? provider?.getSigner(account) : _signer),
    [_signer, account, provider, useForkedEnv]
  );

  // the balances in the proof files
  const [proofBalances, setProofBalances] = useState<Map<string, BigNumberish | undefined>>(new Map());

  // the fetched users balances for v1, v2 tokens
  const [V1balances, setV1Balances] = useState<Map<string, BigNumberish | undefined>>(new Map());
  const [V2balances, setV2Balances] = useState<Map<string, BigNumberish | undefined>>(new Map());

  // maps a user/account address to proofs
  const [accountProofs, setAccountProofs] = useState<Map<string, string[]>>();

  const fetchBalances = useCallback(
    async (addrObj: Record<string, string>) => {
      if (!account || !signer) return;
      const balanceMap = new Map<string, BigNumberish>();

      for (const addr of Object.values(addrObj)) {
        const strategyContract = Strategy__factory.connect(addr, signer);

        const balanceOf = await strategyContract.balanceOf(account);
        balanceMap.set(addr, balanceOf);
      }
      console.log('balanceMap', balanceMap);
      return balanceMap;
    },
    [account, signer]
  );

  const fetchAndSetBalances = useCallback(async () => {
    const v1Map = await fetchBalances(TokenAddressesV1);
    const v2Map = await fetchBalances(TokenAddressesV2);
    setV1Balances(v1Map!);
    setV2Balances(v2Map!);
  }, [fetchBalances]);

  // get merkle tree data
  useEffect(() => {
    if (!account) return;

    // fetch v1, v2 balances
    fetchAndSetBalances();

    const matchingProofs = new Map<string, string[]>();
    const balances = new Map<string, BigNumberish>();

    // Will need to modify this logic to account for the new nested map in TREES
    for (const [tokenAddr, merkleTree] of TREES.get('v1')!) {
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
    setProofBalances(balances);
    setAccountProofs(matchingProofs);
  }, [account, fetchAndSetBalances]);

  const upgradeTokens = useCallback(
    async (termsAccepted: boolean) => {
      // return if terms not accepted
      if (!termsAccepted || !account || !signer || !accountProofs || !contracts) return;

      const ladleAddress = contracts.get(ContractNames.LADLE)?.address;

      const acceptanceToken = ethers.utils.keccak256(ethers.utils.concat([account, ethers.utils.arrayify(TOS_HASH)]));

      for (const [strategy, proof] of accountProofs.entries()) {
        // get ladle approval

        const balance = proofBalances.get(strategy);
        const TEST_V2 = '0x9ca2a34ea52bc1264D399aCa042c0e83091FEECe';

        const strategyContract = Strategy__factory.connect(strategy, signer);

        const fetchedBalance = V1balances.get(strategy);

        const isUpgradeableV1 = UPGRADEABLE_V1s.includes(strategyContract.address as TokenAddressesV1);
        const isV2 = Object.values(TokenAddressesV2).includes(strategyContract.address as TokenAddressesV2);
        const isBurnableV1 = BURNABLE_V1s.includes(strategyContract.address as TokenAddressesV1);

        console.log('balance', balance);
        console.log('strategyContract', strategyContract);
        console.log('account, ladleAddress', account, ladleAddress);
        console.log('Strat', strategy);
        console.log('fetchedBalance', fetchedBalance, V1balances, strategy);

        // const strategyAllowance = await strategyContract.allowance(account!, ladleAddress!);
        // const alreadyApproved = strategyAllowance.gte(balance!);

        // console.log('strategyAllowance', strategyAllowance.toString());

        const txCode = getTxCode(ActionCodes.TOKEN_UPGRADE, strategy);

        const permitCallData: ICallData[] = await sign(
          [
            /* Give strategy permission to sell tokens to pool */
            {
              target: strategyContract as any,
              spender: 'LADLE',
              amount: fetchedBalance,
              ignoreIf: isUpgradeableV1 || isV2, // TODO ignore if v2
            },
          ],
          txCode
        );

        const calls: ICallData[] = [
          ...permitCallData,

          {
            operation: LadleActions.Fn.TRANSFER,
            args: [strategyContract.address, strategyContract.address, fetchedBalance] as LadleActions.Args.TRANSFER,
            ignoreIf: isUpgradeableV1 || isV2, // ignore if its an upgradeable v1, or is a v2
          },
          {
            operation: LadleActions.Fn.ROUTE,
            args: [account] as RoutedActions.Args.BURN_STRATEGY_TOKENS, // burn to account
            fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
            targetContract: strategyContract, // v1 in this case
            ignoreIf: isUpgradeableV1 || isV2, // ignore if its an upgradeable v1, or is a v2
          },
        ];

        // BURN V1 to V2
        try {
          await transact(calls, txCode);
        } catch (e) {
          return console.log('Error burning v1 to v2', e);
        }

        try {
          const tokenContract = ERC20__factory.connect(TEST_V2, signer);

          // check allowance
          const allowance = tokenContract.allowance(account, UPGRADE_CONTRACT_ADDRESS);

          if ((await allowance).lt(balance!)) {
            const approve = await tokenContract.approve(UPGRADE_CONTRACT_ADDRESS, balance!);
            await approve.wait();
          }

          const upgradeContract = TokenUpgrade__factory.connect(UPGRADE_CONTRACT_ADDRESS, signer);
          const upgradeTx = await upgradeContract.upgrade(TEST_V2, acceptanceToken, account, balance!, proof);
          await upgradeTx.wait();

          console.log('Token upgrade successful for token:', TEST_V2);
          toast.success('Token upgrade successful');
        } catch (error) {
          console.error('Error upgrading tokens for token:', TEST_V2, error);
          toast.error('Error upgrading tokens');
        }
      }
    },
    [account, accountProofs, proofBalances, signer, V1balances, V2balances]
  );

  return { upgradeTokens, accountProofs };
};

export default useUpgradeTokens;
