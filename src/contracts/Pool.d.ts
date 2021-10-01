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

interface PoolInterface extends ethers.utils.Interface {
  functions: {
    "DOMAIN_SEPARATOR()": FunctionFragment;
    "PERMIT_TYPEHASH()": FunctionFragment;
    "allowance(address,address)": FunctionFragment;
    "approve(address,uint256)": FunctionFragment;
    "balanceOf(address)": FunctionFragment;
    "base()": FunctionFragment;
    "burn(address,address,uint256,uint256)": FunctionFragment;
    "burnForBase(address,uint256)": FunctionFragment;
    "buyBase(address,uint128,uint128)": FunctionFragment;
    "buyBasePreview(uint128)": FunctionFragment;
    "buyFYToken(address,uint128,uint128)": FunctionFragment;
    "buyFYTokenPreview(uint128)": FunctionFragment;
    "cumulativeBalancesRatio()": FunctionFragment;
    "decimals()": FunctionFragment;
    "deploymentChainId()": FunctionFragment;
    "fyToken()": FunctionFragment;
    "g1()": FunctionFragment;
    "g2()": FunctionFragment;
    "getBaseBalance()": FunctionFragment;
    "getCache()": FunctionFragment;
    "getFYTokenBalance()": FunctionFragment;
    "invariant()": FunctionFragment;
    "maturity()": FunctionFragment;
    "mint(address,bool,uint256)": FunctionFragment;
    "mintWithBase(address,uint256,uint256)": FunctionFragment;
    "name()": FunctionFragment;
    "nonces(address)": FunctionFragment;
    "permit(address,address,uint256,uint256,uint8,bytes32,bytes32)": FunctionFragment;
    "retrieveBase(address)": FunctionFragment;
    "retrieveFYToken(address)": FunctionFragment;
    "scaleFactor()": FunctionFragment;
    "sellBase(address,uint128)": FunctionFragment;
    "sellBasePreview(uint128)": FunctionFragment;
    "sellFYToken(address,uint128)": FunctionFragment;
    "sellFYTokenPreview(uint128)": FunctionFragment;
    "symbol()": FunctionFragment;
    "sync()": FunctionFragment;
    "totalSupply()": FunctionFragment;
    "transfer(address,uint256)": FunctionFragment;
    "transferFrom(address,address,uint256)": FunctionFragment;
    "ts()": FunctionFragment;
    "version()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "DOMAIN_SEPARATOR",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "PERMIT_TYPEHASH",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "allowance",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "approve",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "balanceOf", values: [string]): string;
  encodeFunctionData(functionFragment: "base", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "burn",
    values: [string, string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "burnForBase",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "buyBase",
    values: [string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "buyBasePreview",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "buyFYToken",
    values: [string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "buyFYTokenPreview",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "cumulativeBalancesRatio",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "decimals", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "deploymentChainId",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "fyToken", values?: undefined): string;
  encodeFunctionData(functionFragment: "g1", values?: undefined): string;
  encodeFunctionData(functionFragment: "g2", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getBaseBalance",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "getCache", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getFYTokenBalance",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "invariant", values?: undefined): string;
  encodeFunctionData(functionFragment: "maturity", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "mint",
    values: [string, boolean, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "mintWithBase",
    values: [string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "name", values?: undefined): string;
  encodeFunctionData(functionFragment: "nonces", values: [string]): string;
  encodeFunctionData(
    functionFragment: "permit",
    values: [
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
    functionFragment: "retrieveBase",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "retrieveFYToken",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "scaleFactor",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "sellBase",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "sellBasePreview",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "sellFYToken",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "sellFYTokenPreview",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "symbol", values?: undefined): string;
  encodeFunctionData(functionFragment: "sync", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "totalSupply",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transfer",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "transferFrom",
    values: [string, string, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "ts", values?: undefined): string;
  encodeFunctionData(functionFragment: "version", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "DOMAIN_SEPARATOR",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "PERMIT_TYPEHASH",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "allowance", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "base", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "burn", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "burnForBase",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "buyBase", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "buyBasePreview",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "buyFYToken", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "buyFYTokenPreview",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "cumulativeBalancesRatio",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "decimals", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "deploymentChainId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "fyToken", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "g1", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "g2", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getBaseBalance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getCache", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getFYTokenBalance",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "invariant", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "maturity", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "mint", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "mintWithBase",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "nonces", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "permit", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "retrieveBase",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "retrieveFYToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "scaleFactor",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "sellBase", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "sellBasePreview",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "sellFYToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "sellFYTokenPreview",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "symbol", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "sync", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "totalSupply",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "transfer", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "transferFrom",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "ts", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "version", data: BytesLike): Result;

  events: {
    "Approval(address,address,uint256)": EventFragment;
    "Liquidity(uint32,address,address,address,int256,int256,int256)": EventFragment;
    "Sync(uint112,uint112,uint256)": EventFragment;
    "Trade(uint32,address,address,int256,int256)": EventFragment;
    "Transfer(address,address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Approval"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Liquidity"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Sync"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Trade"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Transfer"): EventFragment;
}

export class Pool extends BaseContract {
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

  interface: PoolInterface;

  functions: {
    DOMAIN_SEPARATOR(overrides?: CallOverrides): Promise<[string]>;

    PERMIT_TYPEHASH(overrides?: CallOverrides): Promise<[string]>;

    allowance(
      owner: string,
      spender: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    approve(
      spender: string,
      wad: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    balanceOf(guy: string, overrides?: CallOverrides): Promise<[BigNumber]>;

    base(overrides?: CallOverrides): Promise<[string]>;

    burn(
      baseTo: string,
      fyTokenTo: string,
      minBaseOut: BigNumberish,
      minFYTokenOut: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    burnForBase(
      to: string,
      minBaseOut: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    buyBase(
      to: string,
      tokenOut: BigNumberish,
      max: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    buyBasePreview(
      tokenOut: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    buyFYToken(
      to: string,
      fyTokenOut: BigNumberish,
      max: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    buyFYTokenPreview(
      fyTokenOut: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    cumulativeBalancesRatio(overrides?: CallOverrides): Promise<[BigNumber]>;

    decimals(overrides?: CallOverrides): Promise<[number]>;

    deploymentChainId(overrides?: CallOverrides): Promise<[BigNumber]>;

    fyToken(overrides?: CallOverrides): Promise<[string]>;

    g1(overrides?: CallOverrides): Promise<[BigNumber]>;

    g2(overrides?: CallOverrides): Promise<[BigNumber]>;

    getBaseBalance(overrides?: CallOverrides): Promise<[BigNumber]>;

    getCache(
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber, number]>;

    getFYTokenBalance(overrides?: CallOverrides): Promise<[BigNumber]>;

    invariant(overrides?: CallOverrides): Promise<[BigNumber]>;

    maturity(overrides?: CallOverrides): Promise<[number]>;

    mint(
      to: string,
      calculateFromBase: boolean,
      minTokensMinted: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    mintWithBase(
      to: string,
      fyTokenToBuy: BigNumberish,
      minTokensMinted: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    name(overrides?: CallOverrides): Promise<[string]>;

    nonces(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;

    permit(
      owner: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    retrieveBase(
      to: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    retrieveFYToken(
      to: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    scaleFactor(overrides?: CallOverrides): Promise<[BigNumber]>;

    sellBase(
      to: string,
      min: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    sellBasePreview(
      baseIn: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    sellFYToken(
      to: string,
      min: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    sellFYTokenPreview(
      fyTokenIn: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    symbol(overrides?: CallOverrides): Promise<[string]>;

    sync(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    totalSupply(overrides?: CallOverrides): Promise<[BigNumber]>;

    transfer(
      dst: string,
      wad: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    transferFrom(
      src: string,
      dst: string,
      wad: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    ts(overrides?: CallOverrides): Promise<[BigNumber]>;

    version(overrides?: CallOverrides): Promise<[string]>;
  };

  DOMAIN_SEPARATOR(overrides?: CallOverrides): Promise<string>;

  PERMIT_TYPEHASH(overrides?: CallOverrides): Promise<string>;

  allowance(
    owner: string,
    spender: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  approve(
    spender: string,
    wad: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  balanceOf(guy: string, overrides?: CallOverrides): Promise<BigNumber>;

  base(overrides?: CallOverrides): Promise<string>;

  burn(
    baseTo: string,
    fyTokenTo: string,
    minBaseOut: BigNumberish,
    minFYTokenOut: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  burnForBase(
    to: string,
    minBaseOut: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  buyBase(
    to: string,
    tokenOut: BigNumberish,
    max: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  buyBasePreview(
    tokenOut: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  buyFYToken(
    to: string,
    fyTokenOut: BigNumberish,
    max: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  buyFYTokenPreview(
    fyTokenOut: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  cumulativeBalancesRatio(overrides?: CallOverrides): Promise<BigNumber>;

  decimals(overrides?: CallOverrides): Promise<number>;

  deploymentChainId(overrides?: CallOverrides): Promise<BigNumber>;

  fyToken(overrides?: CallOverrides): Promise<string>;

  g1(overrides?: CallOverrides): Promise<BigNumber>;

  g2(overrides?: CallOverrides): Promise<BigNumber>;

  getBaseBalance(overrides?: CallOverrides): Promise<BigNumber>;

  getCache(overrides?: CallOverrides): Promise<[BigNumber, BigNumber, number]>;

  getFYTokenBalance(overrides?: CallOverrides): Promise<BigNumber>;

  invariant(overrides?: CallOverrides): Promise<BigNumber>;

  maturity(overrides?: CallOverrides): Promise<number>;

  mint(
    to: string,
    calculateFromBase: boolean,
    minTokensMinted: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  mintWithBase(
    to: string,
    fyTokenToBuy: BigNumberish,
    minTokensMinted: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  name(overrides?: CallOverrides): Promise<string>;

  nonces(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

  permit(
    owner: string,
    spender: string,
    amount: BigNumberish,
    deadline: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  retrieveBase(
    to: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  retrieveFYToken(
    to: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  scaleFactor(overrides?: CallOverrides): Promise<BigNumber>;

  sellBase(
    to: string,
    min: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  sellBasePreview(
    baseIn: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  sellFYToken(
    to: string,
    min: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  sellFYTokenPreview(
    fyTokenIn: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  symbol(overrides?: CallOverrides): Promise<string>;

  sync(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

  transfer(
    dst: string,
    wad: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  transferFrom(
    src: string,
    dst: string,
    wad: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  ts(overrides?: CallOverrides): Promise<BigNumber>;

  version(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    DOMAIN_SEPARATOR(overrides?: CallOverrides): Promise<string>;

    PERMIT_TYPEHASH(overrides?: CallOverrides): Promise<string>;

    allowance(
      owner: string,
      spender: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    approve(
      spender: string,
      wad: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    balanceOf(guy: string, overrides?: CallOverrides): Promise<BigNumber>;

    base(overrides?: CallOverrides): Promise<string>;

    burn(
      baseTo: string,
      fyTokenTo: string,
      minBaseOut: BigNumberish,
      minFYTokenOut: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber, BigNumber]>;

    burnForBase(
      to: string,
      minBaseOut: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { tokensBurned: BigNumber; baseOut: BigNumber }
    >;

    buyBase(
      to: string,
      tokenOut: BigNumberish,
      max: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    buyBasePreview(
      tokenOut: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    buyFYToken(
      to: string,
      fyTokenOut: BigNumberish,
      max: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    buyFYTokenPreview(
      fyTokenOut: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    cumulativeBalancesRatio(overrides?: CallOverrides): Promise<BigNumber>;

    decimals(overrides?: CallOverrides): Promise<number>;

    deploymentChainId(overrides?: CallOverrides): Promise<BigNumber>;

    fyToken(overrides?: CallOverrides): Promise<string>;

    g1(overrides?: CallOverrides): Promise<BigNumber>;

    g2(overrides?: CallOverrides): Promise<BigNumber>;

    getBaseBalance(overrides?: CallOverrides): Promise<BigNumber>;

    getCache(
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber, number]>;

    getFYTokenBalance(overrides?: CallOverrides): Promise<BigNumber>;

    invariant(overrides?: CallOverrides): Promise<BigNumber>;

    maturity(overrides?: CallOverrides): Promise<number>;

    mint(
      to: string,
      calculateFromBase: boolean,
      minTokensMinted: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber, BigNumber]>;

    mintWithBase(
      to: string,
      fyTokenToBuy: BigNumberish,
      minTokensMinted: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber, BigNumber]>;

    name(overrides?: CallOverrides): Promise<string>;

    nonces(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    permit(
      owner: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    retrieveBase(to: string, overrides?: CallOverrides): Promise<BigNumber>;

    retrieveFYToken(to: string, overrides?: CallOverrides): Promise<BigNumber>;

    scaleFactor(overrides?: CallOverrides): Promise<BigNumber>;

    sellBase(
      to: string,
      min: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    sellBasePreview(
      baseIn: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    sellFYToken(
      to: string,
      min: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    sellFYTokenPreview(
      fyTokenIn: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    symbol(overrides?: CallOverrides): Promise<string>;

    sync(overrides?: CallOverrides): Promise<void>;

    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

    transfer(
      dst: string,
      wad: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    transferFrom(
      src: string,
      dst: string,
      wad: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    ts(overrides?: CallOverrides): Promise<BigNumber>;

    version(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    Approval(
      owner?: string | null,
      spender?: string | null,
      value?: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { owner: string; spender: string; value: BigNumber }
    >;

    Liquidity(
      maturity?: null,
      from?: string | null,
      to?: string | null,
      fyTokenTo?: string | null,
      bases?: null,
      fyTokens?: null,
      poolTokens?: null
    ): TypedEventFilter<
      [number, string, string, string, BigNumber, BigNumber, BigNumber],
      {
        maturity: number;
        from: string;
        to: string;
        fyTokenTo: string;
        bases: BigNumber;
        fyTokens: BigNumber;
        poolTokens: BigNumber;
      }
    >;

    Sync(
      baseCached?: null,
      fyTokenCached?: null,
      cumulativeBalancesRatio?: null
    ): TypedEventFilter<
      [BigNumber, BigNumber, BigNumber],
      {
        baseCached: BigNumber;
        fyTokenCached: BigNumber;
        cumulativeBalancesRatio: BigNumber;
      }
    >;

    Trade(
      maturity?: null,
      from?: string | null,
      to?: string | null,
      bases?: null,
      fyTokens?: null
    ): TypedEventFilter<
      [number, string, string, BigNumber, BigNumber],
      {
        maturity: number;
        from: string;
        to: string;
        bases: BigNumber;
        fyTokens: BigNumber;
      }
    >;

    Transfer(
      from?: string | null,
      to?: string | null,
      value?: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { from: string; to: string; value: BigNumber }
    >;
  };

  estimateGas: {
    DOMAIN_SEPARATOR(overrides?: CallOverrides): Promise<BigNumber>;

    PERMIT_TYPEHASH(overrides?: CallOverrides): Promise<BigNumber>;

    allowance(
      owner: string,
      spender: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    approve(
      spender: string,
      wad: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    balanceOf(guy: string, overrides?: CallOverrides): Promise<BigNumber>;

    base(overrides?: CallOverrides): Promise<BigNumber>;

    burn(
      baseTo: string,
      fyTokenTo: string,
      minBaseOut: BigNumberish,
      minFYTokenOut: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    burnForBase(
      to: string,
      minBaseOut: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    buyBase(
      to: string,
      tokenOut: BigNumberish,
      max: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    buyBasePreview(
      tokenOut: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    buyFYToken(
      to: string,
      fyTokenOut: BigNumberish,
      max: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    buyFYTokenPreview(
      fyTokenOut: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    cumulativeBalancesRatio(overrides?: CallOverrides): Promise<BigNumber>;

    decimals(overrides?: CallOverrides): Promise<BigNumber>;

    deploymentChainId(overrides?: CallOverrides): Promise<BigNumber>;

    fyToken(overrides?: CallOverrides): Promise<BigNumber>;

    g1(overrides?: CallOverrides): Promise<BigNumber>;

    g2(overrides?: CallOverrides): Promise<BigNumber>;

    getBaseBalance(overrides?: CallOverrides): Promise<BigNumber>;

    getCache(overrides?: CallOverrides): Promise<BigNumber>;

    getFYTokenBalance(overrides?: CallOverrides): Promise<BigNumber>;

    invariant(overrides?: CallOverrides): Promise<BigNumber>;

    maturity(overrides?: CallOverrides): Promise<BigNumber>;

    mint(
      to: string,
      calculateFromBase: boolean,
      minTokensMinted: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    mintWithBase(
      to: string,
      fyTokenToBuy: BigNumberish,
      minTokensMinted: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    name(overrides?: CallOverrides): Promise<BigNumber>;

    nonces(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    permit(
      owner: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    retrieveBase(
      to: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    retrieveFYToken(
      to: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    scaleFactor(overrides?: CallOverrides): Promise<BigNumber>;

    sellBase(
      to: string,
      min: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    sellBasePreview(
      baseIn: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    sellFYToken(
      to: string,
      min: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    sellFYTokenPreview(
      fyTokenIn: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    symbol(overrides?: CallOverrides): Promise<BigNumber>;

    sync(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

    transfer(
      dst: string,
      wad: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    transferFrom(
      src: string,
      dst: string,
      wad: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    ts(overrides?: CallOverrides): Promise<BigNumber>;

    version(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    DOMAIN_SEPARATOR(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    PERMIT_TYPEHASH(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    allowance(
      owner: string,
      spender: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    approve(
      spender: string,
      wad: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    balanceOf(
      guy: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    base(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    burn(
      baseTo: string,
      fyTokenTo: string,
      minBaseOut: BigNumberish,
      minFYTokenOut: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    burnForBase(
      to: string,
      minBaseOut: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    buyBase(
      to: string,
      tokenOut: BigNumberish,
      max: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    buyBasePreview(
      tokenOut: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    buyFYToken(
      to: string,
      fyTokenOut: BigNumberish,
      max: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    buyFYTokenPreview(
      fyTokenOut: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    cumulativeBalancesRatio(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    decimals(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    deploymentChainId(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    fyToken(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    g1(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    g2(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getBaseBalance(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getCache(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getFYTokenBalance(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    invariant(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    maturity(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    mint(
      to: string,
      calculateFromBase: boolean,
      minTokensMinted: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    mintWithBase(
      to: string,
      fyTokenToBuy: BigNumberish,
      minTokensMinted: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    name(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    nonces(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    permit(
      owner: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: BytesLike,
      s: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    retrieveBase(
      to: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    retrieveFYToken(
      to: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    scaleFactor(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    sellBase(
      to: string,
      min: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    sellBasePreview(
      baseIn: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    sellFYToken(
      to: string,
      min: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    sellFYTokenPreview(
      fyTokenIn: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    symbol(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    sync(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    totalSupply(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    transfer(
      dst: string,
      wad: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    transferFrom(
      src: string,
      dst: string,
      wad: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    ts(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    version(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
