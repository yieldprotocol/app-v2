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

export interface TokenUpgradeInterface extends utils.Interface {
  functions: {
    "LOCK()": FunctionFragment;
    "LOCK8605463013()": FunctionFragment;
    "ROOT()": FunctionFragment;
    "ROOT4146650865()": FunctionFragment;
    "extract(address,address)": FunctionFragment;
    "getRoleAdmin(bytes4)": FunctionFragment;
    "grantRole(bytes4,address)": FunctionFragment;
    "grantRoles(bytes4[],address)": FunctionFragment;
    "hasRole(bytes4,address)": FunctionFragment;
    "isClaimed(bytes32)": FunctionFragment;
    "lockRole(bytes4)": FunctionFragment;
    "recover(address,address)": FunctionFragment;
    "register(address,address,bytes32)": FunctionFragment;
    "renounceRole(bytes4,address)": FunctionFragment;
    "revokeRole(bytes4,address)": FunctionFragment;
    "revokeRoles(bytes4[],address)": FunctionFragment;
    "setRoleAdmin(bytes4,bytes4)": FunctionFragment;
    "tokensIn(address)": FunctionFragment;
    "tokensOut(address)": FunctionFragment;
    "unregister(address,address)": FunctionFragment;
    "upgrade(address,bytes32,address,uint256,bytes32[])": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "LOCK"
      | "LOCK8605463013"
      | "ROOT"
      | "ROOT4146650865"
      | "extract"
      | "getRoleAdmin"
      | "grantRole"
      | "grantRoles"
      | "hasRole"
      | "isClaimed"
      | "lockRole"
      | "recover"
      | "register"
      | "renounceRole"
      | "revokeRole"
      | "revokeRoles"
      | "setRoleAdmin"
      | "tokensIn"
      | "tokensOut"
      | "unregister"
      | "upgrade"
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
  encodeFunctionData(
    functionFragment: "extract",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
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
    functionFragment: "isClaimed",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "lockRole",
    values: [PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "recover",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "register",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<string>]
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
    functionFragment: "setRoleAdmin",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "tokensIn",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "tokensOut",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "unregister",
    values: [PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "upgrade",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BytesLike>[]
    ]
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
  decodeFunctionResult(functionFragment: "extract", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "grantRoles", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "isClaimed", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "lockRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "recover", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "register", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "revokeRoles",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "tokensIn", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "tokensOut", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "unregister", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "upgrade", data: BytesLike): Result;

  events: {
    "Extracted(address,uint256)": EventFragment;
    "Recovered(address,uint256)": EventFragment;
    "Registered(address,address,uint256,uint256,uint96,bytes32)": EventFragment;
    "RoleAdminChanged(bytes4,bytes4)": EventFragment;
    "RoleGranted(bytes4,address,address)": EventFragment;
    "RoleRevoked(bytes4,address,address)": EventFragment;
    "Unregistered(address,address,uint256,uint256)": EventFragment;
    "Upgraded(address,address,uint256,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Extracted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Recovered"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Registered"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleAdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleGranted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleRevoked"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Unregistered"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Upgraded"): EventFragment;
}

export interface ExtractedEventObject {
  tokenIn: string;
  tokenInBalance: BigNumber;
}
export type ExtractedEvent = TypedEvent<
  [string, BigNumber],
  ExtractedEventObject
>;

export type ExtractedEventFilter = TypedEventFilter<ExtractedEvent>;

export interface RecoveredEventObject {
  token: string;
  recovered: BigNumber;
}
export type RecoveredEvent = TypedEvent<
  [string, BigNumber],
  RecoveredEventObject
>;

export type RecoveredEventFilter = TypedEventFilter<RecoveredEvent>;

export interface RegisteredEventObject {
  tokenIn: string;
  tokenOut: string;
  tokenInBalance: BigNumber;
  tokenOutBalance: BigNumber;
  ratio: BigNumber;
  merkleRoot: string;
}
export type RegisteredEvent = TypedEvent<
  [string, string, BigNumber, BigNumber, BigNumber, string],
  RegisteredEventObject
>;

export type RegisteredEventFilter = TypedEventFilter<RegisteredEvent>;

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

export interface UnregisteredEventObject {
  tokenIn: string;
  tokenOut: string;
  tokenInBalance: BigNumber;
  tokenOutBalance: BigNumber;
}
export type UnregisteredEvent = TypedEvent<
  [string, string, BigNumber, BigNumber],
  UnregisteredEventObject
>;

export type UnregisteredEventFilter = TypedEventFilter<UnregisteredEvent>;

export interface UpgradedEventObject {
  tokenIn: string;
  tokenOut: string;
  tokenInAmount: BigNumber;
  tokenOutAmount: BigNumber;
}
export type UpgradedEvent = TypedEvent<
  [string, string, BigNumber, BigNumber],
  UpgradedEventObject
>;

export type UpgradedEventFilter = TypedEventFilter<UpgradedEvent>;

export interface TokenUpgrade extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: TokenUpgradeInterface;

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

    extract(
      tokenIn_: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
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

    isClaimed(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    lockRole(
      role: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    recover(
      token: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    register(
      tokenIn_: PromiseOrValue<string>,
      tokenOut_: PromiseOrValue<string>,
      merkleRoot_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
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

    setRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      adminRole: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    tokensIn(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<
      [string, BigNumber, BigNumber, string] & {
        reverse: string;
        ratio: BigNumber;
        balance: BigNumber;
        merkleRoot: string;
      }
    >;

    tokensOut(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string, BigNumber] & { reverse: string; balance: BigNumber }>;

    unregister(
      tokenIn_: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    upgrade(
      tokenIn_: PromiseOrValue<string>,
      acceptanceToken: PromiseOrValue<BytesLike>,
      from: PromiseOrValue<string>,
      tokenInAmount: PromiseOrValue<BigNumberish>,
      proof: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  LOCK(overrides?: CallOverrides): Promise<string>;

  LOCK8605463013(overrides?: CallOverrides): Promise<string>;

  ROOT(overrides?: CallOverrides): Promise<string>;

  ROOT4146650865(overrides?: CallOverrides): Promise<string>;

  extract(
    tokenIn_: PromiseOrValue<string>,
    to: PromiseOrValue<string>,
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

  isClaimed(
    arg0: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  lockRole(
    role: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  recover(
    token: PromiseOrValue<string>,
    to: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  register(
    tokenIn_: PromiseOrValue<string>,
    tokenOut_: PromiseOrValue<string>,
    merkleRoot_: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  renounceRole(
    role: PromiseOrValue<BytesLike>,
    account: PromiseOrValue<string>,
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

  setRoleAdmin(
    role: PromiseOrValue<BytesLike>,
    adminRole: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  tokensIn(
    arg0: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<
    [string, BigNumber, BigNumber, string] & {
      reverse: string;
      ratio: BigNumber;
      balance: BigNumber;
      merkleRoot: string;
    }
  >;

  tokensOut(
    arg0: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<[string, BigNumber] & { reverse: string; balance: BigNumber }>;

  unregister(
    tokenIn_: PromiseOrValue<string>,
    to: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  upgrade(
    tokenIn_: PromiseOrValue<string>,
    acceptanceToken: PromiseOrValue<BytesLike>,
    from: PromiseOrValue<string>,
    tokenInAmount: PromiseOrValue<BigNumberish>,
    proof: PromiseOrValue<BytesLike>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    LOCK(overrides?: CallOverrides): Promise<string>;

    LOCK8605463013(overrides?: CallOverrides): Promise<string>;

    ROOT(overrides?: CallOverrides): Promise<string>;

    ROOT4146650865(overrides?: CallOverrides): Promise<string>;

    extract(
      tokenIn_: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

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

    isClaimed(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    lockRole(
      role: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    recover(
      token: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    register(
      tokenIn_: PromiseOrValue<string>,
      tokenOut_: PromiseOrValue<string>,
      merkleRoot_: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
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

    setRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      adminRole: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    tokensIn(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<
      [string, BigNumber, BigNumber, string] & {
        reverse: string;
        ratio: BigNumber;
        balance: BigNumber;
        merkleRoot: string;
      }
    >;

    tokensOut(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string, BigNumber] & { reverse: string; balance: BigNumber }>;

    unregister(
      tokenIn_: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    upgrade(
      tokenIn_: PromiseOrValue<string>,
      acceptanceToken: PromiseOrValue<BytesLike>,
      from: PromiseOrValue<string>,
      tokenInAmount: PromiseOrValue<BigNumberish>,
      proof: PromiseOrValue<BytesLike>[],
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "Extracted(address,uint256)"(
      tokenIn?: PromiseOrValue<string> | null,
      tokenInBalance?: null
    ): ExtractedEventFilter;
    Extracted(
      tokenIn?: PromiseOrValue<string> | null,
      tokenInBalance?: null
    ): ExtractedEventFilter;

    "Recovered(address,uint256)"(
      token?: PromiseOrValue<string> | null,
      recovered?: null
    ): RecoveredEventFilter;
    Recovered(
      token?: PromiseOrValue<string> | null,
      recovered?: null
    ): RecoveredEventFilter;

    "Registered(address,address,uint256,uint256,uint96,bytes32)"(
      tokenIn?: PromiseOrValue<string> | null,
      tokenOut?: PromiseOrValue<string> | null,
      tokenInBalance?: null,
      tokenOutBalance?: null,
      ratio?: null,
      merkleRoot?: null
    ): RegisteredEventFilter;
    Registered(
      tokenIn?: PromiseOrValue<string> | null,
      tokenOut?: PromiseOrValue<string> | null,
      tokenInBalance?: null,
      tokenOutBalance?: null,
      ratio?: null,
      merkleRoot?: null
    ): RegisteredEventFilter;

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

    "Unregistered(address,address,uint256,uint256)"(
      tokenIn?: PromiseOrValue<string> | null,
      tokenOut?: PromiseOrValue<string> | null,
      tokenInBalance?: null,
      tokenOutBalance?: null
    ): UnregisteredEventFilter;
    Unregistered(
      tokenIn?: PromiseOrValue<string> | null,
      tokenOut?: PromiseOrValue<string> | null,
      tokenInBalance?: null,
      tokenOutBalance?: null
    ): UnregisteredEventFilter;

    "Upgraded(address,address,uint256,uint256)"(
      tokenIn?: PromiseOrValue<string> | null,
      tokenOut?: PromiseOrValue<string> | null,
      tokenInAmount?: null,
      tokenOutAmount?: null
    ): UpgradedEventFilter;
    Upgraded(
      tokenIn?: PromiseOrValue<string> | null,
      tokenOut?: PromiseOrValue<string> | null,
      tokenInAmount?: null,
      tokenOutAmount?: null
    ): UpgradedEventFilter;
  };

  estimateGas: {
    LOCK(overrides?: CallOverrides): Promise<BigNumber>;

    LOCK8605463013(overrides?: CallOverrides): Promise<BigNumber>;

    ROOT(overrides?: CallOverrides): Promise<BigNumber>;

    ROOT4146650865(overrides?: CallOverrides): Promise<BigNumber>;

    extract(
      tokenIn_: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
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

    isClaimed(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    lockRole(
      role: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    recover(
      token: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    register(
      tokenIn_: PromiseOrValue<string>,
      tokenOut_: PromiseOrValue<string>,
      merkleRoot_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
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

    setRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      adminRole: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    tokensIn(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    tokensOut(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    unregister(
      tokenIn_: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    upgrade(
      tokenIn_: PromiseOrValue<string>,
      acceptanceToken: PromiseOrValue<BytesLike>,
      from: PromiseOrValue<string>,
      tokenInAmount: PromiseOrValue<BigNumberish>,
      proof: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    LOCK(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    LOCK8605463013(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ROOT(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ROOT4146650865(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    extract(
      tokenIn_: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
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

    isClaimed(
      arg0: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    lockRole(
      role: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    recover(
      token: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    register(
      tokenIn_: PromiseOrValue<string>,
      tokenOut_: PromiseOrValue<string>,
      merkleRoot_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    renounceRole(
      role: PromiseOrValue<BytesLike>,
      account: PromiseOrValue<string>,
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

    setRoleAdmin(
      role: PromiseOrValue<BytesLike>,
      adminRole: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    tokensIn(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    tokensOut(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    unregister(
      tokenIn_: PromiseOrValue<string>,
      to: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    upgrade(
      tokenIn_: PromiseOrValue<string>,
      acceptanceToken: PromiseOrValue<BytesLike>,
      from: PromiseOrValue<string>,
      tokenInAmount: PromiseOrValue<BigNumberish>,
      proof: PromiseOrValue<BytesLike>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
