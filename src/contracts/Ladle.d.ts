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
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface LadleInterface extends ethers.utils.Interface {
  functions: {
    "LOCK()": FunctionFragment;
    "ROOT()": FunctionFragment;
    "addJoin(bytes6,address)": FunctionFragment;
    "addPool(bytes6,address)": FunctionFragment;
    "batch(uint8[],bytes[])": FunctionFragment;
    "borrowingFee()": FunctionFragment;
    "cauldron()": FunctionFragment;
    "getRoleAdmin(bytes4)": FunctionFragment;
    "grantRole(bytes4,address)": FunctionFragment;
    "grantRoles(bytes4[],address)": FunctionFragment;
    "hasRole(bytes4,address)": FunctionFragment;
    "joins(bytes6)": FunctionFragment;
    "lockRole(bytes4)": FunctionFragment;
    "modules(address)": FunctionFragment;
    "pools(bytes6)": FunctionFragment;
    "renounceRole(bytes4,address)": FunctionFragment;
    "revokeRole(bytes4,address)": FunctionFragment;
    "revokeRoles(bytes4[],address)": FunctionFragment;
    "setFee(uint256)": FunctionFragment;
    "setModule(address,bool)": FunctionFragment;
    "setRoleAdmin(bytes4,bytes4)": FunctionFragment;
    "settle(bytes12,address,uint128,uint128)": FunctionFragment;
    "weth()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "LOCK", values?: undefined): string;
  encodeFunctionData(functionFragment: "ROOT", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "addJoin",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "addPool",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "batch",
    values: [BigNumberish[], BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "borrowingFee",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "cauldron", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getRoleAdmin",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRoles",
    values: [BytesLike[], string]
  ): string;
  encodeFunctionData(
    functionFragment: "hasRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(functionFragment: "joins", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "lockRole", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "modules", values: [string]): string;
  encodeFunctionData(functionFragment: "pools", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRoles",
    values: [BytesLike[], string]
  ): string;
  encodeFunctionData(
    functionFragment: "setFee",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setModule",
    values: [string, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "setRoleAdmin",
    values: [BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "settle",
    values: [BytesLike, string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "weth", values?: undefined): string;

  decodeFunctionResult(functionFragment: "LOCK", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "ROOT", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "addJoin", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "addPool", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "batch", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "borrowingFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "cauldron", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "grantRoles", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "joins", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "lockRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "modules", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "pools", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "revokeRoles",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setFee", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setModule", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "settle", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "weth", data: BytesLike): Result;

  events: {
    "FeeSet(uint256)": EventFragment;
    "JoinAdded(bytes6,address)": EventFragment;
    "ModuleSet(address,bool)": EventFragment;
    "PoolAdded(bytes6,address)": EventFragment;
    "RoleAdminChanged(bytes4,bytes4)": EventFragment;
    "RoleGranted(bytes4,address,address)": EventFragment;
    "RoleRevoked(bytes4,address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "FeeSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "JoinAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ModuleSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PoolAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleAdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleGranted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleRevoked"): EventFragment;
}

export class Ladle extends BaseContract {
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

  interface: LadleInterface;

  functions: {
    LOCK(overrides?: CallOverrides): Promise<[string]>;

    ROOT(overrides?: CallOverrides): Promise<[string]>;

    addJoin(
      assetId: BytesLike,
      join: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    addPool(
      seriesId: BytesLike,
      pool: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    batch(
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    borrowingFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    cauldron(overrides?: CallOverrides): Promise<[string]>;

    getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<[string]>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    grantRoles(
      roles: BytesLike[],
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    joins(arg0: BytesLike, overrides?: CallOverrides): Promise<[string]>;

    lockRole(
      role: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    modules(arg0: string, overrides?: CallOverrides): Promise<[boolean]>;

    pools(arg0: BytesLike, overrides?: CallOverrides): Promise<[string]>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    revokeRoles(
      roles: BytesLike[],
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setFee(
      fee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setModule(
      module: string,
      set: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setRoleAdmin(
      role: BytesLike,
      adminRole: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    settle(
      vaultId: BytesLike,
      user: string,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    weth(overrides?: CallOverrides): Promise<[string]>;
  };

  LOCK(overrides?: CallOverrides): Promise<string>;

  ROOT(overrides?: CallOverrides): Promise<string>;

  addJoin(
    assetId: BytesLike,
    join: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  addPool(
    seriesId: BytesLike,
    pool: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  batch(
    operations: BigNumberish[],
    data: BytesLike[],
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  borrowingFee(overrides?: CallOverrides): Promise<BigNumber>;

  cauldron(overrides?: CallOverrides): Promise<string>;

  getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;

  grantRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  grantRoles(
    roles: BytesLike[],
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  hasRole(
    role: BytesLike,
    account: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  joins(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

  lockRole(
    role: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  modules(arg0: string, overrides?: CallOverrides): Promise<boolean>;

  pools(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

  renounceRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  revokeRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  revokeRoles(
    roles: BytesLike[],
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setFee(
    fee: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setModule(
    module: string,
    set: boolean,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setRoleAdmin(
    role: BytesLike,
    adminRole: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  settle(
    vaultId: BytesLike,
    user: string,
    ink: BigNumberish,
    art: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  weth(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    LOCK(overrides?: CallOverrides): Promise<string>;

    ROOT(overrides?: CallOverrides): Promise<string>;

    addJoin(
      assetId: BytesLike,
      join: string,
      overrides?: CallOverrides
    ): Promise<void>;

    addPool(
      seriesId: BytesLike,
      pool: string,
      overrides?: CallOverrides
    ): Promise<void>;

    batch(
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<string[]>;

    borrowingFee(overrides?: CallOverrides): Promise<BigNumber>;

    cauldron(overrides?: CallOverrides): Promise<string>;

    getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    grantRoles(
      roles: BytesLike[],
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    joins(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

    lockRole(role: BytesLike, overrides?: CallOverrides): Promise<void>;

    modules(arg0: string, overrides?: CallOverrides): Promise<boolean>;

    pools(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeRoles(
      roles: BytesLike[],
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setFee(fee: BigNumberish, overrides?: CallOverrides): Promise<void>;

    setModule(
      module: string,
      set: boolean,
      overrides?: CallOverrides
    ): Promise<void>;

    setRoleAdmin(
      role: BytesLike,
      adminRole: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    settle(
      vaultId: BytesLike,
      user: string,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    weth(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    FeeSet(fee?: null): TypedEventFilter<[BigNumber], { fee: BigNumber }>;

    JoinAdded(
      assetId?: BytesLike | null,
      join?: string | null
    ): TypedEventFilter<[string, string], { assetId: string; join: string }>;

    ModuleSet(
      module?: string | null,
      set?: boolean | null
    ): TypedEventFilter<[string, boolean], { module: string; set: boolean }>;

    PoolAdded(
      seriesId?: BytesLike | null,
      pool?: string | null
    ): TypedEventFilter<[string, string], { seriesId: string; pool: string }>;

    RoleAdminChanged(
      role?: BytesLike | null,
      newAdminRole?: BytesLike | null
    ): TypedEventFilter<
      [string, string],
      { role: string; newAdminRole: string }
    >;

    RoleGranted(
      role?: BytesLike | null,
      account?: string | null,
      sender?: string | null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; account: string; sender: string }
    >;

    RoleRevoked(
      role?: BytesLike | null,
      account?: string | null,
      sender?: string | null
    ): TypedEventFilter<
      [string, string, string],
      { role: string; account: string; sender: string }
    >;
  };

  estimateGas: {
    LOCK(overrides?: CallOverrides): Promise<BigNumber>;

    ROOT(overrides?: CallOverrides): Promise<BigNumber>;

    addJoin(
      assetId: BytesLike,
      join: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    addPool(
      seriesId: BytesLike,
      pool: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    batch(
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    borrowingFee(overrides?: CallOverrides): Promise<BigNumber>;

    cauldron(overrides?: CallOverrides): Promise<BigNumber>;

    getRoleAdmin(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    grantRoles(
      roles: BytesLike[],
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    joins(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    lockRole(
      role: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    modules(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    pools(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    revokeRoles(
      roles: BytesLike[],
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setFee(
      fee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setModule(
      module: string,
      set: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setRoleAdmin(
      role: BytesLike,
      adminRole: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    settle(
      vaultId: BytesLike,
      user: string,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    weth(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    LOCK(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ROOT(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    addJoin(
      assetId: BytesLike,
      join: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    addPool(
      seriesId: BytesLike,
      pool: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    batch(
      operations: BigNumberish[],
      data: BytesLike[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    borrowingFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    cauldron(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getRoleAdmin(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    grantRoles(
      roles: BytesLike[],
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    joins(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    lockRole(
      role: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    modules(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    pools(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    revokeRoles(
      roles: BytesLike[],
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setFee(
      fee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setModule(
      module: string,
      set: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setRoleAdmin(
      role: BytesLike,
      adminRole: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    settle(
      vaultId: BytesLike,
      user: string,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    weth(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
