import { BigNumber, BigNumberish, Contract, ethers } from 'ethers';
import { erc20ABI, useAccount } from 'wagmi';
import { IAsset, ICallData, LadleActions } from '../../types';
import { RoutedActions } from '../../types/operations';
import { ZERO_BN } from '../../utils/constants';
import useContracts, { ContractNames } from '../useContracts';

export namespace AssertActions {
  export enum Fn {
    ASSERT_GT = 'assertGt',
    ASSERT_LT = 'assertLt',
    ASSERT_EQ_REL = 'assertEqRel',
    ASSERT_EQ_ABS = 'assertEqAbs',
    ASSERT_GE = 'assertGe',
    ASSERT_LE = 'assertLe',
  }
  export namespace Args {
    export type ASSERT_GT = [actualTarget: string, bytes: any, expected: BigNumberish];
    export type ASSERT_LT = [actualTarget: string, bytes: any, expected: BigNumberish];
    export type ASSERT_EQ_REL = [actualTarget: string, bytes: any, expected: BigNumberish, relative: BigNumberish];
    export type ASSERT_EQ_ABS = [actualTarget: string, bytes: any, expected: BigNumberish];
    export type ASSERT_GE = [actualTarget: string, bytes: any, expected: BigNumberish];
    export type ASSERT_LE = [actualTarget: string, bytes: any, expected: BigNumberish];
  }
}

export const useAssert = () => {
  const contracts = useContracts();
  const AssertContract = contracts.get(ContractNames.ASSERT);
  const { address: account } = useAccount();

  const encodeBalanceCall = (address: string, tokenIdentifier: string | number | undefined = undefined) => {

    const mock = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    if (address) {
      const abi = tokenIdentifier ? erc1155ABI : erc20ABI;
      const args = tokenIdentifier ? [account, tokenIdentifier] : [account];
      const assetContract = new Contract(address, abi);
      return assetContract.interface.encodeFunctionData('balanceOf', args);
    }
    return '0x';
  };

  const assert = (
    address: string,
    encodedCallBytes: any,
    assertFn: AssertActions.Fn,
    expectedVal: BigNumber
  ): ICallData[] => {
    return [
      {
        operation: LadleActions.Fn.ROUTE,
        args: [address, encodedCallBytes, expectedVal] as AssertActions.Args.ASSERT_GT,
        fnName: assertFn,
        targetContract: AssertContract,
        ignoreIf: false,
      },
    ];
  };

  /* if there is a destination 'to' then use the ladle module (wrapEtherModule) */
  return { assert, encodeBalanceCall };
};

const erc1155ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
