import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useContext, useEffect, useState } from 'react';
import { TxContext } from '../../contexts/TxContext';
import { UserContext } from '../../contexts/UserContext';
import { ActionCodes, IAsset, IStrategy } from '../../types';

import { useSigner, useAccount } from 'wagmi';
import useAccountPlus from '../useAccountPlus';
import useAllowAction from '../useAllowAction';

const useClaimRewards = (strategy: IStrategy | undefined) => {
  const { data: signer, isError, isLoading } = useSigner();
  const { address: account } = useAccountPlus();
  const { isActionAllowed } = useAllowAction();

  const { userState, userActions } = useContext(UserContext);
  const { assetMap } = userState;
  const { updateAssets, updateStrategies } = userActions;
  const {
    txActions: { handleTx },
  } = useContext(TxContext);

  const asset = assetMap.get(strategy?.baseId!);

  const [accruedRewards, setAccruedRewards] = useState<string>();
  const [rewardsToken, setRewardsToken] = useState<IAsset>();

  const claimRewards = async () => {
    if (!account) throw new Error('no account detected when claiming rewards');
    if (!signer) throw new Error('no signer detected when claiming rewards');
    if (!strategy) throw new Error('no strategy detected when claiming rewards');
    if (!strategy.currentSeries) return console.error('No series selected');
    if (!isActionAllowed(ActionCodes.CLAIM_REWARDS, strategy.currentSeries)) return; // return if action is not allowed

    const claim = async () => await strategy.strategyContract.connect(signer).claim(account);

    await handleTx(claim, ActionCodes.CLAIM_REWARDS);
    updateAssets([asset!]);
    updateStrategies([strategy]);
    // getRewards();
  };

  // const getRewards = useCallback(async () => {
  //   if (!strategy) return;
  //   const { strategyContract } = strategy;
  //   const [{ accumulated }, tokenAddr] = await Promise.all([
  //     strategyContract.rewards(account!),
  //     strategyContract.rewardsToken(),
  //   ]);
  //   setAccruedRewards(formatUnits(accumulated, strategy.decimals));
  //   setRewardsToken([...assetMap.values()].find((a) => a.address === tokenAddr));
  // }, [account, assetMap, strategy]);

  // useEffect(() => {
  //   getRewards();
  // }, [getRewards]);

  return { claimRewards, accruedRewards, rewardsToken };
};

export default useClaimRewards;
