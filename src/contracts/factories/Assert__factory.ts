/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { Assert, AssertInterface } from "../Assert";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "expectedTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "expectedCalldata",
        type: "bytes",
      },
    ],
    name: "assertEq",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "actual",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "expected",
        type: "bytes",
      },
    ],
    name: "assertEq",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "actual",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
    ],
    name: "assertEq",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
    ],
    name: "assertEq",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "actual",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "expected",
        type: "bool",
      },
    ],
    name: "assertEq",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "expectedTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "expectedCalldata",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "abs",
        type: "uint256",
      },
    ],
    name: "assertEqAbs",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "abs",
        type: "uint256",
      },
    ],
    name: "assertEqAbs",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "actual",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "abs",
        type: "uint256",
      },
    ],
    name: "assertEqAbs",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "rel",
        type: "uint256",
      },
    ],
    name: "assertEqRel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "actual",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "rel",
        type: "uint256",
      },
    ],
    name: "assertEqRel",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "expectedTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "expectedCalldata",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "rel",
        type: "uint256",
      },
    ],
    name: "assertEqRel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "expectedTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "expectedCalldata",
        type: "bytes",
      },
    ],
    name: "assertGe",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "actual",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
    ],
    name: "assertGe",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
    ],
    name: "assertGe",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "expectedTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "expectedCalldata",
        type: "bytes",
      },
    ],
    name: "assertGt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
    ],
    name: "assertGt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "actual",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
    ],
    name: "assertGt",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
    ],
    name: "assertLe",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "actual",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
    ],
    name: "assertLe",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "expectedTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "expectedCalldata",
        type: "bytes",
      },
    ],
    name: "assertLe",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
    ],
    name: "assertLt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "actual",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
    ],
    name: "assertLt",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "actualTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "actualCalldata",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "expectedTarget",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "expectedCalldata",
        type: "bytes",
      },
    ],
    name: "assertLt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class Assert__factory {
  static readonly abi = _abi;
  static createInterface(): AssertInterface {
    return new utils.Interface(_abi) as AssertInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Assert {
    return new Contract(address, _abi, signerOrProvider) as Assert;
  }
}
