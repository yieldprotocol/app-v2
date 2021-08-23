import { BigNumber, ethers } from 'ethers';
import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { UserContext } from '../contexts/UserContext';
import { ICallData, IVault, SignType, ISeries, ActionCodes, LadleActions } from '../types';
import { getTxCode } from '../utils/appUtils';
import { ETH_BASED_ASSETS, DAI_BASED_ASSETS, MAX_128, BLANK_VAULT } from '../utils/constants';
import { useChain } from './useChain';

import { calculateSlippage, secondsToFrom, sellBase } from '../utils/yieldMath';
import { useRemoveCollateral } from './useRemoveCollateral';

/* Generic hook for chain transactions */
export const useRepayDebt = () => {
  const {
    chainState: { account },
  } = useContext(ChainContext);
  const { userState, userActions } = useContext(UserContext);
  const { selectedIlkId, selectedSeriesId, seriesMap, assetMap } = userState;
  const { updateVaults, updateAssets } = userActions;

  const { removeEth } = useRemoveCollateral();

  const { sign, transact } = useChain();

  const repay = async (
    vault: IVault,
    input: string | undefined,
    collInput: string | undefined = '0' // optional - add(+) / remove(-) collateral in same tx.
  ) => {
    const txCode = getTxCode(ActionCodes.REPAY, vault.id);
    const _input = input ? ethers.utils.parseEther(input) : ethers.constants.Zero;
    const _collInput = ethers.utils.parseEther(collInput);
    const series: ISeries = seriesMap.get(vault.seriesId);
    const base = assetMap.get(vault.baseId);

    const _inputAsFyDai = sellBase(
      series.baseReserves,
      series.fyTokenReserves,
      _input,
      secondsToFrom(series.maturity.toString())
    );
    const _inputAsFyDaiWithSlippage = calculateSlippage(_inputAsFyDai, userState.slippageTolerance.toString(), true);
    const inputGreaterThanDebt: boolean = ethers.BigNumber.from(_inputAsFyDai).gte(vault.art);

    const permits: ICallData[] = await sign(
      [
        {
          // before maturity
          target: base,
          spender: 'LADLE',
          series,
          message: 'Signing Approval',
          ignore: series.isMature() || base.hasLadleAuth,
        },
        {
          // after maturity
          target: base,
          spender: base.joinAddress,
          series,
          message: 'Signing Dai Approval',
          ignore: !series.isMature() || base.hasJoinAuth,
        },
      ],
      txCode
    );

    const calls: ICallData[] = [
      ...permits,

      /* BEFORE MATURITY */
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [base.address, series.poolAddress, _input] as LadleActions.Args.TRANSFER,
        ignore: series.isMature(),
      },
      {
        operation: LadleActions.Fn.REPAY,
        args: [vault.id, account, _collInput, _inputAsFyDaiWithSlippage] as LadleActions.Args.REPAY,
        ignore: series.isMature() || inputGreaterThanDebt, // use if input is NOT more than debt
      },
      {
        operation: LadleActions.Fn.REPAY_VAULT,
        args: [vault.id, account, _collInput, MAX_128] as LadleActions.Args.REPAY_VAULT,
        ignore: series.isMature() || !inputGreaterThanDebt, // use if input IS more than debt
      },

      /* AFTER MATURITY */ // TODO still
      {
        operation: LadleActions.Fn.CLOSE,
        args: [vault.id, account, _collInput, _input.mul(-1)] as LadleActions.Args.CLOSE,
        ignore: !series.isMature(),
      },

      ...removeEth(_collInput, series),

    ];
    await transact(calls, txCode);
    updateVaults([]);
    updateAssets([base]);
  };

  return repay;
};
