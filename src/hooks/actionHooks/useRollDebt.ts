import { useSWRConfig } from 'swr';
import { useContext } from 'react';
import { HistoryContext } from '../../contexts/HistoryContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, ISeries, ActionCodes, LadleActions, IHistoryContext } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { MAX_128, ZERO_BN } from '../../utils/constants';
import useAsset from '../useAsset';
import { useChain } from '../useChain';

/* Generic hook for chain transactions */
export const useRollDebt = () => {
  const { mutate } = useSWRConfig();
  const {
    userState: { selectedVault: vault, seriesMap },
    userActions,
  } = useContext(UserContext);
  const { updateVaults, updateSeries } = userActions;
  const { data: base, key: baseKey } = useAsset(vault?.baseId!);

  const {
    historyActions: { updateVaultHistory },
  } = useContext(HistoryContext) as IHistoryContext;

  const { transact } = useChain();

  const rollDebt = async (toSeries: ISeries) => {
    if (!vault) throw new Error('no vault detected in roll debt');
    if (!base) throw new Error('no base detected in roll debt');

    const txCode = getTxCode(ActionCodes.ROLL_DEBT, vault.id);
    const hasDebt = vault.accruedArt.gt(ZERO_BN);
    const fromSeries = seriesMap.get(vault.seriesId);

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

    mutate(baseKey);
    updateVaults([vault]);
    updateSeries([fromSeries!, toSeries]);
    updateVaultHistory([vault]);
  };

  return rollDebt;
};
