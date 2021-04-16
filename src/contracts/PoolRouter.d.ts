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
  Contract,
  ContractTransaction,
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface PoolRouterInterface extends ethers.utils.Interface {
  functions: {
    "batch(address[],address[],uint8[],uint8[],bytes[])": FunctionFragment;
    "exitEther(address)": FunctionFragment;
    "factory()": FunctionFragment;
    "forwardDaiPermit(address,address,address,uint256,uint256,bool,uint8,bytes32,bytes32)": FunctionFragment;
    "forwardPermit(address,address,address,address,uint256,uint256,uint8,bytes32,bytes32)": FunctionFragment;
    "joinEther(address,address)": FunctionFragment;
    "multicall(bytes[],bool)": FunctionFragment;
    "route(address,address,bytes)": FunctionFragment;
    "transferToPool(address,address,address,uint128)": FunctionFragment;
    "weth()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "batch",
    values: [string[], string[], BigNumberish[], BigNumberish[], BytesLike[]]
  ): string;
  encodeFunctionData(functionFragment: "exitEther", values: [string]): string;
  encodeFunctionData(functionFragment: "factory", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "forwardDaiPermit",
    values: [
      string,
      string,
      string,
      BigNumberish,
      BigNumberish,
      boolean,
      BigNumberish,
      BytesLike,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "forwardPermit",
    values: [
      string,
      string,
      string,
      string,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BytesLike,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "joinEther",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "multicall",
    values: [BytesLike[], boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "route",
    values: [string, string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "transferToPool",
    values: [string, string, string, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "weth", values?: undefined): string;

  decodeFunctionResult(functionFragment: "batch", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "exitEther", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "factory", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "forwardDaiPermit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "forwardPermit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "joinEther", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "multicall", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "route", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "transferToPool",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "weth", data: BytesLike): Result;

  events: {};
}

export class PoolRouter extends Contract {
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

  interface: PoolRouterInterface;

  functions: {
    batch(
      bases: string[],
      fyTokens: string[],
      targets: BigNumberish[],
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "batch(address[],address[],uint8[],uint8[],bytes[])"(
      bases: string[],
      fyTokens: string[],
      targets: BigNumberish[],
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    exitEther(
      to: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "exitEther(address)"(
      to: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    factory(overrides?: CallOverrides): Promise<[string]>;

    "factory()"(overrides?: CallOverrides): Promise<[string]>;

    forwardDaiPermit(
      base: string,
      fyToken: string,
      spender: string,
      nonce: BigNumberish,
      deadline: BigNumberish,
      allowed: boolean,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "forwardDaiPermit(address,address,address,uint256,uint256,bool,uint8,bytes32,bytes32)"(
      base: string,
      fyToken: string,
      spender: string,
      nonce: BigNumberish,
      deadline: BigNumberish,
      allowed: boolean,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    forwardPermit(
      base: string,
      fyToken: string,
      token: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "forwardPermit(address,address,address,address,uint256,uint256,uint8,bytes32,bytes32)"(
      base: string,
      fyToken: string,
      token: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    joinEther(
      base: string,
      fyToken: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "joinEther(address,address)"(
      base: string,
      fyToken: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    multicall(
      calls: BytesLike[],
      revertOnFail: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "multicall(bytes[],bool)"(
      calls: BytesLike[],
      revertOnFail: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    route(
      base: string,
      fyToken: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "route(address,address,bytes)"(
      base: string,
      fyToken: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    transferToPool(
      base: string,
      fyToken: string,
      token: string,
      wad: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "transferToPool(address,address,address,uint128)"(
      base: string,
      fyToken: string,
      token: string,
      wad: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    weth(overrides?: CallOverrides): Promise<[string]>;

    "weth()"(overrides?: CallOverrides): Promise<[string]>;
  };

  batch(
    bases: string[],
    fyTokens: string[],
    targets: BigNumberish[],
    operations: BigNumberish[],
    data: BytesLike[],
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "batch(address[],address[],uint8[],uint8[],bytes[])"(
    bases: string[],
    fyTokens: string[],
    targets: BigNumberish[],
    operations: BigNumberish[],
    data: BytesLike[],
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  exitEther(
    to: string,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "exitEther(address)"(
    to: string,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  factory(overrides?: CallOverrides): Promise<string>;

  "factory()"(overrides?: CallOverrides): Promise<string>;

  forwardDaiPermit(
    base: string,
    fyToken: string,
    spender: string,
    nonce: BigNumberish,
    deadline: BigNumberish,
    allowed: boolean,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "forwardDaiPermit(address,address,address,uint256,uint256,bool,uint8,bytes32,bytes32)"(
    base: string,
    fyToken: string,
    spender: string,
    nonce: BigNumberish,
    deadline: BigNumberish,
    allowed: boolean,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  forwardPermit(
    base: string,
    fyToken: string,
    token: string,
    spender: string,
    amount: BigNumberish,
    deadline: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "forwardPermit(address,address,address,address,uint256,uint256,uint8,bytes32,bytes32)"(
    base: string,
    fyToken: string,
    token: string,
    spender: string,
    amount: BigNumberish,
    deadline: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  joinEther(
    base: string,
    fyToken: string,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "joinEther(address,address)"(
    base: string,
    fyToken: string,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  multicall(
    calls: BytesLike[],
    revertOnFail: boolean,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "multicall(bytes[],bool)"(
    calls: BytesLike[],
    revertOnFail: boolean,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  route(
    base: string,
    fyToken: string,
    data: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "route(address,address,bytes)"(
    base: string,
    fyToken: string,
    data: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  transferToPool(
    base: string,
    fyToken: string,
    token: string,
    wad: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "transferToPool(address,address,address,uint128)"(
    base: string,
    fyToken: string,
    token: string,
    wad: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  weth(overrides?: CallOverrides): Promise<string>;

  "weth()"(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    batch(
      bases: string[],
      fyTokens: string[],
      targets: BigNumberish[],
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<void>;

    "batch(address[],address[],uint8[],uint8[],bytes[])"(
      bases: string[],
      fyTokens: string[],
      targets: BigNumberish[],
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<void>;

    exitEther(to: string, overrides?: CallOverrides): Promise<BigNumber>;

    "exitEther(address)"(
      to: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    factory(overrides?: CallOverrides): Promise<string>;

    "factory()"(overrides?: CallOverrides): Promise<string>;

    forwardDaiPermit(
      base: string,
      fyToken: string,
      spender: string,
      nonce: BigNumberish,
      deadline: BigNumberish,
      allowed: boolean,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "forwardDaiPermit(address,address,address,uint256,uint256,bool,uint8,bytes32,bytes32)"(
      base: string,
      fyToken: string,
      spender: string,
      nonce: BigNumberish,
      deadline: BigNumberish,
      allowed: boolean,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    forwardPermit(
      base: string,
      fyToken: string,
      token: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "forwardPermit(address,address,address,address,uint256,uint256,uint8,bytes32,bytes32)"(
      base: string,
      fyToken: string,
      token: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    joinEther(
      base: string,
      fyToken: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "joinEther(address,address)"(
      base: string,
      fyToken: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    multicall(
      calls: BytesLike[],
      revertOnFail: boolean,
      overrides?: CallOverrides
    ): Promise<
      [boolean[], string[]] & { successes: boolean[]; results: string[] }
    >;

    "multicall(bytes[],bool)"(
      calls: BytesLike[],
      revertOnFail: boolean,
      overrides?: CallOverrides
    ): Promise<
      [boolean[], string[]] & { successes: boolean[]; results: string[] }
    >;

    route(
      base: string,
      fyToken: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean, string] & { success: boolean; result: string }>;

    "route(address,address,bytes)"(
      base: string,
      fyToken: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean, string] & { success: boolean; result: string }>;

    transferToPool(
      base: string,
      fyToken: string,
      token: string,
      wad: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "transferToPool(address,address,address,uint128)"(
      base: string,
      fyToken: string,
      token: string,
      wad: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    weth(overrides?: CallOverrides): Promise<string>;

    "weth()"(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    batch(
      bases: string[],
      fyTokens: string[],
      targets: BigNumberish[],
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "batch(address[],address[],uint8[],uint8[],bytes[])"(
      bases: string[],
      fyTokens: string[],
      targets: BigNumberish[],
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    exitEther(
      to: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "exitEther(address)"(
      to: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    factory(overrides?: CallOverrides): Promise<BigNumber>;

    "factory()"(overrides?: CallOverrides): Promise<BigNumber>;

    forwardDaiPermit(
      base: string,
      fyToken: string,
      spender: string,
      nonce: BigNumberish,
      deadline: BigNumberish,
      allowed: boolean,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "forwardDaiPermit(address,address,address,uint256,uint256,bool,uint8,bytes32,bytes32)"(
      base: string,
      fyToken: string,
      spender: string,
      nonce: BigNumberish,
      deadline: BigNumberish,
      allowed: boolean,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    forwardPermit(
      base: string,
      fyToken: string,
      token: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "forwardPermit(address,address,address,address,uint256,uint256,uint8,bytes32,bytes32)"(
      base: string,
      fyToken: string,
      token: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    joinEther(
      base: string,
      fyToken: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "joinEther(address,address)"(
      base: string,
      fyToken: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    multicall(
      calls: BytesLike[],
      revertOnFail: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "multicall(bytes[],bool)"(
      calls: BytesLike[],
      revertOnFail: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    route(
      base: string,
      fyToken: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "route(address,address,bytes)"(
      base: string,
      fyToken: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    transferToPool(
      base: string,
      fyToken: string,
      token: string,
      wad: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "transferToPool(address,address,address,uint128)"(
      base: string,
      fyToken: string,
      token: string,
      wad: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    weth(overrides?: CallOverrides): Promise<BigNumber>;

    "weth()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    batch(
      bases: string[],
      fyTokens: string[],
      targets: BigNumberish[],
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "batch(address[],address[],uint8[],uint8[],bytes[])"(
      bases: string[],
      fyTokens: string[],
      targets: BigNumberish[],
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    exitEther(
      to: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "exitEther(address)"(
      to: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    factory(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "factory()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    forwardDaiPermit(
      base: string,
      fyToken: string,
      spender: string,
      nonce: BigNumberish,
      deadline: BigNumberish,
      allowed: boolean,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "forwardDaiPermit(address,address,address,uint256,uint256,bool,uint8,bytes32,bytes32)"(
      base: string,
      fyToken: string,
      spender: string,
      nonce: BigNumberish,
      deadline: BigNumberish,
      allowed: boolean,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    forwardPermit(
      base: string,
      fyToken: string,
      token: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "forwardPermit(address,address,address,address,uint256,uint256,uint8,bytes32,bytes32)"(
      base: string,
      fyToken: string,
      token: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    joinEther(
      base: string,
      fyToken: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "joinEther(address,address)"(
      base: string,
      fyToken: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    multicall(
      calls: BytesLike[],
      revertOnFail: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "multicall(bytes[],bool)"(
      calls: BytesLike[],
      revertOnFail: boolean,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    route(
      base: string,
      fyToken: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "route(address,address,bytes)"(
      base: string,
      fyToken: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    transferToPool(
      base: string,
      fyToken: string,
      token: string,
      wad: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "transferToPool(address,address,address,uint128)"(
      base: string,
      fyToken: string,
      token: string,
      wad: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    weth(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "weth()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
