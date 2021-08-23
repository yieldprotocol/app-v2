import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, IVault, SignType, ISeries, ActionCodes, LadleActions } from '../types';
import { getTxCode } from '../utils/appUtils';
import { ETH_BASED_ASSETS, DAI_BASED_ASSETS, MAX_128, BLANK_VAULT } from '../utils/constants';
import { useChain } from './chainHooks';

import { calculateSlippage, secondsToFrom, sellBase } from '../utils/yieldMath';
import { useCollateralActions } from './collateralHooks';

/* Generic hook for chain transactions */
export const useVaultAdmin = () => {
  const {
    chainState: { account },
  } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlkId, selectedSeriesId, seriesMap, assetMap } = userState;
  const { updateVaults, updateAssets } = userActions;

  const { addEth, removeEth } = useCollateralActions();
  const { sign, transact } = useChain();

  const transfer = async (vault: IVault, to: string ) => {
    const txCode = getTxCode(ActionCodes.TRANSFER_VAULT, vault.id);
    const series = seriesMap.get(vault.seriesId);
    const base = assetMap.get(vault.baseId);

    const permits: ICallData[] = await sign(
      [
        {
          target: base,
          spender: 'LADLE',
          series,
          message: 'Signing Dai Approval',
          ignore: series.mature || base.hasLadleAuth,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,
      {
        operation: LadleActions.Fn.GIVE,
        args: [vault.id, to] as LadleActions.Args.GIVE,
        ignore: series.mature,
      },
    ];

    await transact(calls, txCode);
    updateVaults([]);
  };


  const merge = async (vault: IVault, to: IVault, ink: string, art: string, deleteVault: boolean=false ) => {
    const txCode = getTxCode(ActionCodes.MERGE_VAULT, vault.id);
    const series = seriesMap.get(vault.seriesId);
    const _ink = ink ? ethers.utils.parseEther(ink) : ethers.constants.Zero;
    const _art = art ? ethers.utils.parseEther(art) : ethers.constants.Zero;

    /* ladle.stir(fromVault, toVault, ink, art) */
    const calls: ICallData[] = [
      {
        operation: LadleActions.Fn.STIR,
        args: [vault.id, to.id, vault.ink, vault.art] as LadleActions.Args.STIR,
        // TODO: #82 refactor to actually allow for custom ink and art values (right now seems like formatting issues) @marcomariscal
        // args: [vault.id, to.id, _ink, _art] as LadleActions.Args.STIR,
        ignore: series.mature,
      },
      {
        operation: LadleActions.Fn.DESTROY,
        args: [vault.id] as LadleActions.Args.DESTROY,
        ignore: !deleteVault || vault.art.gt(ethers.constants.Zero) || vault.ink.gt(ethers.constants.Zero),
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
