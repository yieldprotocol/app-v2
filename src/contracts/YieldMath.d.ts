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
  CallOverrides,
} from 'ethers';
import { BytesLike } from '@ethersproject/bytes';
import { Listener, Provider } from '@ethersproject/providers';
import { FunctionFragment, EventFragment, Result } from '@ethersproject/abi';
import { TypedEventFilter, TypedEvent, TypedListener } from './commons';

interface YieldMathInterface extends ethers.utils.Interface {
  functions: {
    'MAX()': FunctionFragment;
    'ONE()': FunctionFragment;
    'baseInForFYTokenOut(uint128,uint128,uint128,uint128,int128,int128)': FunctionFragment;
    'baseOutForFYTokenIn(uint128,uint128,uint128,uint128,int128,int128)': FunctionFragment;
    'fyTokenInForBaseOut(uint128,uint128,uint128,uint128,int128,int128)': FunctionFragment;
    'fyTokenOutForBaseIn(uint128,uint128,uint128,uint128,int128,int128)': FunctionFragment;
    'initialReservesValue(uint128,uint128,uint128,int128,int128)': FunctionFragment;
  };

  encodeFunctionData(functionFragment: 'MAX', values?: undefined): string;
  encodeFunctionData(functionFragment: 'ONE', values?: undefined): string;
  encodeFunctionData(
    functionFragment: 'baseInForFYTokenOut',
    values: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: 'baseOutForFYTokenIn',
    values: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: 'fyTokenInForBaseOut',
    values: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: 'fyTokenOutForBaseIn',
    values: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: 'initialReservesValue',
    values: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: 'MAX', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'ONE', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'baseInForFYTokenOut', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'baseOutForFYTokenIn', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'fyTokenInForBaseOut', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'fyTokenOutForBaseIn', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'initialReservesValue', data: BytesLike): Result;

  events: {};
}

export class YieldMath extends BaseContract {
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

  interface: YieldMathInterface;

  functions: {
    MAX(overrides?: CallOverrides): Promise<[BigNumber]>;

    ONE(overrides?: CallOverrides): Promise<[BigNumber]>;

    baseInForFYTokenOut(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      fyTokenAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    baseOutForFYTokenIn(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      fyTokenAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    fyTokenInForBaseOut(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      baseAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    fyTokenOutForBaseIn(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      baseAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    initialReservesValue(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      c0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;
  };

  MAX(overrides?: CallOverrides): Promise<BigNumber>;

  ONE(overrides?: CallOverrides): Promise<BigNumber>;

  baseInForFYTokenOut(
    baseReserves: BigNumberish,
    fyTokenReserves: BigNumberish,
    fyTokenAmount: BigNumberish,
    timeTillMaturity: BigNumberish,
    k: BigNumberish,
    g: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  baseOutForFYTokenIn(
    baseReserves: BigNumberish,
    fyTokenReserves: BigNumberish,
    fyTokenAmount: BigNumberish,
    timeTillMaturity: BigNumberish,
    k: BigNumberish,
    g: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  fyTokenInForBaseOut(
    baseReserves: BigNumberish,
    fyTokenReserves: BigNumberish,
    baseAmount: BigNumberish,
    timeTillMaturity: BigNumberish,
    k: BigNumberish,
    g: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  fyTokenOutForBaseIn(
    baseReserves: BigNumberish,
    fyTokenReserves: BigNumberish,
    baseAmount: BigNumberish,
    timeTillMaturity: BigNumberish,
    k: BigNumberish,
    g: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  initialReservesValue(
    baseReserves: BigNumberish,
    fyTokenReserves: BigNumberish,
    timeTillMaturity: BigNumberish,
    k: BigNumberish,
    c0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  callStatic: {
    MAX(overrides?: CallOverrides): Promise<BigNumber>;

    ONE(overrides?: CallOverrides): Promise<BigNumber>;

    baseInForFYTokenOut(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      fyTokenAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    baseOutForFYTokenIn(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      fyTokenAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    fyTokenInForBaseOut(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      baseAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    fyTokenOutForBaseIn(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      baseAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initialReservesValue(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      c0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    MAX(overrides?: CallOverrides): Promise<BigNumber>;

    ONE(overrides?: CallOverrides): Promise<BigNumber>;

    baseInForFYTokenOut(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      fyTokenAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    baseOutForFYTokenIn(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      fyTokenAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    fyTokenInForBaseOut(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      baseAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    fyTokenOutForBaseIn(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      baseAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initialReservesValue(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      c0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    MAX(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ONE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    baseInForFYTokenOut(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      fyTokenAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    baseOutForFYTokenIn(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      fyTokenAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    fyTokenInForBaseOut(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      baseAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    fyTokenOutForBaseIn(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      baseAmount: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      g: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initialReservesValue(
      baseReserves: BigNumberish,
      fyTokenReserves: BigNumberish,
      timeTillMaturity: BigNumberish,
      k: BigNumberish,
      c0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
