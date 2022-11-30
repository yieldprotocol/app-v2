import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useContext, useEffect, useState } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { IAsset, IStrategy, IUserContext } from '../../types';

const useClaimRewards = (strategy: IStrategy | undefined) => {
  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { activeAccount: account, assetMap } = userState;
  const { updateAssets } = userActions;
  const asset = assetMap.get(strategy?.baseId!);

  const [accruedRewards, setAccruedRewards] = useState<string>();
  const [rewardsToken, setRewardsToken] = useState<IAsset>();

  const claimRewards = async () => {
    if (!strategy) throw new Error('no strategy detected when claiming rewards');
    await strategy.strategyContract.claim(account!);
    updateAssets([asset!]);
    getRewards();
  };

  const getRewards = useCallback(async () => {
    if (!strategy) return;

    const { strategyContract } = strategy;

    const [{ accumulated }, tokenAddr] = await Promise.all([
      strategyContract.rewards(account!),
      strategyContract.rewardsToken(),
    ]);
    setAccruedRewards('1');
    // setAccruedRewards(formatUnits(accumulated, strategy.decimals));
    setRewardsToken([...assetMap.values()].find((a) => a.address === tokenAddr));
  }, [account, assetMap, strategy]);

  useEffect(() => {
    getRewards();
  }, [getRewards]);

  return { claimRewards, accruedRewards, rewardsToken };
};

export default useClaimRewards;
