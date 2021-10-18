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
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface MakerImportModuleInterface extends ethers.utils.Interface {
  functions: {
    "_importCdpPosition(bytes12,(address,bytes6,bytes6),uint256,uint128,uint128,uint128)": FunctionFragment;
    "borrowingFee()": FunctionFragment;
    "cauldron()": FunctionFragment;
    "cdpMgr()": FunctionFragment;
    "dai()": FunctionFragment;
    "ilkRegistry()": FunctionFragment;
    "importCdp(bytes12,uint256,uint128)": FunctionFragment;
    "importCdpPosition(bytes12,uint256,uint128,uint128,uint128)": FunctionFragment;
    "integrations(address)": FunctionFragment;
    "joins(bytes6)": FunctionFragment;
    "makerDaiJoin()": FunctionFragment;
    "modules(address)": FunctionFragment;
    "pools(bytes6)": FunctionFragment;
    "proxyRegistry()": FunctionFragment;
    "router()": FunctionFragment;
    "tokens(address)": FunctionFragment;
    "vat()": FunctionFragment;
    "weth()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "_importCdpPosition",
    values: [
      BytesLike,
      { owner: string; seriesId: BytesLike; ilkId: BytesLike },
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "borrowingFee",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "cauldron", values?: undefined): string;
  encodeFunctionData(functionFragment: "cdpMgr", values?: undefined): string;
  encodeFunctionData(functionFragment: "dai", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "ilkRegistry",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "importCdp",
    values: [BytesLike, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "importCdpPosition",
    values: [BytesLike, BigNumberish, BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "integrations",
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: "joins", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "makerDaiJoin",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "modules", values: [string]): string;
  encodeFunctionData(functionFragment: "pools", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "proxyRegistry",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "router", values?: undefined): string;
  encodeFunctionData(functionFragment: "tokens", values: [string]): string;
  encodeFunctionData(functionFragment: "vat", values?: undefined): string;
  encodeFunctionData(functionFragment: "weth", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "_importCdpPosition",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "borrowingFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "cauldron", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "cdpMgr", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "dai", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "ilkRegistry",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "importCdp", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "importCdpPosition",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "integrations",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "joins", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "makerDaiJoin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "modules", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "pools", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "proxyRegistry",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "router", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "tokens", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "vat", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "weth", data: BytesLike): Result;

  events: {
    "FeeSet(uint256)": EventFragment;
    "ImportedFromMaker(bytes12,uint256,uint256,uint256)": EventFragment;
    "IntegrationAdded(address,bool)": EventFragment;
    "JoinAdded(bytes6,address)": EventFragment;
    "ModuleAdded(address,bool)": EventFragment;
    "PoolAdded(bytes6,address)": EventFragment;
    "TokenAdded(address,bool)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "FeeSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ImportedFromMaker"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "IntegrationAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "JoinAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ModuleAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PoolAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TokenAdded"): EventFragment;
}

export type FeeSetEvent = TypedEvent<[BigNumber] & { fee: BigNumber }>;

export type ImportedFromMakerEvent = TypedEvent<
  [string, BigNumber, BigNumber, BigNumber] & {
    vaultId: string;
    cdp: BigNumber;
    ilkAmount: BigNumber;
    daiDebt: BigNumber;
  }
>;

export type IntegrationAddedEvent = TypedEvent<
  [string, boolean] & { integration: string; set: boolean }
>;

export type JoinAddedEvent = TypedEvent<
  [string, string] & { assetId: string; join: string }
>;

export type ModuleAddedEvent = TypedEvent<
  [string, boolean] & { module: string; set: boolean }
>;

export type PoolAddedEvent = TypedEvent<
  [string, string] & { seriesId: string; pool: string }
>;

export type TokenAddedEvent = TypedEvent<
  [string, boolean] & { token: string; set: boolean }
>;

export class MakerImportModule extends BaseContract {
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

  interface: MakerImportModuleInterface;

  functions: {
    _importCdpPosition(
      vaultId: BytesLike,
      vault: { owner: string; seriesId: BytesLike; ilkId: BytesLike },
      cdp: BigNumberish,
      ilkAmount: BigNumberish,
      debtAmount: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    borrowingFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    cauldron(overrides?: CallOverrides): Promise<[string]>;

    cdpMgr(overrides?: CallOverrides): Promise<[string]>;

    dai(overrides?: CallOverrides): Promise<[string]>;

    ilkRegistry(overrides?: CallOverrides): Promise<[string]>;

    importCdp(
      vaultId: BytesLike,
      cdp: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    importCdpPosition(
      vaultId: BytesLike,
      cdp: BigNumberish,
      ilkAmount: BigNumberish,
      debtAmount: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    integrations(arg0: string, overrides?: CallOverrides): Promise<[boolean]>;

    joins(arg0: BytesLike, overrides?: CallOverrides): Promise<[string]>;

    makerDaiJoin(overrides?: CallOverrides): Promise<[string]>;

    modules(arg0: string, overrides?: CallOverrides): Promise<[boolean]>;

    pools(arg0: BytesLike, overrides?: CallOverrides): Promise<[string]>;

    proxyRegistry(overrides?: CallOverrides): Promise<[string]>;

    router(overrides?: CallOverrides): Promise<[string]>;

    tokens(arg0: string, overrides?: CallOverrides): Promise<[boolean]>;

    vat(overrides?: CallOverrides): Promise<[string]>;

    weth(overrides?: CallOverrides): Promise<[string]>;
  };

  _importCdpPosition(
    vaultId: BytesLike,
    vault: { owner: string; seriesId: BytesLike; ilkId: BytesLike },
    cdp: BigNumberish,
    ilkAmount: BigNumberish,
    debtAmount: BigNumberish,
    maxDaiPrice: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  borrowingFee(overrides?: CallOverrides): Promise<BigNumber>;

  cauldron(overrides?: CallOverrides): Promise<string>;

  cdpMgr(overrides?: CallOverrides): Promise<string>;

  dai(overrides?: CallOverrides): Promise<string>;

  ilkRegistry(overrides?: CallOverrides): Promise<string>;

  importCdp(
    vaultId: BytesLike,
    cdp: BigNumberish,
    maxDaiPrice: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  importCdpPosition(
    vaultId: BytesLike,
    cdp: BigNumberish,
    ilkAmount: BigNumberish,
    debtAmount: BigNumberish,
    maxDaiPrice: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  integrations(arg0: string, overrides?: CallOverrides): Promise<boolean>;

  joins(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

  makerDaiJoin(overrides?: CallOverrides): Promise<string>;

  modules(arg0: string, overrides?: CallOverrides): Promise<boolean>;

  pools(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

  proxyRegistry(overrides?: CallOverrides): Promise<string>;

  router(overrides?: CallOverrides): Promise<string>;

  tokens(arg0: string, overrides?: CallOverrides): Promise<boolean>;

  vat(overrides?: CallOverrides): Promise<string>;

  weth(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    _importCdpPosition(
      vaultId: BytesLike,
      vault: { owner: string; seriesId: BytesLike; ilkId: BytesLike },
      cdp: BigNumberish,
      ilkAmount: BigNumberish,
      debtAmount: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    borrowingFee(overrides?: CallOverrides): Promise<BigNumber>;

    cauldron(overrides?: CallOverrides): Promise<string>;

    cdpMgr(overrides?: CallOverrides): Promise<string>;

    dai(overrides?: CallOverrides): Promise<string>;

    ilkRegistry(overrides?: CallOverrides): Promise<string>;

    importCdp(
      vaultId: BytesLike,
      cdp: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    importCdpPosition(
      vaultId: BytesLike,
      cdp: BigNumberish,
      ilkAmount: BigNumberish,
      debtAmount: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    integrations(arg0: string, overrides?: CallOverrides): Promise<boolean>;

    joins(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

    makerDaiJoin(overrides?: CallOverrides): Promise<string>;

    modules(arg0: string, overrides?: CallOverrides): Promise<boolean>;

    pools(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

    proxyRegistry(overrides?: CallOverrides): Promise<string>;

    router(overrides?: CallOverrides): Promise<string>;

    tokens(arg0: string, overrides?: CallOverrides): Promise<boolean>;

    vat(overrides?: CallOverrides): Promise<string>;

    weth(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    "FeeSet(uint256)"(
      fee?: null
    ): TypedEventFilter<[BigNumber], { fee: BigNumber }>;

    FeeSet(fee?: null): TypedEventFilter<[BigNumber], { fee: BigNumber }>;

    "ImportedFromMaker(bytes12,uint256,uint256,uint256)"(
      vaultId?: BytesLike | null,
      cdp?: BigNumberish | null,
      ilkAmount?: null,
      daiDebt?: null
    ): TypedEventFilter<
      [string, BigNumber, BigNumber, BigNumber],
      {
        vaultId: string;
        cdp: BigNumber;
        ilkAmount: BigNumber;
        daiDebt: BigNumber;
      }
    >;

    ImportedFromMaker(
      vaultId?: BytesLike | null,
      cdp?: BigNumberish | null,
      ilkAmount?: null,
      daiDebt?: null
    ): TypedEventFilter<
      [string, BigNumber, BigNumber, BigNumber],
      {
        vaultId: string;
        cdp: BigNumber;
        ilkAmount: BigNumber;
        daiDebt: BigNumber;
      }
    >;

    "IntegrationAdded(address,bool)"(
      integration?: string | null,
      set?: boolean | null
    ): TypedEventFilter<
      [string, boolean],
      { integration: string; set: boolean }
    >;

    IntegrationAdded(
      integration?: string | null,
      set?: boolean | null
    ): TypedEventFilter<
      [string, boolean],
      { integration: string; set: boolean }
    >;

    "JoinAdded(bytes6,address)"(
      assetId?: BytesLike | null,
      join?: string | null
    ): TypedEventFilter<[string, string], { assetId: string; join: string }>;

    JoinAdded(
      assetId?: BytesLike | null,
      join?: string | null
    ): TypedEventFilter<[string, string], { assetId: string; join: string }>;

    "ModuleAdded(address,bool)"(
      module?: string | null,
      set?: boolean | null
    ): TypedEventFilter<[string, boolean], { module: string; set: boolean }>;

    ModuleAdded(
      module?: string | null,
      set?: boolean | null
    ): TypedEventFilter<[string, boolean], { module: string; set: boolean }>;

    "PoolAdded(bytes6,address)"(
      seriesId?: BytesLike | null,
      pool?: string | null
    ): TypedEventFilter<[string, string], { seriesId: string; pool: string }>;

    PoolAdded(
      seriesId?: BytesLike | null,
      pool?: string | null
    ): TypedEventFilter<[string, string], { seriesId: string; pool: string }>;

    "TokenAdded(address,bool)"(
      token?: string | null,
      set?: boolean | null
    ): TypedEventFilter<[string, boolean], { token: string; set: boolean }>;

    TokenAdded(
      token?: string | null,
      set?: boolean | null
    ): TypedEventFilter<[string, boolean], { token: string; set: boolean }>;
  };

  estimateGas: {
    _importCdpPosition(
      vaultId: BytesLike,
      vault: { owner: string; seriesId: BytesLike; ilkId: BytesLike },
      cdp: BigNumberish,
      ilkAmount: BigNumberish,
      debtAmount: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    borrowingFee(overrides?: CallOverrides): Promise<BigNumber>;

    cauldron(overrides?: CallOverrides): Promise<BigNumber>;

    cdpMgr(overrides?: CallOverrides): Promise<BigNumber>;

    dai(overrides?: CallOverrides): Promise<BigNumber>;

    ilkRegistry(overrides?: CallOverrides): Promise<BigNumber>;

    importCdp(
      vaultId: BytesLike,
      cdp: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    importCdpPosition(
      vaultId: BytesLike,
      cdp: BigNumberish,
      ilkAmount: BigNumberish,
      debtAmount: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    integrations(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    joins(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    makerDaiJoin(overrides?: CallOverrides): Promise<BigNumber>;

    modules(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    pools(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    proxyRegistry(overrides?: CallOverrides): Promise<BigNumber>;

    router(overrides?: CallOverrides): Promise<BigNumber>;

    tokens(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    vat(overrides?: CallOverrides): Promise<BigNumber>;

    weth(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    _importCdpPosition(
      vaultId: BytesLike,
      vault: { owner: string; seriesId: BytesLike; ilkId: BytesLike },
      cdp: BigNumberish,
      ilkAmount: BigNumberish,
      debtAmount: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    borrowingFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    cauldron(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    cdpMgr(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    dai(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ilkRegistry(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    importCdp(
      vaultId: BytesLike,
      cdp: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    importCdpPosition(
      vaultId: BytesLike,
      cdp: BigNumberish,
      ilkAmount: BigNumberish,
      debtAmount: BigNumberish,
      maxDaiPrice: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    integrations(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    joins(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    makerDaiJoin(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    modules(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    pools(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    proxyRegistry(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    router(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    tokens(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    vat(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    weth(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
