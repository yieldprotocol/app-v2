import { ethers, BigNumber } from 'ethers';
import { FYToken, Pool } from '../contracts';

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
  displayName: string;
  displayNameMobile: string;
  maturity: number;
  maturityDate: Date;
  fyTokenContract: FYToken;
  poolContract:Pool;
  baseId: string;
  fyTokenAddress: string;
  // baked in token fns
  getBaseAddress: ()=> string; // antipattern, but required here because app simulatneoulsy gets assets and series
}

export interface IAssetRoot {
  // fixed/static:
  id: string;
  symbol: string;
  displayName: string;
  displayNameMobile: string;
  address: string;
  joinAddress: string,
  // baked in token fns
  getBalance: ()=>BigNumber,
  getAllowance: (spender: string)=>BigNumber,
}

export interface IVaultRoot {
  id: string;
  ilkId: string;
  baseId: string;
  seriesId: string;
  image: string;
  displayId? : string;
  name?: string;
}

export interface ISeries extends ISeriesRoot {
  APR: string;
  baseReserves: BigNumber;
  fyTokenReserves: BigNumber;
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
  args: string[];
  operation: [ number, string[]];
  series?: ISeriesRoot;
  fnName?: string;
  ignore?: boolean;
  overrides?: ethers.CallOverrides;
}

export interface ISignData {
  series: ISeriesRoot,
  asset: IAssetRoot,
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
