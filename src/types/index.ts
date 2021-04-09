import { ethers, BigNumber, ContractFactory } from 'ethers';

export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface IYieldSeries {
  // reqd/fixed:
  id: string;
  displayName: string;
  displayNameMobile: string;
  maturity: number;
  fyToken:string;
  pool:string;
  baseId: string;

  contract?: ContractFactory;
  // optional/calculated/mutable:
  maturityDate?: Date;
  apr?: string;
}

export interface IYieldAsset {
  // reqd/fixed:
  id: number;
  symbol: string;
  displayName: string;
  displayNameMobile: string;
  address: string;
  // optional/calculated/mutable:
}

export interface IYieldVault {
  id: string;
  ilk: IYieldAsset;
  base: IYieldAsset;
  series: IYieldSeries;
  ink: BigNumber;
  art: BigNumber;

  ink_: string;
  art_: string;

  image: string;
  displayId? : string;

}

export interface ICallData {
  fn: string;
  args: string[];
  ignore?: boolean;
  overrides?: ethers.CallOverrides;
}

export interface ISigData {
  assetOrSeriesId: string,
  fallbackCall: ICallData; // calldata to process if fallbackTx is used
  type: SignType;
  ignore: boolean; // conditional for ignoring
  message?: string, // optional messaging for UI

  /* optional Extention/advanced use-case options */
  tokenAddress?: string;
  spender?: string;
  domain?: IDomain;
}

export interface IDaiPermitMessage {
  holder: string;
  spender: string;
  nonce: number;
  expiry: number | string;
  allowed?: boolean;
}

export interface IERC2612PermitMessage {
  owner: string;
  spender: string;
  value: number | string;
  nonce: number | string;
  deadline: number | string;
}

export interface IDomain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export enum SignType {
  ERC2612 = 'ERC2612_TYPE',
  DAI = 'DAI_TYPE',
  FYTOKEN = 'FYTOKEN_TYPE',
}

export interface IYieldUser {
  // reqd/fixed:
  id: number;
  address: string;
  // optional/calculated/mutable:
}

export interface IMenuProps {
  toggleMenu: ()=>void;
}

export enum View {
  account = 'ACCOUNT',
  vaults = 'VAULTS',
}
