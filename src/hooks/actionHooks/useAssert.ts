import { BigNumber } from 'ethers';
import { useAccount } from 'wagmi';
import { ICallData, LadleActions } from '../../types';
import { RoutedActions } from '../../types/operations';
import { ZERO_BN } from '../../utils/constants';
import useContracts, { ContractNames } from '../useContracts';

export const useAssert = () => {
  const contracts = useContracts();
  const AssertContract = contracts.get(ContractNames.ASSERT);

  const assert = (

  ): ICallData[] =>
    /* if there is a destination 'to' then use the ladle module (wrapEtherModule) */
    [
      {
        operation: LadleActions.Fn.ROUTE,
        args: [ 


        ] as RoutedActions.Args.ASSERT,
        fnName: RoutedActions.Fn.ASSERT,
        targetContract: AssertContract,
        ignoreIf: false,
      },
    ]
  return { assert };
};