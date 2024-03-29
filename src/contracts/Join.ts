/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export interface JoinInterface extends utils.Interface {
  functions: {
    "LOCK()": FunctionFragment;
    "LOCK8605463013()": FunctionFragment;
    "ROOT()": FunctionFragment;
    "ROOT4146650865()": FunctionFragment;
    "asset()": FunctionFragment;
    "exit(address,uint128)": FunctionFragment;
    "flashFee(address,uint256)": FunctionFragment;
    "flashFeeFactor()": FunctionFragment;
    "flashLoan(address,address,uint256,bytes)": FunctionFragment;
    "getRoleAdmin(bytes4)": FunctionFragment;
    "grantRole(bytes4,address)": FunctionFragment;
    "grantRoles(bytes4[],address)": FunctionFragment;
    "hasRole(bytes4,address)": FunctionFragment;
    "join(address,uint128)": FunctionFragment;
    "lockRole(bytes4)": FunctionFragment;
    "maxFlashLoan(address)": FunctionFragment;
    "renounceRole(bytes4,address)": FunctionFragment;
    "retrieve(address,address)": FunctionFragment;
    "revokeRole(bytes4,address)": FunctionFragment;
    "revokeRoles(bytes4[],address)": FunctionFragment;
    "setFlashFeeFactor(uint256)": FunctionFragment;
    "setRoleAdmin(bytes4,bytes4)": FunctionFragment;
    "storedBalance()": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "LOCK"
      | "LOCK8605463013"
      | "ROOT"
      | "ROOT4146650865"
      | "asset"
      | "exit"
      | "flashFee"
      | "flashFeeFactor"
      | "flashLoan"
      | "getRoleAdmin"
      | "grantRole"
      | "grantRoles"
      | "hasRole"
      | "join"
      | "lockRole"
      | "maxFlashLoan"
      | "renounceRole"
      | "retrieve"
      | "revokeRole"
      | "revokeRoles"
      | "setFlashFeeFactor"
      | "setRoleAdmin"
      | "storedBalance"
  ): FunctionFragment;

  encodeFunctionData(functionFragment: "LOCK", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "LOCK8605463013",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "ROOT", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "ROOT4146650865",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "asset", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "exit",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "flashFee",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "flashFeeFactor",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "flashLoan",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoleAdmin",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRole",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRoles",
    values: [PromiseOrValue<BytesLike>[], PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "hasRole",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "join",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "lockRole",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "maxFlashLoan",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "retrieve",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRole",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRoles",
    values: [PromiseOrValue<BytesLike>[], PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "setFlashFeeFactor",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "setRoleAdmin",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "storedBalance",
    values?: undefined
  ): string;

  decodeFunctionResult(functionFragment: "LOCK", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "LOCK8605463013",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "ROOT", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "ROOT4146650865",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "asset", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "exit", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "flashFee", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "flashFeeFactor",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "flashLoan", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "grantRoles", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "join", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "lockRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "maxFlashLoan",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "retrieve", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "revokeRoles",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setFlashFeeFactor",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "storedBalance",
    data: BytesLike
  ): Result;

  events: {
    "FlashFeeFactorSet(uint256)": EventFragment;
    "RoleAdminChanged(bytes4,bytes4)": EventFragment;
    "RoleGranted(bytes4,address,address)": EventFragment;
    "RoleRevoked(bytes4,address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "FlashFeeFactorSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleAdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleGranted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleRevoked"): EventFragment;
}

export interface FlashFeeFactorSetEventObject {
  fee: BigNumber;
}
export type FlashFeeFactorSetEvent = TypedEvent<
  [BigNumber],
  FlashFeeFactorSetEventObject
>;

export type FlashFeeFactorSetEventFilter =
  TypedEventFilter<FlashFeeFactorSetEvent>;

export interface RoleAdminChangedEventObject {
  role: string;
  newAdminRole: string;
}
export type RoleAdminChangedEvent = TypedEvent<
  [string, string],
  RoleAdminChangedEventObject
>;

export type RoleAdminChangedEventFilter =
  TypedEventFilter<RoleAdminChangedEvent>;

export interface RoleGrantedEventObject {
  role: string;
  account: string;
  sender: string;
}
export type RoleGrantedEvent = TypedEvent<
  [string, string, string],
  RoleGrantedEventObject
>;

export type RoleGrantedEventFilter = TypedEventFilter<RoleGrantedEvent>;

export interface RoleRevokedEventObject {
  role: string;
  account: string;
  sender: string;
}
export type RoleRevokedEvent = TypedEvent<
  [string, string, string],
  RoleRevokedEventObject
>;

export type RoleRevokedEventFilter = TypedEventFilter<RoleRevokedEvent>;

export interface Join extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: JoinInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    LOCK(overrides?: CallOverrides): Promise<[string]>;

    LOCK8605463013(overrides?: CallOverrides): Promise<[string]>;

    ROOT(overrides?: CallOverrides): Promise<[string]>;

    ROOT4146650865(overrides?: CallOverrides): Promise<[string]>;

    asset(overrides?: CallOverrides): Promise<[string]>;

    exit(
      user: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    flashFee(
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    flashFeeFactor(overrides?: CallOverrides): Promise<[BigNumber]>;

    flashLoan(
      receiver: PromiseOrValue<string>,
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      data: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    grantRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    grantRoles(
      roles: PromiseOrValue<BytesLike>[],
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    hasRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    join(
      user: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    lockRole(
      role: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    maxFlashLoan(
      token: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    retrieve(
      token: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    revokeRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    revokeRoles(
      roles: PromiseOrValue<BytesLike>[],
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setFlashFeeFactor(
      flashFeeFactor_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    setRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      adminRole: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    storedBalance(overrides?: CallOverrides): Promise<[BigNumber]>;
  };

  LOCK(overrides?: CallOverrides): Promise<string>;

  LOCK8605463013(overrides?: CallOverrides): Promise<string>;

  ROOT(overrides?: CallOverrides): Promise<string>;

  ROOT4146650865(overrides?: CallOverrides): Promise<string>;

  asset(overrides?: CallOverrides): Promise<string>;

  exit(
    user: PromiseOrValue<string>,
    amount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  flashFee(
    token: PromiseOrValue<string>,
    amount: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  flashFeeFactor(overrides?: CallOverrides): Promise<BigNumber>;

  flashLoan(
    receiver: PromiseOrValue<string>,
    token: PromiseOrValue<string>,
    amount: PromiseOrValue<BigNumberish>,
    data: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getRoleAdmin(
    role: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<string>;

  grantRole(
    role: PromiseOrValue<BytesLike>,
    account: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  grantRoles(
    roles: PromiseOrValue<BytesLike>[],
    account: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  hasRole(
    role: PromiseOrValue<BytesLike>,
    account: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  join(
    user: PromiseOrValue<string>,
    amount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  lockRole(
    role: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  maxFlashLoan(
    token: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  renounceRole(
    role: PromiseOrValue<BytesLike>,
    account: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  retrieve(
    token: PromiseOrValue<string>,
    to: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  revokeRole(
    role: PromiseOrValue<BytesLike>,
    account: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  revokeRoles(
    roles: PromiseOrValue<BytesLike>[],
    account: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setFlashFeeFactor(
    flashFeeFactor_: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  setRoleAdmin(
    role: PromiseOrValue<BytesLike>,
    adminRole: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  storedBalance(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    LOCK(overrides?: CallOverrides): Promise<string>;

    LOCK8605463013(overrides?: CallOverrides): Promise<string>;

    ROOT(overrides?: CallOverrides): Promise<string>;

    ROOT4146650865(overrides?: CallOverrides): Promise<string>;

    asset(overrides?: CallOverrides): Promise<string>;

    exit(
      user: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    flashFee(
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    flashFeeFactor(overrides?: CallOverrides): Promise<BigNumber>;

    flashLoan(
      receiver: PromiseOrValue<string>,
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      data: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    getRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<string>;

    grantRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    grantRoles(
      roles: PromiseOrValue<BytesLike>[],
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    hasRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    join(
      user: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    lockRole(
      role: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    maxFlashLoan(
      token: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    retrieve(
      token: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeRoles(
      roles: PromiseOrValue<BytesLike>[],
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    setFlashFeeFactor(
      flashFeeFactor_: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    setRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      adminRole: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    storedBalance(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {
    "FlashFeeFactorSet(uint256)"(
      fee?: PromiseOrValue<BigNumberish> | null
    ): FlashFeeFactorSetEventFilter;
    FlashFeeFactorSet(
      fee?: PromiseOrValue<BigNumberish> | null
    ): FlashFeeFactorSetEventFilter;

    "RoleAdminChanged(bytes4,bytes4)"(
      role?: PromiseOrValue<BytesLike> | null,
      newAdminRole?: PromiseOrValue<BytesLike> | null
    ): RoleAdminChangedEventFilter;
    RoleAdminChanged(
      role?: PromiseOrValue<BytesLike> | null,
      newAdminRole?: PromiseOrValue<BytesLike> | null
    ): RoleAdminChangedEventFilter;

    "RoleGranted(bytes4,address,address)"(
      role?: PromiseOrValue<BytesLike> | null,
      account?: PromiseOrValue<string> | null,
      sender?: PromiseOrValue<string> | null
    ): RoleGrantedEventFilter;
    RoleGranted(
      role?: PromiseOrValue<BytesLike> | null,
      account?: PromiseOrValue<string> | null,
      sender?: PromiseOrValue<string> | null
    ): RoleGrantedEventFilter;

    "RoleRevoked(bytes4,address,address)"(
      role?: PromiseOrValue<BytesLike> | null,
      account?: PromiseOrValue<string> | null,
      sender?: PromiseOrValue<string> | null
    ): RoleRevokedEventFilter;
    RoleRevoked(
      role?: PromiseOrValue<BytesLike> | null,
      account?: PromiseOrValue<string> | null,
      sender?: PromiseOrValue<string> | null
    ): RoleRevokedEventFilter;
  };

  estimateGas: {
    LOCK(overrides?: CallOverrides): Promise<BigNumber>;

    LOCK8605463013(overrides?: CallOverrides): Promise<BigNumber>;

    ROOT(overrides?: CallOverrides): Promise<BigNumber>;

    ROOT4146650865(overrides?: CallOverrides): Promise<BigNumber>;

    asset(overrides?: CallOverrides): Promise<BigNumber>;

    exit(
      user: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    flashFee(
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    flashFeeFactor(overrides?: CallOverrides): Promise<BigNumber>;

    flashLoan(
      receiver: PromiseOrValue<string>,
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      data: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    grantRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    grantRoles(
      roles: PromiseOrValue<BytesLike>[],
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    hasRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    join(
      user: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    lockRole(
      role: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    maxFlashLoan(
      token: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    retrieve(
      token: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    revokeRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    revokeRoles(
      roles: PromiseOrValue<BytesLike>[],
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setFlashFeeFactor(
      flashFeeFactor_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    setRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      adminRole: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    storedBalance(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    LOCK(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    LOCK8605463013(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ROOT(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ROOT4146650865(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    asset(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    exit(
      user: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    flashFee(
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    flashFeeFactor(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    flashLoan(
      receiver: PromiseOrValue<string>,
      token: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      data: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    grantRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    grantRoles(
      roles: PromiseOrValue<BytesLike>[],
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    hasRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    join(
      user: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    lockRole(
      role: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    maxFlashLoan(
      token: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    retrieve(
      token: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    revokeRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    revokeRoles(
      roles: PromiseOrValue<BytesLike>[],
      account: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setFlashFeeFactor(
      flashFeeFactor_: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    setRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      adminRole: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    storedBalance(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
