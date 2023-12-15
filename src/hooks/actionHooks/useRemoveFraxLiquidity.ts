import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { HistoryContext } from '../../contexts/HistoryContext';
import { useBalance, Address, useAccount } from 'wagmi';
import { useChain } from '../useChain';
import useContracts from '../useContracts';
import { ContractNames } from '../../config/contracts';
import { getTxCode } from '../../utils/appUtils';
import { BigNumber, ethers } from 'ethers';
import { ICallData, ISeries, ActionCodes, LadleActions, RoutedActions, IAsset } from '../../types';


/*
  after the v2 strategy security incident we now must use different logic to remove frax liquidity
  we only have 1 major holder at this time, so this is to allow him to remove his liquidity. We will not have 
  any more frax holders because we are phasing it out. so after this user (ticket 901) removes his liquidity,
  we can remove this hook and the associated logic in PoolPosition.tsx
*/


export const useRemoveFraxLiquidity = () => {
  const contracts = useContracts();
  const { sign, transact } = useChain();

  const { userState, userActions } = useContext(UserContext);
  const { selectedStrategy, assetMap, strategyMap, selectedBase } = userState;
  const { updateSeries, updateAssets, updateStrategies } = userActions;

  const _strategy = selectedStrategy!;

  const { address: account } = useAccount();

  const { refetch: refetchBaseBal } = useBalance({
    address: account,
    token: selectedBase?.assetAddress as Address,
  });
  const { refetch: refetchStrategyBal } = useBalance({
    address: account,
    token: selectedStrategy?.address as Address,
  });

  const {
    historyActions: { updateStrategyHistory },
  } = useContext(HistoryContext);

  const removeFraxLiquidity = async (input: string, series: ISeries) => {

    if (!contracts) return;

    // generate tx code
    const txCode = getTxCode(ActionCodes.REMOVE_LIQUIDITY, series.id);

    const _base: IAsset = assetMap.get(series.baseId)!;
    const _input = ethers.utils.parseUnits(input, _base.decimals);
    // ladle address
    const ladleAddress = contracts.get(ContractNames.LADLE)?.address;

    // check if strat is already approved
    const alreadyApprovedStrategy = (await _strategy!.strategyContract.allowance(account!, ladleAddress!)).gte(_input);

    // permit call data
    const permitCallData: ICallData[] = await sign(
      [
        {
          target: _strategy,
          spender: 'LADLE',
          amount: _input,
          ignoreIf: !_strategy || alreadyApprovedStrategy === true,
        },
      ],
      txCode
    );

    // create batch
    const calls: ICallData[] = [
      ...permitCallData,
      {
        operation: LadleActions.Fn.TRANSFER,
        args: [_strategy.address, _strategy.address, _input] as LadleActions.Args.TRANSFER,
        ignoreIf: false,
      },

      {
        operation: LadleActions.Fn.ROUTE,
        args: [_strategy.associatedStrategy?.V2] as RoutedActions.Args.BURN_STRATEGY_TOKENS,
        fnName: RoutedActions.Fn.BURN_STRATEGY_TOKENS,
        targetContract: _strategy.strategyContract,
        ignoreIf: false, 
      },

      {
        operation: LadleActions.Fn.ROUTE,
        args: [account] as RoutedActions.Args.BURN_DIVESTED,
        fnName: RoutedActions.Fn.BURN_DIVESTED,
        targetContract: strategyMap.get(_strategy.associatedStrategy?.V2!)?.strategyContract,
        ignoreIf: false, 
      },
    ];

    await transact(calls, txCode);

    // refetch data post transact
    refetchBaseBal();
    refetchStrategyBal();
    updateSeries([series]);
    updateAssets([_base]);
    updateStrategies([_strategy]);
    updateStrategyHistory([_strategy]);
  };

  return removeFraxLiquidity;
};
