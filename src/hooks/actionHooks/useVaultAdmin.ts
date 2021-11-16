import { ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../../contexts/ChainContext';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UserContext } from '../../contexts/UserContext';
import { ICallData, IVault, ActionCodes, LadleActions, ISettingsContext } from '../../types';
import { getTxCode } from '../../utils/appUtils';
import { useChain } from '../useChain';

/* Generic hook for chain transactions */
export const useVaultAdmin = () => {
  const { userState, userActions } = useContext(UserContext);
  const { activeAccount: account, seriesMap, assetMap } = userState;
  const { updateVaults } = userActions;

  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const {
    settingsState: { approveMax },
  } = useContext(SettingsContext) as ISettingsContext;

  const { sign, transact } = useChain();

  const transfer = async (vault: IVault, to: string) => {
    const txCode = getTxCode(ActionCodes.TRANSFER_VAULT, vault.id);
    const series = seriesMap.get(vault.seriesId);
    const base = assetMap.get(vault.baseId);
    const ladleAddress = contractMap.get('Ladle').address;

    const alreadyApproved = approveMax
    ? (await base.getAllowance(account, ladleAddress) ).gt(vault.art)
    : false;

    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          message: 'Signing Dai Approval',
          ignoreIf: series.seriesIsMature || alreadyApproved===true,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.GIVE,
        args: [vault.id, to] as LadleActions.Args.GIVE,
        ignoreIf: series.seriesIsmature,
      },
    ];

    await transact(calls, txCode);
    updateVaults([]);
  };

  const merge = async (vault: IVault, to: IVault, ink: string, art: string, deleteVault: boolean = false) => {
    const txCode = getTxCode(ActionCodes.MERGE_VAULT, vault.id);
    const series = seriesMap.get(vault.seriesId);

    /* ladle.stir(fromVault, toVault, ink, art) */
    const calls: ICallData[] = [
      {
        operation: LadleActions.Fn.STIR,
        args: [vault.id, to.id, vault.ink, vault.art] as LadleActions.Args.STIR,
        // TODO: #82 refactor to actually allow for custom ink and art values (right now seems like formatting issues) @marcomariscal
        // args: [vault.id, to.id, _ink, _art] as LadleActions.Args.STIR,
        ignoreIf: series.seriesIsMature,
      },
      {
        operation: LadleActions.Fn.DESTROY,
        args: [vault.id] as LadleActions.Args.DESTROY,
        ignoreIf: !deleteVault || vault.art.gt(ethers.constants.Zero) || vault.ink.gt(ethers.constants.Zero),
      },
    ];
    await transact(calls, txCode);
    updateVaults([]);
  };

  return {
    transfer,
    merge,
  };
};
