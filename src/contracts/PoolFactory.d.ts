/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from 'ethers';
import { BytesLike } from '@ethersproject/bytes';
import { Listener, Provider } from '@ethersproject/providers';
import { FunctionFragment, EventFragment, Result } from '@ethersproject/abi';
import { TypedEventFilter, TypedEvent, TypedListener } from './commons';

interface PoolFactoryInterface extends ethers.utils.Interface {
  functions: {
    'POOL_BYTECODE_HASH()': FunctionFragment;
    'calculatePoolAddress(address,address)': FunctionFragment;
    'createPool(address,address)': FunctionFragment;
    'getPool(address,address)': FunctionFragment;
    'nextBase()': FunctionFragment;
    'nextFYToken()': FunctionFragment;
  };

  encodeFunctionData(functionFragment: 'POOL_BYTECODE_HASH', values?: undefined): string;
  encodeFunctionData(functionFragment: 'calculatePoolAddress', values: [string, string]): string;
  encodeFunctionData(functionFragment: 'createPool', values: [string, string]): string;
  encodeFunctionData(functionFragment: 'getPool', values: [string, string]): string;
  encodeFunctionData(functionFragment: 'nextBase', values?: undefined): string;
  encodeFunctionData(functionFragment: 'nextFYToken', values?: undefined): string;

  decodeFunctionResult(functionFragment: 'POOL_BYTECODE_HASH', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'calculatePoolAddress', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'createPool', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'getPool', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'nextBase', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'nextFYToken', data: BytesLike): Result;

  events: {
    'PoolCreated(address,address,address)': EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: 'PoolCreated'): EventFragment;
}

export class PoolFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: PoolFactoryInterface;

  functions: {
    POOL_BYTECODE_HASH(overrides?: CallOverrides): Promise<[string]>;

    calculatePoolAddress(base: string, fyToken: string, overrides?: CallOverrides): Promise<[string]>;

    createPool(
      base: string,
      fyToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getPool(base: string, fyToken: string, overrides?: CallOverrides): Promise<[string] & { pool: string }>;

    nextBase(overrides?: CallOverrides): Promise<[string]>;

    nextFYToken(overrides?: CallOverrides): Promise<[string]>;
  };

  POOL_BYTECODE_HASH(overrides?: CallOverrides): Promise<string>;

  calculatePoolAddress(base: string, fyToken: string, overrides?: CallOverrides): Promise<string>;

  createPool(
    base: string,
    fyToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getPool(base: string, fyToken: string, overrides?: CallOverrides): Promise<string>;

  nextBase(overrides?: CallOverrides): Promise<string>;

  nextFYToken(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    POOL_BYTECODE_HASH(overrides?: CallOverrides): Promise<string>;

    calculatePoolAddress(base: string, fyToken: string, overrides?: CallOverrides): Promise<string>;

    createPool(base: string, fyToken: string, overrides?: CallOverrides): Promise<string>;

    getPool(base: string, fyToken: string, overrides?: CallOverrides): Promise<string>;

    nextBase(overrides?: CallOverrides): Promise<string>;

    nextFYToken(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    PoolCreated(
      base?: string | null,
      fyToken?: string | null,
      pool?: null
    ): TypedEventFilter<[string, string, string], { base: string; fyToken: string; pool: string }>;
  };

  estimateGas: {
    POOL_BYTECODE_HASH(overrides?: CallOverrides): Promise<BigNumber>;

    calculatePoolAddress(base: string, fyToken: string, overrides?: CallOverrides): Promise<BigNumber>;

    createPool(
      base: string,
      fyToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getPool(base: string, fyToken: string, overrides?: CallOverrides): Promise<BigNumber>;

    nextBase(overrides?: CallOverrides): Promise<BigNumber>;

    nextFYToken(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    POOL_BYTECODE_HASH(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    calculatePoolAddress(base: string, fyToken: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    createPool(
      base: string,
      fyToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getPool(base: string, fyToken: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    nextBase(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    nextFYToken(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
