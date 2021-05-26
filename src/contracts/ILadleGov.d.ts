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

interface ILadleGovInterface extends ethers.utils.Interface {
  functions: {
    "addJoin(bytes6,address)": FunctionFragment;
    "addPool(bytes6,address)": FunctionFragment;
    "joins(bytes6)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "addJoin",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "addPool",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(functionFragment: "joins", values: [BytesLike]): string;

  decodeFunctionResult(functionFragment: "addJoin", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "addPool", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "joins", data: BytesLike): Result;

  events: {};
}

export class ILadleGov extends BaseContract {
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

  interface: ILadleGovInterface;

  functions: {
    addJoin(
      arg0: BytesLike,
      arg1: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    addPool(
      arg0: BytesLike,
      arg1: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    joins(arg0: BytesLike, overrides?: CallOverrides): Promise<[string]>;
  };

  addJoin(
    arg0: BytesLike,
    arg1: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  addPool(
    arg0: BytesLike,
    arg1: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  joins(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

  callStatic: {
    addJoin(
      arg0: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<void>;

    addPool(
      arg0: BytesLike,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<void>;

    joins(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    addJoin(
      arg0: BytesLike,
      arg1: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    addPool(
      arg0: BytesLike,
      arg1: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    joins(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    addJoin(
      arg0: BytesLike,
      arg1: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    addPool(
      arg0: BytesLike,
      arg1: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    joins(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
