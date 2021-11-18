import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import {
  ICallData,
  IVault,
  ISeries,
  ActionCodes,
  LadleActions,
  IUserContext,
  IUserContextActions,
  IUserContextState,
} from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { MAX_128 } from '../../utils/constants';
import { useChain } from '../useChain';

/* Generic hook for chain transactions */
export const useRollDebt = () => {
  const { userState, userActions }: { userState: IUserContextState; userActions: IUserContextActions } = useContext(
    UserContext
  ) as IUserContext;

  const { seriesMap, assetMap } = userState;
  const { updateVaults, updateAssets } = userActions;

  const { transact } = useChain();

  const rollDebt = async (vault: IVault, toSeries: ISeries) => {
    const txCode = getTxCode(ActionCodes.ROLL_DEBT, vault.id);
    const series = seriesMap.get(vault.seriesId);
    const base = assetMap.get(vault.baseId);

    const calls: ICallData[] = [
      {
        // ladle.rollAction(vaultId: string, newSeriesId: string, max: BigNumberish)
        operation: LadleActions.Fn.ROLL,
        args: [vault.id, toSeries.id, '2', MAX_128] as LadleActions.Args.ROLL,
        ignoreIf: series?.seriesIsMature,
      },
    ];
    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([base!]);
  };

  return rollDebt;
};
