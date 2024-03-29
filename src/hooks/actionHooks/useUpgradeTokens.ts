import { ethers, BigNumber } from 'ethers';
import { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'react';
import useAccountPlus from '../useAccountPlus';
import { Address, useSigner } from 'wagmi';
import { fetchBalance } from 'wagmi/actions';
import { TokenUpgrade__factory } from '../../contracts';
import { toast } from 'react-toastify';
import { ICallData, ActionCodes, LadleActions, RoutedActions } from '../../types';
import { useChain } from '../useChain';
import { Strategy__factory } from '../../contracts';
import { getTxCode } from '../../utils/appUtils';
import { TREES, TreeData, TreeDataAsync, TreeMapAsync } from '../../config/trees/trees';
import useFork from '../useFork';
import useContracts from '../useContracts';
import { UserContext } from '../../contexts/UserContext';
import useChainId from '../useChainId';

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

const UPGRADE_CONTRACT_ADDRESS = '0x9Ca89fC21fdbdE431Df9080426F7B630012FE551';
const TOS_HASH = '0x9f6699a0964b1bd6fe6c9fb8bebea236c08311ddd25781bbf5d372d00d32936b';

export const useUpgradeTokens = () => {
  const { address: account } = useAccountPlus();
  const { provider, useForkedEnv } = useFork();
  const { sign, transact } = useChain();
  const contracts = useContracts();

  const chainId = useChainId();

  const toastRef = useRef<any>(null);
  const toasty = () => {
    toastRef.current = toast.info('Upgrading tokens: please check your wallet...', {
      hideProgressBar: true,
      autoClose: false,
    });
  };
  const dismissToast = () => toast.dismiss(toastRef.current);

  const { data: _signer } = useSigner();
  const signer = useMemo(
    () => (useForkedEnv ? provider?.getSigner(account) : _signer),
    [_signer, account, provider, useForkedEnv]
  );

  const { userState, userActions } = useContext(UserContext);
  const {strategyMap} = userState;
  const { updateStrategies } = userActions;

  // maps a user/account address to tree data (with proofs)
  const [accountTreeData, setAccountTreeData] = useState<TreeMapAsync>();
  const [hasUpgradeable, setHasUpgradeable] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [completedUpgrade, setCompletedUpgrade] = useState(false);

  const getActualBalances = async (account: Address, tree: TreeData) => {
    const v1StrategyBalRes = await fetchBalance({ address: account, token: tree.v1TokenAddress });
    const v2StrategyBalRes = tree.v2TokenAddress
      ? await fetchBalance({ address: account, token: tree.v2TokenAddress })
      : undefined;

    const v1StrategyBal = v1StrategyBalRes ? v1StrategyBalRes.value : ethers.constants.Zero;
    const v2StrategyBal = v2StrategyBalRes ? v2StrategyBalRes.value : ethers.constants.Zero;
    const totalBalance = v1StrategyBal.add(v2StrategyBal);

    return { totalBalance, v1StrategyBal, v2StrategyBal };
  };

  const getAccountTreeData = useCallback(async () => {
    if (!account) return;

    const accountTreeData = await [...TREES.values()].reduce(async (treeMap, tree) => {
      let proofs = undefined;
      let treeBalance = undefined;

      for (const [index, value] of tree.tree.entries()) {
        if (value.toString().toLowerCase().includes(account.toLowerCase())) {
          proofs = tree.tree.getProof(index);
          treeBalance = BigNumber.from(value[1]);
        }
      }

      // if no tree balance, there is no elgigible upgrade, and no need to fetch balances
      if (!treeBalance || treeBalance.isZero())
        return (await treeMap).set(tree.treeName, {
          ...tree,
          proofs,
          treeBalance,
          upgradeableBalance: ethers.constants.Zero,
          v1StrategyBal: ethers.constants.Zero,
          v2StrategyBal: ethers.constants.Zero,
        });

      const { totalBalance, v1StrategyBal, v2StrategyBal } = await getActualBalances(account, tree);

      // make sure upgradeable balance is not greater than the tree balance
      const upgradeableBalance = treeBalance.lt(totalBalance) ? treeBalance : totalBalance;

      return (await treeMap).set(tree.treeName, {
        ...tree,
        proofs,
        treeBalance,
        upgradeableBalance,
        v1StrategyBal,
        v2StrategyBal,
      });
    }, Promise.resolve<TreeMapAsync>(new Map()));

    setAccountTreeData(accountTreeData);
  }, [account]);

  // get tree data for this specific user on mount
  useEffect(() => {
    (async () => {
      chainId === 1 && await getAccountTreeData();
    })();
  }, [getAccountTreeData]);

  // assess if user has any upgradeable strategy tokens
  useEffect(() => {
    if (!accountTreeData) return;

    const isDust = (balance: BigNumber, decimals: number): boolean => {
      const dustThreshold = BigNumber.from(5).mul(BigNumber.from(10).pow(decimals - 3)); // 0.005 tokens.
      return balance.lt(dustThreshold);
    };

    const decimals = (treeName: string) => (treeName.includes('usdc') ? 6 : 18);

    const hasUpgradeable = [...accountTreeData.values()].some((treeData) => {
      return (
        treeData.upgradeableBalance.gt(ethers.constants.Zero) &&
        !isDust(treeData.upgradeableBalance, decimals(treeData.treeName))
      );
    });

    setHasUpgradeable(hasUpgradeable);
  }, [accountTreeData]);

  const burn = useCallback(
    async (treeData: TreeDataAsync) => {
      if (!signer) return console.error('No signer');
      if (!account) return console.error('No account');
      const txCode = getTxCode(ActionCodes.REMOVE_LIQUIDITY, treeData.treeName);

      const strategy = Strategy__factory.connect(treeData.v1TokenAddress, signer);

      const permitCallData = await sign(
        [
          /* Give strategy permission to sell tokens to pool */
          {
            target: strategy as any,
            spender: 'LADLE',
            amount: treeData.v1StrategyBal,
            ignoreIf: false,
          },
        ],
        txCode,
        true // force approval by TX
      );

      const calls: ICallData[] = [
        ...permitCallData,

        {
          operation: LadleActions.Fn.TRANSFER,
          args: [strategy.address, strategy.address, treeData.v1StrategyBal] as LadleActions.Args.TRANSFER,
          ignoreIf: false,
        },
        {
          operation: LadleActions.Fn.ROUTE,
          args: [account] as RoutedActions.Args.BURN_STRATEGY_TOKENS, // burn to account
          fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
          targetContract: strategy,
          ignoreIf: false,
        },
      ];

      try {
        await transact(calls, txCode);
      } catch (e) {
        return console.log('Error burning v1 to v2', e);
      }
    },
    [account, sign, signer, transact]
  );

  const upgrade = useCallback(
    async (treeData: TreeDataAsync) => {
      if (!signer) return console.error('No signer');
      if (!account) return console.error('No account');
      const { treeName, v1TokenAddress, v2TokenAddress } = treeData;

      const { totalBalance } = await getActualBalances(account, treeData);
      // check if the tree balance is less than the total strategy balance
      const upgradeableBalance = treeData.treeBalance?.lt(totalBalance) ? treeData.treeBalance : totalBalance;

      const approveUpgradeContract = async () => {
        // NOTE - if there is no v2 address we use the v1 token address because we didn't need to burn (so we are approving v1)
        const strategy = Strategy__factory.connect(v2TokenAddress ?? v1TokenAddress, signer);
        const allowance = await strategy.allowance(account, UPGRADE_CONTRACT_ADDRESS);

        try {
          // NOTE - we know there is an upgradeable balance because we check for it beforehand
          if (allowance.lt(upgradeableBalance)) {
            const approve = await strategy.approve(UPGRADE_CONTRACT_ADDRESS, upgradeableBalance);
            await approve.wait();
          }
        } catch (error) {
          console.error('Error approving strategy tokens for strategy:', strategy, error);
          return toast.error('Error approving strategy tokens');
        }
      };

      try {
        await approveUpgradeContract();

        // token in is the v1 strategy adress if no v2, otherwise it's the v2 strategy address
        const tokenIn = v2TokenAddress ? v2TokenAddress : v1TokenAddress;
        const upgradeContract = TokenUpgrade__factory.connect(UPGRADE_CONTRACT_ADDRESS, signer);
        const acceptanceToken = ethers.utils.keccak256(ethers.utils.concat([account, ethers.utils.arrayify(TOS_HASH)]));

        const upgradeTx = await upgradeContract.upgrade(
          tokenIn,
          acceptanceToken,
          account,
          upgradeableBalance,
          treeData.proofs!
        );

        console.log('Strategy token upgrade successful for strategy:', treeName);
        await upgradeTx.wait();
      } catch (e) {
        console.error('Error upgrading strategy tokens for strategy:', treeName, e);
        toast.error(`Error upgrading ${treeName} strategy token`);
      }
    },
    [account, signer]
  );

  const upgradeAllStrategies = useCallback(
    async (termsAccepted: boolean) => {
      if (!hasUpgradeable) return console.log('no strategies to upgrade for this uer');
      if (!termsAccepted) return console.error('Terms not accepted');
      if (!account || !signer || !contracts) return;
      if (!accountTreeData) return console.log('No account tree data yet');

      setIsUpgrading(true);

      // map through each tree and upgrade if appropriate
      await Promise.all(
        [...accountTreeData.values()].map(async (treeData) => {
          // check if user has upgradeable balance
          if (!treeData.upgradeableBalance.gt(ethers.constants.Zero)) return;

          // if v1 strategy has v2 corresponding strategy, we need to burn the v1 to v2 first
          if (treeData.v2TokenAddress && treeData.v1StrategyBal.gt(ethers.constants.Zero)) {
            await burn(treeData);
          }

          await upgrade(treeData);
        })
      );

      // get the account tree data again to update the balances after successfully upgrading
      await getAccountTreeData();
      setIsUpgrading(false);
      setCompletedUpgrade(true);
      updateStrategies(Array.from(strategyMap.values()));
    },
    [account, accountTreeData, burn, contracts, getAccountTreeData, hasUpgradeable, signer, upgrade]
  );

  // handle toast states
  useEffect(() => {
    if (!hasUpgradeable && completedUpgrade) {
      toast.success('Successfully upgraded all strategy tokens');
    }

    isUpgrading ? toasty() : dismissToast();
  }, [completedUpgrade, hasUpgradeable, isUpgrading]);

  return { upgradeAllStrategies, hasUpgradeable, isUpgrading, completedUpgrade };
};

export default useUpgradeTokens;
