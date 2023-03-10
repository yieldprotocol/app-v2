import { WAD_BN } from '@yield-protocol/ui-math';
import { useContext } from 'react';
import { ContractNames } from '../../config/contracts';
import { HistoryContext } from '../../contexts/HistoryContext';
import { UserContext } from '../../contexts/UserContext';
import { Cauldron } from '../../contracts';
import { ICallData, IVault, ISeries, ActionCodes, LadleActions, IHistoryContext } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { MAX_128, ZERO_BN } from '../../utils/constants';
import { useChain } from '../useChain';
import useContracts from '../useContracts';
import { AssertActions, useAssert } from './useAssert';

/* Generic hook for chain transactions */
export const useRollDebt = () => {
  const { userState, userActions } = useContext(UserContext);
  const { assetMap, seriesMap } = userState;
  const { updateVaults, updateAssets, updateSeries } = userActions;

  const {
    historyActions: { updateVaultHistory },
  } = useContext(HistoryContext) as IHistoryContext;

  const { transact } = useChain();

  const { assert, encodeBalanceCall } = useAssert();
  const contracts = useContracts();

  const rollDebt = async (vault: IVault, toSeries: ISeries) => {
    if (!contracts) return;

    const cauldron = contracts.get(ContractNames.CAULDRON) as Cauldron;
    const txCode = getTxCode(ActionCodes.ROLL_DEBT, vault.id);
    const base = assetMap?.get(vault.baseId);
    const hasDebt = vault.accruedArt.gt(ZERO_BN);
    const fromSeries = seriesMap?.get(vault.seriesId);

    /* Add in an Assert call : debt in new series within 10% of old debt */
    const assertCallData: ICallData[] = assert(
      cauldron.address,
      cauldron.interface.encodeFunctionData('balances', [vault.id]),
      AssertActions.Fn.ASSERT_EQ_REL,
      vault.accruedArt,
      WAD_BN.mul('10') // 10% relative tolerance
    );

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
      ...assertCallData,
    ];
    await transact(calls, txCode);
    updateVaults([vault]);
    updateAssets([base!]);
    updateSeries([fromSeries!, toSeries]);
    updateVaultHistory([vault]);
  };

  return rollDebt;
};
