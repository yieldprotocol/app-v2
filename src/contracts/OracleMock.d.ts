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

interface OracleMockInterface extends ethers.utils.Interface {
  functions: {
    "decimals()": FunctionFragment;
    "get(bytes32,bytes32,uint256)": FunctionFragment;
    "peek(bytes32,bytes32,uint256)": FunctionFragment;
    "set(uint256)": FunctionFragment;
    "source()": FunctionFragment;
    "spot()": FunctionFragment;
    "updated()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "decimals", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "get",
    values: [BytesLike, BytesLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "peek",
    values: [BytesLike, BytesLike, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "set", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "source", values?: undefined): string;
  encodeFunctionData(functionFragment: "spot", values?: undefined): string;
  encodeFunctionData(functionFragment: "updated", values?: undefined): string;

  decodeFunctionResult(functionFragment: "decimals", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "get", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "peek", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "set", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "source", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "spot", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "updated", data: BytesLike): Result;

  events: {};
}

export class OracleMock extends BaseContract {
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

  interface: OracleMockInterface;

  functions: {
    decimals(overrides?: CallOverrides): Promise<[number]>;

    get(
      arg0: BytesLike,
      arg1: BytesLike,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    peek(
      arg0: BytesLike,
      arg1: BytesLike,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    set(
      spot_: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    source(overrides?: CallOverrides): Promise<[string]>;

    spot(overrides?: CallOverrides): Promise<[BigNumber]>;

    updated(overrides?: CallOverrides): Promise<[BigNumber]>;
  };

  decimals(overrides?: CallOverrides): Promise<number>;

  get(
    arg0: BytesLike,
    arg1: BytesLike,
    amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  peek(
    arg0: BytesLike,
    arg1: BytesLike,
    amount: BigNumberish,
    overrides?: CallOverrides
  ): Promise<[BigNumber, BigNumber]>;

  set(
    spot_: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  source(overrides?: CallOverrides): Promise<string>;

  spot(overrides?: CallOverrides): Promise<BigNumber>;

  updated(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    decimals(overrides?: CallOverrides): Promise<number>;

    get(
      arg0: BytesLike,
      arg1: BytesLike,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    peek(
      arg0: BytesLike,
      arg1: BytesLike,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    set(spot_: BigNumberish, overrides?: CallOverrides): Promise<void>;

    source(overrides?: CallOverrides): Promise<string>;

    spot(overrides?: CallOverrides): Promise<BigNumber>;

    updated(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    decimals(overrides?: CallOverrides): Promise<BigNumber>;

    get(
      arg0: BytesLike,
      arg1: BytesLike,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    peek(
      arg0: BytesLike,
      arg1: BytesLike,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    set(
      spot_: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    source(overrides?: CallOverrides): Promise<BigNumber>;

    spot(overrides?: CallOverrides): Promise<BigNumber>;

    updated(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    decimals(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    get(
      arg0: BytesLike,
      arg1: BytesLike,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    peek(
      arg0: BytesLike,
      arg1: BytesLike,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    set(
      spot_: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    source(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    spot(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    updated(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
