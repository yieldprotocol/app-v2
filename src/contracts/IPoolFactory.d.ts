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
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface IPoolFactoryInterface extends ethers.utils.Interface {
  functions: {
    "POOL_BYTECODE_HASH()": FunctionFragment;
    "calculatePoolAddress(address,address)": FunctionFragment;
    "createPool(address,address)": FunctionFragment;
    "getPool(address,address)": FunctionFragment;
    "nextFYToken()": FunctionFragment;
    "nextToken()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "POOL_BYTECODE_HASH",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "calculatePoolAddress",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "createPool",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "getPool",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "nextFYToken",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "nextToken", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "POOL_BYTECODE_HASH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "calculatePoolAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "createPool", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getPool", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "nextFYToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "nextToken", data: BytesLike): Result;

  events: {
    "PoolCreated(address,address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "PoolCreated"): EventFragment;
}

export class IPoolFactory extends BaseContract {
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

  interface: IPoolFactoryInterface;

  functions: {
    POOL_BYTECODE_HASH(overrides?: CallOverrides): Promise<[string]>;

    calculatePoolAddress(
      token: string,
      fyToken: string,
      overrides?: CallOverrides
    ): Promise<[string]>;

    createPool(
      token: string,
      fyToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getPool(
      token: string,
      fyToken: string,
      overrides?: CallOverrides
    ): Promise<[string]>;

    nextFYToken(overrides?: CallOverrides): Promise<[string]>;

    nextToken(overrides?: CallOverrides): Promise<[string]>;
  };

  POOL_BYTECODE_HASH(overrides?: CallOverrides): Promise<string>;

  calculatePoolAddress(
    token: string,
    fyToken: string,
    overrides?: CallOverrides
  ): Promise<string>;

  createPool(
    token: string,
    fyToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getPool(
    token: string,
    fyToken: string,
    overrides?: CallOverrides
  ): Promise<string>;

  nextFYToken(overrides?: CallOverrides): Promise<string>;

  nextToken(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    POOL_BYTECODE_HASH(overrides?: CallOverrides): Promise<string>;

    calculatePoolAddress(
      token: string,
      fyToken: string,
      overrides?: CallOverrides
    ): Promise<string>;

    createPool(
      token: string,
      fyToken: string,
      overrides?: CallOverrides
    ): Promise<string>;

    getPool(
      token: string,
      fyToken: string,
      overrides?: CallOverrides
    ): Promise<string>;

    nextFYToken(overrides?: CallOverrides): Promise<string>;

    nextToken(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    PoolCreated(
      baseToken?: string | null,
      fyToken?: string | null,
      pool?: null
    ): TypedEventFilter<
      [string, string, string],
      { baseToken: string; fyToken: string; pool: string }
    >;
  };

  estimateGas: {
    POOL_BYTECODE_HASH(overrides?: CallOverrides): Promise<BigNumber>;

    calculatePoolAddress(
      token: string,
      fyToken: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    createPool(
      token: string,
      fyToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getPool(
      token: string,
      fyToken: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    nextFYToken(overrides?: CallOverrides): Promise<BigNumber>;

    nextToken(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    POOL_BYTECODE_HASH(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    calculatePoolAddress(
      token: string,
      fyToken: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    createPool(
      token: string,
      fyToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getPool(
      token: string,
      fyToken: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    nextFYToken(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    nextToken(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
