import { formatUnits } from 'ethers/lib/utils';
import { useCallback, useContext, useEffect, useState } from 'react';
import { TxContext } from '../../contexts/TxContext';
import { UserContext } from '../../contexts/UserContext';
import { ActionCodes, IAsset, IStrategy, IUserContext } from '../../types';
import { useConnection } from '../useConnection';

const useClaimRewards = (strategy: IStrategy | undefined) => {
  const {
    connectionState: { provider },
  } = useConnection();
  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { activeAccount: account, assetMap } = userState;
  const { updateAssets } = userActions;
  const {
    txActions: { handleTx },
  } = useContext(TxContext);

  const asset = assetMap.get(strategy?.baseId!);

  const signer = provider?.getSigner(account!);

  const [accruedRewards, setAccruedRewards] = useState<string>();
  const [rewardsToken, setRewardsToken] = useState<IAsset>();

  const claimRewards = async () => {
    if (!account) throw new Error('no account detected when claiming rewards');
    if (!signer) throw new Error('no signer detected when claiming rewards');
    if (!strategy) throw new Error('no strategy detected when claiming rewards');

    const claim = async () => await strategy.strategyContract.connect(signer).claim(account);

    handleTx(claim, ActionCodes.CLAIM_REWARDS);
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
    setAccruedRewards(formatUnits(accumulated, strategy.decimals));
    setRewardsToken([...assetMap.values()].find((a) => a.address === tokenAddr));
  }, [account, assetMap, strategy]);

  useEffect(() => {
    getRewards();
  }, [getRewards]);

  return { claimRewards, accruedRewards, rewardsToken };
};

export default useClaimRewards;
