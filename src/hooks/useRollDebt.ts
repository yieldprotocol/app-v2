import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, IVault, SignType, ISeries, ActionCodes, LadleActions } from '../types';
import { getTxCode } from '../utils/appUtils';
import { ETH_BASED_ASSETS, DAI_BASED_ASSETS, MAX_128, BLANK_VAULT } from '../utils/constants';
import { useChain } from './chainHooks';

import { calculateSlippage, secondsToFrom, sellBase } from '../utils/yieldMath';

/* Generic hook for chain transactions */
export const useRollDebt = () => {
  const {
    chainState: { account },
  } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlkId, selectedSeriesId, seriesMap, assetMap } = userState;
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
        ignore: false,
      },
    ];
    await transact(calls, txCode);
    updateVaults([]);
    updateAssets([base]);
  };

  return rollDebt;
};
