import { BigNumber, BigNumberish, Bytes, BytesLike, Contract, ethers } from 'ethers';
import { erc20ABI, useAccount, useNetwork } from 'wagmi';
import { ContractNames } from '../../config/contracts';
import { IAsset, ICallData, LadleActions } from '../../types';
import { RoutedActions } from '../../types/operations';
import { ZERO_BN } from '../../utils/constants';
import useChainId from '../useChainId';
import useContracts from '../useContracts';

export namespace AssertActions {
  export enum Fn {
    ASSERT_GT = 'assertGt(address,bytes,uint)',
    ASSERT_LT = 'assertLt(address,bytes,uint,uint256)',
    ASSERT_EQ_REL = 'assertEqRel(address,bytes,uint,uint256)',
    ASSERT_EQ_ABS = 'assertEqAbs(address,bytes,uint,uint256)',
    ASSERT_GE = 'assertGe(address,bytes,uint)',
    ASSERT_LE = 'assertLe(address,bytes,uint)',
  }
  export namespace Args {
    export type ASSERT_GT = [actualTarget: string, bytes: BytesLike, expected: BigNumberish];
    export type ASSERT_LT = [actualTarget: string, bytes: BytesLike, expected: BigNumberish];
    export type ASSERT_EQ_REL = [
      actualTarget: string,
      bytes: BytesLike,
      expected: BigNumberish,
      relative: BigNumberish
    ];
    export type ASSERT_EQ_ABS = [
      actualTarget: string,
      bytes: BytesLike,
      expected: BigNumberish,
      absolute: BigNumberish
    ];
    export type ASSERT_GE = [actualTarget: string, bytes: BytesLike, expected: BigNumberish];
    export type ASSERT_LE = [actualTarget: string, bytes: BytesLike, expected: BigNumberish];
  }
}

export const useAssert = () => {
  const contracts = useContracts();
  const { address: account } = useAccount();
  const { chain } = useNetwork();

  const encodeBalanceCall = (targetAddress: string, tokenIdentifier: string | number | undefined = undefined) => {
    if (targetAddress) {
      const abi = tokenIdentifier ? erc1155ABI : erc20ABI;
      const args = tokenIdentifier ? [account, tokenIdentifier] : [account];
      const assetContract_ = new Contract(targetAddress, abi);
      return assetContract_.interface.encodeFunctionData('balanceOf', args);
    }
    /* if no address provided, assume the balance is the native balance and get the users ETH balance via a multical3 contract */
    const contract_ = new Contract(chain?.contracts?.multicall3?.address!, multiCallFragment);
    return contract_.interface.encodeFunctionData('getEthBalance', [account]); // this calls the helper contract -> because we are looking for an ETH/Native balance;
  };

  const assert = (
    address: string,
    encodedCallBytes: any,
    assertFn: AssertActions.Fn,
    expectedVal: BigNumber,
    relOrAbsVal: BigNumber = ZERO_BN,
    ignoreIf: boolean = false
  ): ICallData[] => {
    if (!contracts) return [];

    const AssertContract = contracts.get(ContractNames.ASSERT);

    return [
      {
        operation: LadleActions.Fn.ROUTE,
        args: relOrAbsVal.gt(ZERO_BN)
          ? [address, encodedCallBytes, expectedVal, relOrAbsVal]
          : [address, encodedCallBytes, expectedVal],
        fnName: assertFn,
        targetContract: AssertContract,
        ignoreIf,
      },
    ];
  };

  /* if there is a destination 'to' then use the ladle module (wrapEtherModule) */
  return { assert, encodeBalanceCall };
};

const multiCallFragment = [
  {
    inputs: [{ internalType: 'address', name: 'addr', type: 'address' }],
    name: 'getEthBalance',
    outputs: [{ internalType: 'uint256', name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const erc1155ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];
