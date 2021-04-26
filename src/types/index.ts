import { ethers, BigNumber, ContractFactory } from 'ethers';
import { FYToken, Pool } from '../contracts';

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
  fyTokenContract: FYToken;
  poolContract:Pool;
  baseId: string;
  fyTokenAddress: string;
  getBaseAddress: ()=> string;

  // optional/calculated/mutable:
  maturityDate?: Date;
  apr?: string;
}

export interface IYieldAsset {
  // reqd/fixed:
  id: string;
  symbol: string;
  displayName: string;
  displayNameMobile: string;
  address: string;
  joinAddress: string,
  /* baked in token fns */
  balance: ()=>BigNumber,
  allowance: ()=>BigNumber,
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
  args: string[];
  operation: [ number, string[]];
  series?: IYieldSeries;
  fnName?: string;
  ignore?: boolean;
  overrides?: ethers.CallOverrides;
}

export interface ISigData {
  series: IYieldSeries,
  asset: IYieldAsset,
  type: SignType;
  fallbackCall: any; // calldata to process if fallbackTx is used
  ignore?: boolean; // conditional for ignoring

  /* optional Extention/advanced use-case options */
  message?: string, // optional messaging for UI
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
