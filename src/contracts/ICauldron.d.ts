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
} from "ethers";
import {
  Contract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface ICauldronInterface extends ethers.utils.Interface {
  functions: {
    "assets(bytes6)": FunctionFragment;
    "balances(bytes12)": FunctionFragment;
    "build(address,bytes12,bytes6,bytes6)": FunctionFragment;
    "destroy(bytes12)": FunctionFragment;
    "give(bytes12,address)": FunctionFragment;
    "grab(bytes12)": FunctionFragment;
    "pour(bytes12,int128,int128)": FunctionFragment;
    "rateOracles(bytes6)": FunctionFragment;
    "roll(bytes12,bytes6,int128)": FunctionFragment;
    "series(bytes6)": FunctionFragment;
    "slurp(bytes12,int128,int128)": FunctionFragment;
    "stir(bytes12,bytes12,uint128)": FunctionFragment;
    "timestamps(bytes12)": FunctionFragment;
    "tweak(bytes12,bytes6,bytes6)": FunctionFragment;
    "vaults(bytes12)": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "assets", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "balances", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "build",
    values: [string, BytesLike, BytesLike, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "destroy", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "give",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(functionFragment: "grab", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "pour",
    values: [BytesLike, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "rateOracles",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "roll",
    values: [BytesLike, BytesLike, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "series", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "slurp",
    values: [BytesLike, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "stir",
    values: [BytesLike, BytesLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "timestamps",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "tweak",
    values: [BytesLike, BytesLike, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "vaults", values: [BytesLike]): string;

  decodeFunctionResult(functionFragment: "assets", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "balances", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "build", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "destroy", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "give", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "grab", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "pour", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "rateOracles",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "roll", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "series", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "slurp", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "stir", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "timestamps", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "tweak", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "vaults", data: BytesLike): Result;

  events: {};
}

export class ICauldron extends Contract {
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

  interface: ICauldronInterface;

  functions: {
    assets(
      assetsDd: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "assets(bytes6)"(
      assetsDd: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    balances(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<[[BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }]>;

    "balances(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<[[BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }]>;

    build(
      owner: string,
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "build(address,bytes12,bytes6,bytes6)"(
      owner: string,
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    destroy(
      vault: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "destroy(bytes12)"(
      vault: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    give(
      vaultId: BytesLike,
      user: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "give(bytes12,address)"(
      vaultId: BytesLike,
      user: string,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    grab(vault: BytesLike, overrides?: Overrides): Promise<ContractTransaction>;

    "grab(bytes12)"(
      vault: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    pour(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "pour(bytes12,int128,int128)"(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    rateOracles(
      baseId: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "rateOracles(bytes6)"(
      baseId: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    roll(
      vaultId: BytesLike,
      seriesId: BytesLike,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "roll(bytes12,bytes6,int128)"(
      vaultId: BytesLike,
      seriesId: BytesLike,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    series(
      seriesId: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "series(bytes6)"(
      seriesId: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    slurp(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "slurp(bytes12,int128,int128)"(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    stir(
      from: BytesLike,
      to: BytesLike,
      ink: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "stir(bytes12,bytes12,uint128)"(
      from: BytesLike,
      to: BytesLike,
      ink: BigNumberish,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    timestamps(vault: BytesLike, overrides?: CallOverrides): Promise<[number]>;

    "timestamps(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<[number]>;

    tweak(
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "tweak(bytes12,bytes6,bytes6)"(
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    vaults(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [
        [string, string, string] & {
          owner: string;
          seriesId: string;
          ilkId: string;
        }
      ]
    >;

    "vaults(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [
        [string, string, string] & {
          owner: string;
          seriesId: string;
          ilkId: string;
        }
      ]
    >;
  };

  assets(
    assetsDd: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "assets(bytes6)"(
    assetsDd: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  balances(
    vault: BytesLike,
    overrides?: CallOverrides
  ): Promise<[BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }>;

  "balances(bytes12)"(
    vault: BytesLike,
    overrides?: CallOverrides
  ): Promise<[BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }>;

  build(
    owner: string,
    vaultId: BytesLike,
    seriesId: BytesLike,
    ilkId: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "build(address,bytes12,bytes6,bytes6)"(
    owner: string,
    vaultId: BytesLike,
    seriesId: BytesLike,
    ilkId: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  destroy(
    vault: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "destroy(bytes12)"(
    vault: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  give(
    vaultId: BytesLike,
    user: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "give(bytes12,address)"(
    vaultId: BytesLike,
    user: string,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  grab(vault: BytesLike, overrides?: Overrides): Promise<ContractTransaction>;

  "grab(bytes12)"(
    vault: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  pour(
    vaultId: BytesLike,
    ink: BigNumberish,
    art: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "pour(bytes12,int128,int128)"(
    vaultId: BytesLike,
    ink: BigNumberish,
    art: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  rateOracles(
    baseId: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "rateOracles(bytes6)"(
    baseId: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  roll(
    vaultId: BytesLike,
    seriesId: BytesLike,
    art: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "roll(bytes12,bytes6,int128)"(
    vaultId: BytesLike,
    seriesId: BytesLike,
    art: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  series(
    seriesId: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "series(bytes6)"(
    seriesId: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  slurp(
    vaultId: BytesLike,
    ink: BigNumberish,
    art: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "slurp(bytes12,int128,int128)"(
    vaultId: BytesLike,
    ink: BigNumberish,
    art: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  stir(
    from: BytesLike,
    to: BytesLike,
    ink: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "stir(bytes12,bytes12,uint128)"(
    from: BytesLike,
    to: BytesLike,
    ink: BigNumberish,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  timestamps(vault: BytesLike, overrides?: CallOverrides): Promise<number>;

  "timestamps(bytes12)"(
    vault: BytesLike,
    overrides?: CallOverrides
  ): Promise<number>;

  tweak(
    vaultId: BytesLike,
    seriesId: BytesLike,
    ilkId: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "tweak(bytes12,bytes6,bytes6)"(
    vaultId: BytesLike,
    seriesId: BytesLike,
    ilkId: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  vaults(
    vault: BytesLike,
    overrides?: CallOverrides
  ): Promise<
    [string, string, string] & {
      owner: string;
      seriesId: string;
      ilkId: string;
    }
  >;

  "vaults(bytes12)"(
    vault: BytesLike,
    overrides?: CallOverrides
  ): Promise<
    [string, string, string] & {
      owner: string;
      seriesId: string;
      ilkId: string;
    }
  >;

  callStatic: {
    assets(assetsDd: BytesLike, overrides?: CallOverrides): Promise<string>;

    "assets(bytes6)"(
      assetsDd: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    balances(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }>;

    "balances(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }>;

    build(
      owner: string,
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "build(address,bytes12,bytes6,bytes6)"(
      owner: string,
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    destroy(vault: BytesLike, overrides?: CallOverrides): Promise<void>;

    "destroy(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    give(
      vaultId: BytesLike,
      user: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "give(bytes12,address)"(
      vaultId: BytesLike,
      user: string,
      overrides?: CallOverrides
    ): Promise<void>;

    grab(vault: BytesLike, overrides?: CallOverrides): Promise<void>;

    "grab(bytes12)"(vault: BytesLike, overrides?: CallOverrides): Promise<void>;

    pour(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }>;

    "pour(bytes12,int128,int128)"(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }>;

    rateOracles(baseId: BytesLike, overrides?: CallOverrides): Promise<string>;

    "rateOracles(bytes6)"(
      baseId: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    roll(
      vaultId: BytesLike,
      seriesId: BytesLike,
      art: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "roll(bytes12,bytes6,int128)"(
      vaultId: BytesLike,
      seriesId: BytesLike,
      art: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    series(
      seriesId: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [string, string, number] & {
        fyToken: string;
        baseId: string;
        maturity: number;
      }
    >;

    "series(bytes6)"(
      seriesId: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [string, string, number] & {
        fyToken: string;
        baseId: string;
        maturity: number;
      }
    >;

    slurp(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }>;

    "slurp(bytes12,int128,int128)"(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }>;

    stir(
      from: BytesLike,
      to: BytesLike,
      ink: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        [BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber },
        [BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }
      ]
    >;

    "stir(bytes12,bytes12,uint128)"(
      from: BytesLike,
      to: BytesLike,
      ink: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        [BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber },
        [BigNumber, BigNumber] & { art: BigNumber; ink: BigNumber }
      ]
    >;

    timestamps(vault: BytesLike, overrides?: CallOverrides): Promise<number>;

    "timestamps(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<number>;

    tweak(
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "tweak(bytes12,bytes6,bytes6)"(
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    vaults(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [string, string, string] & {
        owner: string;
        seriesId: string;
        ilkId: string;
      }
    >;

    "vaults(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [string, string, string] & {
        owner: string;
        seriesId: string;
        ilkId: string;
      }
    >;
  };

  filters: {};

  estimateGas: {
    assets(assetsDd: BytesLike, overrides?: Overrides): Promise<BigNumber>;

    "assets(bytes6)"(
      assetsDd: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    balances(vault: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    "balances(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    build(
      owner: string,
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "build(address,bytes12,bytes6,bytes6)"(
      owner: string,
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    destroy(vault: BytesLike, overrides?: Overrides): Promise<BigNumber>;

    "destroy(bytes12)"(
      vault: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    give(
      vaultId: BytesLike,
      user: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "give(bytes12,address)"(
      vaultId: BytesLike,
      user: string,
      overrides?: Overrides
    ): Promise<BigNumber>;

    grab(vault: BytesLike, overrides?: Overrides): Promise<BigNumber>;

    "grab(bytes12)"(
      vault: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    pour(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "pour(bytes12,int128,int128)"(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    rateOracles(baseId: BytesLike, overrides?: Overrides): Promise<BigNumber>;

    "rateOracles(bytes6)"(
      baseId: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    roll(
      vaultId: BytesLike,
      seriesId: BytesLike,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "roll(bytes12,bytes6,int128)"(
      vaultId: BytesLike,
      seriesId: BytesLike,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    series(seriesId: BytesLike, overrides?: Overrides): Promise<BigNumber>;

    "series(bytes6)"(
      seriesId: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    slurp(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "slurp(bytes12,int128,int128)"(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    stir(
      from: BytesLike,
      to: BytesLike,
      ink: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "stir(bytes12,bytes12,uint128)"(
      from: BytesLike,
      to: BytesLike,
      ink: BigNumberish,
      overrides?: Overrides
    ): Promise<BigNumber>;

    timestamps(vault: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    "timestamps(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    tweak(
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "tweak(bytes12,bytes6,bytes6)"(
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    vaults(vault: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    "vaults(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    assets(
      assetsDd: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "assets(bytes6)"(
      assetsDd: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    balances(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "balances(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    build(
      owner: string,
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "build(address,bytes12,bytes6,bytes6)"(
      owner: string,
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    destroy(
      vault: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "destroy(bytes12)"(
      vault: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    give(
      vaultId: BytesLike,
      user: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "give(bytes12,address)"(
      vaultId: BytesLike,
      user: string,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    grab(
      vault: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "grab(bytes12)"(
      vault: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    pour(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "pour(bytes12,int128,int128)"(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    rateOracles(
      baseId: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "rateOracles(bytes6)"(
      baseId: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    roll(
      vaultId: BytesLike,
      seriesId: BytesLike,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "roll(bytes12,bytes6,int128)"(
      vaultId: BytesLike,
      seriesId: BytesLike,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    series(
      seriesId: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "series(bytes6)"(
      seriesId: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    slurp(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "slurp(bytes12,int128,int128)"(
      vaultId: BytesLike,
      ink: BigNumberish,
      art: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    stir(
      from: BytesLike,
      to: BytesLike,
      ink: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "stir(bytes12,bytes12,uint128)"(
      from: BytesLike,
      to: BytesLike,
      ink: BigNumberish,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    timestamps(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "timestamps(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    tweak(
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "tweak(bytes12,bytes6,bytes6)"(
      vaultId: BytesLike,
      seriesId: BytesLike,
      ilkId: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    vaults(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "vaults(bytes12)"(
      vault: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
