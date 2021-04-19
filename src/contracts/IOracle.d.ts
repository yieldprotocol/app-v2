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
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface IOracleInterface extends ethers.utils.Interface {
  functions: {
    "get()": FunctionFragment;
    "peek()": FunctionFragment;
    "source()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "get", values?: undefined): string;
  encodeFunctionData(functionFragment: "peek", values?: undefined): string;
  encodeFunctionData(functionFragment: "source", values?: undefined): string;

  decodeFunctionResult(functionFragment: "get", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "peek", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "source", data: BytesLike): Result;

  events: {};
}

export class IOracle extends Contract {
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

  interface: IOracleInterface;

  functions: {
    get(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "get()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    peek(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { price: BigNumber; updateTime: BigNumber }
    >;

    "peek()"(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { price: BigNumber; updateTime: BigNumber }
    >;

    source(overrides?: CallOverrides): Promise<[string]>;

    "source()"(overrides?: CallOverrides): Promise<[string]>;
  };

  get(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "get()"(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  peek(
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber] & { price: BigNumber; updateTime: BigNumber }
  >;

  "peek()"(
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber] & { price: BigNumber; updateTime: BigNumber }
  >;

  source(overrides?: CallOverrides): Promise<string>;

  "source()"(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    get(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { price: BigNumber; updateTime: BigNumber }
    >;

    "get()"(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { price: BigNumber; updateTime: BigNumber }
    >;

    peek(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { price: BigNumber; updateTime: BigNumber }
    >;

    "peek()"(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { price: BigNumber; updateTime: BigNumber }
    >;

    source(overrides?: CallOverrides): Promise<string>;

    "source()"(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    get(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "get()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    peek(overrides?: CallOverrides): Promise<BigNumber>;

    "peek()"(overrides?: CallOverrides): Promise<BigNumber>;

    source(overrides?: CallOverrides): Promise<BigNumber>;

    "source()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    get(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "get()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    peek(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "peek()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    source(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "source()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
