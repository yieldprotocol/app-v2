import { ethers, BigNumber } from 'ethers';
import { Settings } from 'http2';
import { ERC20, FYToken, Pool } from '../contracts';

export interface IUserContext {
  userState : IUserContextState;
  userActions : IUserContextActions;
}

export interface IUserContextState {
  activeAccount: string|null;

  assetMap: Map<string, IAsset>;
  seriesMap: Map<string, ISeries>;
  vaultMap: Map<string, IVault>;

  selectedSeriesId: string|null;
  selectedIlkId: string|null;
  selectedBaseId: string|null;
  selectedVaultId: string|null;
}

export interface IUserContextActions {

  updateVaults: (vaultList: IVault[]) => void;
  updateSeries: (seriesList: ISeries[]) => void;
  updateAssets: (assetList: IAsset[]) => void;

  setSelectedSeries: (seriesId: string) => void;
  setSelectedIlk: (ilkId: string) => void;
  setSelectedBase: (baseId: string) => void;
  setSelectedVault: (vaultId: string) => void;
}

export interface ISeriesRoot {
  // fixed/static:
  id: string;
  name: string;
  symbol: string;
  address: string;
  version: string;
  displayName: string;
  displayNameMobile: string;
  maturity: number;
  maturityDate: Date;
  fyTokenContract: FYToken;
  fyTokenAddress: string;
  poolContract:Pool;
  poolAddress: string;
  poolName: string;
  poolVersion: string; // for signing
  baseId: string;

  // baked in token fns
  getTimeTillMaturity: () => string;
  isMature: () => boolean;
  getBaseAddress: ()=> string; // antipattern, but required here because app simulatneoulsy gets assets and series
}

export interface IAssetRoot {
  // fixed/static:
  id: string;
  symbol: string;
  name: string;
  version: string;
  displayName: string;
  displayNameMobile: string;
  address: string;
  joinAddress: string,
  // baked in token fns
  getBalance: (account: string)=>Promise<BigNumber>,
  getAllowance: (account: string, spender: string)=>Promise<BigNumber>,
}

export interface IVaultRoot {
  id: string;
  ilkId: string;
  baseId: string;
  seriesId: string;
  image: string;
  displayName : string;
}

export interface ISeries extends ISeriesRoot {
  APR: string;
  baseReserves: BigNumber;
  fyTokenReserves: BigNumber;
  fyTokenRealReserves: BigNumber;
  totalSupply: BigNumber;
  seriesIsMature: boolean;

  poolTokens?: BigNumber|undefined;
  poolTokens_?: string|undefined;
  fyTokenBalance? : BigNumber|undefined;
  fyTokenBalance_? : string|undefined;
}

export interface IAsset extends IAssetRoot {
  balance: BigNumber;
  balance_: string;
}

export interface IVault extends IVaultRoot {
  ink: BigNumber;
  art: BigNumber;
  ink_: string;
  art_: string;
}

export interface ICallData {
  args: (string|BigNumber|boolean)[];
  operation: [ number, string[]];
  series: ISeries;
  fnName?: string;
  ignore?: boolean;
  overrides?: ethers.CallOverrides;
}

export interface ISignData {
  target: ISeries | IAsset | { id: string; name:string; version:string; address:string; };
  spender: 'POOLROUTER'|'LADLE'| string;
  type: SignType;
  series: ISeries;
  fallbackCall: any; // TODO make ICallData calldata to process if fallbackTx is used

  /* optional Extention/advanced use-case options */
  message?: string; // optional messaging for UI
  ignore?: boolean; // conditional for ignoring
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

export enum ActionType {
  BORROW = 'BORROW',
  LEND = 'LEND',
  POOL = 'POOL',
}

export enum MenuView {
  account = 'ACCOUNT',
  settings = 'SETTINGS',
  vaults = 'VAULTS',
}
