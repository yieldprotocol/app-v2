import { useContext } from 'react';
import { HistoryContext } from '../../contexts/HistoryContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, ISeries, ActionCodes, LadleActions, IHistoryContext } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { MAX_128, ZERO_BN } from '../../utils/constants';
import useAllowAction from '../useAllowAction';
import { useChain } from '../useChain';

/* Generic hook for chain transactions */
export const useRollDebt = () => {
  const { userState, userActions } = useContext(UserContext);
  const { assetMap, seriesMap } = userState;
  const { updateVaults, updateAssets, updateSeries } = userActions;

  const {
    historyActions: { updateVaultHistory },
  } = useContext(HistoryContext) as IHistoryContext;

  const { transact } = useChain();
  const { isActionAllowed } = useAllowAction();

  const rollDebt = async (vault: IVault, toSeries: ISeries) => {
    if (!isActionAllowed(ActionCodes.ROLL_DEBT)) return; // return if action is not allowed

    const txCode = getTxCode(ActionCodes.ROLL_DEBT, vault.id);
    const base = assetMap?.get(vault.baseId);
    const hasDebt = vault.accruedArt.gt(ZERO_BN);
    const fromSeries = seriesMap?.get(vault.seriesId!);

    const calls: ICallData[] = [
      {
        // ladle.rollAction(vaultId: string, newSeriesId: string, max: BigNumberish)
        operation: LadleActions.Fn.ROLL,
        args: [vault.id, toSeries.id, '2', MAX_128] as LadleActions.Args.ROLL,
        ignoreIf: !hasDebt,
      },
      {
        // case where rolling vault with ZERO debt
        operation: LadleActions.Fn.TWEAK,
        args: [vault.id, toSeries.id, vault.ilkId] as LadleActions.Args.TWEAK,
        ignoreIf: hasDebt,
      },
    ];
    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([base!]);
    updateSeries([fromSeries!, toSeries]);
    updateVaultHistory([vault]);
  };

  return rollDebt;
};
