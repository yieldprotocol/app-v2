/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IOracle, IOracleInterface } from "../IOracle";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "base",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "quote",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "get",
    outputs: [
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "updateTime",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "base",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "quote",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "peek",
    outputs: [
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "updateTime",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class IOracle__factory {
  static readonly abi = _abi;
  static createInterface(): IOracleInterface {
    return new utils.Interface(_abi) as IOracleInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IOracle {
    return new Contract(address, _abi, signerOrProvider) as IOracle;
  }
}
