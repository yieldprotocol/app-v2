import { ethers, BigNumber } from 'ethers';
import { FYToken, Pool } from '../contracts';

export interface ISeries {
  // reqd/fixed:
  id: string;
  displayName: string;
  displayNameMobile: string;
  maturity: number;
  maturityDate: Date;
  fyTokenContract: FYToken;
  poolContract:Pool;
  baseId: string;
  fyTokenAddress: string;
  // baked in token fns
  getBaseAddress: ()=> string;

  // optional/calculated/mutable:
  apr?: string;
}

export interface IAsset {
  // reqd/fixed:
  id: string;
  symbol: string;
  displayName: string;
  displayNameMobile: string;
  address: string;
  joinAddress: string,
  // baked in token fns
  getBalance: ()=>BigNumber,
  getAllowance: ()=>BigNumber,
}

export interface IVault {
  id: string;
  ilk: IAsset;
  base: IAsset;
  series: ISeries;
  image: string;
  displayId? : string;
}

export interface ISeriesData extends ISeries {
  apr: string;
  baseReserves: BigNumber;
  fyTokenReserves: BigNumber;
  poolTokens?: BigNumber|undefined;
  fyTokenBalance? : BigNumber|undefined;
}

export interface IAssetData extends IAsset {
  balance: BigNumber;
  balance_: string;
}

export interface IVaultData extends IVault {
  ink: BigNumber;
  art: BigNumber;
  ink_: string;
  art_: string;
}

export interface ICallData {
  args: string[];
  operation: [ number, string[]];
  series?: ISeries;
  fnName?: string;
  ignore?: boolean;
  overrides?: ethers.CallOverrides;
}

export interface ISigData {
  series: ISeries,
  asset: IAsset,
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

export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum View {
  account = 'ACCOUNT',
  vaults = 'VAULTS',
}
