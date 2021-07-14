/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { JoinFactory, JoinFactoryInterface } from "../JoinFactory";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "pool",
        type: "address",
      },
    ],
    name: "JoinCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "createJoin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class JoinFactory__factory {
  static readonly abi = _abi;
  static createInterface(): JoinFactoryInterface {
    return new utils.Interface(_abi) as JoinFactoryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): JoinFactory {
    return new Contract(address, _abi, signerOrProvider) as JoinFactory;
  }
}
