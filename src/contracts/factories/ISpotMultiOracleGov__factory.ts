/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from 'ethers';
import { Provider } from '@ethersproject/providers';
import type { ISpotMultiOracleGov, ISpotMultiOracleGovInterface } from '../ISpotMultiOracleGov';

const _abi = [
  {
    inputs: [
      {
        internalType: 'bytes6',
        name: '',
        type: 'bytes6',
      },
      {
        internalType: 'bytes6',
        name: '',
        type: 'bytes6',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'setSource',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export class ISpotMultiOracleGov__factory {
  static readonly abi = _abi;
  static createInterface(): ISpotMultiOracleGovInterface {
    return new utils.Interface(_abi) as ISpotMultiOracleGovInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): ISpotMultiOracleGov {
    return new Contract(address, _abi, signerOrProvider) as ISpotMultiOracleGov;
  }
}
