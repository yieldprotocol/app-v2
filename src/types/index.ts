import { ethers, BigNumber } from 'ethers';
import { FYToken, Pool } from '../contracts';

export interface ISeriesStatic {
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

export interface IAssetStatic {
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

export interface IVaultStatic {
  id: string;
  ilkId: string;
  baseId: string;
  seriesId: string;
  image: string;
  displayId? : string;
  // getSeries : ()=> ISeries;
  // getBase : ()=> IAsset;
  // getIlk: ()=>IAsset;
}

export interface ISeries extends ISeriesStatic {
  APR: string;
  baseReserves: BigNumber;
  fyTokenReserves: BigNumber;
  poolTokens?: BigNumber|undefined;
  poolTokens_?: string|undefined;
  fyTokenBalance? : BigNumber|undefined;
  fyTokenBalance_? : string|undefined;
}

export interface IAsset extends IAssetStatic {
  balance: BigNumber;
  balance_: string;
}

export interface IVault extends IVaultStatic {
  ink: BigNumber;
  art: BigNumber;
  ink_: string;
  art_: string;
}

export interface ICallData {
  args: string[];
  operation: [ number, string[]];
  series?: ISeriesStatic;
  fnName?: string;
  ignore?: boolean;
  overrides?: ethers.CallOverrides;
}

export interface ISignData {
  series: ISeriesStatic,
  asset: IAssetStatic,
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
