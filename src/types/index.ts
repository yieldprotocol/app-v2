import { ethers, BigNumber, BigNumberish } from 'ethers';
import React from 'react';
import { FYToken, Pool, Strategy } from '../contracts';

export { LadleActions, RoutedActions } from './operations';

export interface IHistoryList {
  lastBlock: number;
  items: any[];
}
export interface IHistoryContextState {
  historyLoading: boolean;
  tradeHistory: IHistoryList;
  poolHistory: IHistoryList;
  vaultHistory: IHistoryList;
}

export interface IUserContext {
  userState: IUserContextState;
  userActions: IUserContextActions;
}

export interface IUserContextState {
  userLoading: boolean;
  activeAccount: string | null;

  assetMap: Map<string, IAsset>;
  seriesMap: Map<string, ISeries>;
  vaultMap: Map<string, IVault>;
  strategyMap: Map<string, IStrategy>;
  priceMap: Map<string, Map<string, any>>;

  vaultsLoading: boolean;
  seriesLoading: boolean;
  assetsLoading: boolean;
  strategiesLoading: boolean;
  pricesLoading: boolean;

  selectedSeriesId: string | null;
  selectedIlkId: string | null;
  selectedBaseId: string | null;
  selectedVaultId: string | null;
  selectedStrategyAddr: string | null;

  approvalMethod: ApprovalType;
  dudeSalt: number;
  showInactiveVaults: boolean;
  slippageTolerance: number;
  hideBalancesSetting: string | null;
  currencySetting: string;
}

export interface IUserContextActions {
  updateVaults: (vaultList: IVault[]) => void;
  updateSeries: (seriesList: ISeries[]) => void;
  updateAssets: (assetList: IAsset[]) => void;
  updatePrice: (base: string, ilk: string) => void;
  setSelectedSeries: (seriesId: string) => void;
  setSelectedIlk: (ilkId: string | null) => void;
  setSelectedBase: (baseId: string | null) => void;
  setSelectedVault: (vaultId: string | null) => void;
}

export interface ISeriesRoot {
  id: string;
  name: string;
  symbol: string;
  address: string;
  version: string;
  displayName: string;
  displayNameMobile: string;
  maturity: number;
  fullDate: Date;
  fyTokenContract: FYToken;
  fyTokenAddress: string;
  poolContract: Pool;
  poolAddress: string;
  poolName: string;
  poolVersion: string; // for signing
  poolSymbol: string; // for signing

  decimals: number;

  baseId: string;

  color: string;
  textColor: string;
  startColor: string;
  endColor: string;

  oppositeColor: string;
  oppStartColor: string;
  oppEndColor: string;

  seriesMark: React.ElementType;

  // baked in token fns
  getTimeTillMaturity: () => string;
  isMature: () => boolean;
  getBaseAddress: () => string; // antipattern, but required here because app simulatneoulsy gets assets and series
}

export interface IAssetRoot {
  // fixed/static:
  id: string;
  symbol: string;
  name: string;
  version: string;
  decimals: number;
  color: string;
  image: React.FC;
  displayName: string;
  displayNameMobile: string;
  address: string;
  joinAddress: string;
  digitFormat: number;

  // baked in token fns
  getBalance: (account: string) => Promise<BigNumber>;
  getAllowance: (account: string, spender: string) => Promise<BigNumber>;
  mintTest: () => Promise<VoidFunction>;
}

export interface IStrategyRoot {
  address: string;
  name: string;
  symbol: string;
  baseId: string;
  strategyContract: Strategy;
}

export interface IVaultRoot {
  id: string;
  ilkId: string;
  baseId: string;
  seriesId: string;
  image: string;
  displayName: string;
  decimals: number;
}

export interface ISeries extends ISeriesRoot {
  apr: string;
  baseReserves: BigNumber;
  fyTokenReserves: BigNumber;
  fyTokenRealReserves: BigNumber;
  totalSupply: BigNumber;
  totalSupply_: string;

  poolTokens?: BigNumber | undefined;
  poolTokens_?: string | undefined;
  fyTokenBalance?: BigNumber | undefined;
  fyTokenBalance_?: string | undefined;

  poolPercent?: string | undefined;

  seriesIsMature: boolean;
}

export interface IAsset extends IAssetRoot {
  isYieldBase: boolean;
  balance: BigNumber;
  balance_: string;
  hasLadleAuth: boolean;
  hasJoinAuth: boolean;
}

export interface IVault extends IVaultRoot {
  owner: string;
  isActive: boolean;
  ink: BigNumber;
  art: BigNumber;
  ink_: string;
  art_: string;
  price: BigNumber;
  price_: string;
  minDebt: BigNumber;
  maxDebt: BigNumber;
}

export interface IStrategy extends IStrategyRoot {
  
  strategyTotalSupply: BigNumber;
  poolTotalSupply: BigNumber;

  currentSeriesId: string;
  currentPoolAddr: string;
  nextSeriesId: string;

  currentSeries: ISeries|undefined;
  nextSeries: ISeries|undefined;
  active: boolean;

  balance?: BigNumber;
  balance_?: string;
}

export interface ICallData {
  args: (string | BigNumberish | boolean)[];
  operation: string | [number, string[]];
  /* optionals */
  targetContract?: Strategy | Pool;
  fnName?: string;
  ignoreIf?: boolean;
  overrides?: ethers.CallOverrides;
}

export interface ISignData {
  target: ISeries | IAsset | { name: string; version: string; address: string; symbol: string };
  spender: 'LADLE' | string;

  /* optional Extention/advanced use-case options */
  amount?: BigNumberish;

  message?: string; // optional messaging for UI
  ignoreIf?: boolean; // conditional for ignoring
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

export enum ApprovalType {
  TX = 'TX',
  SIG = 'SIG',
}
export enum SignType {
  ERC2612 = 'ERC2612_TYPE',
  DAI = 'DAI_TYPE',
  FYTOKEN = 'FYTOKEN_TYPE',
}

export enum TxState {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

export enum MenuView {
  account = 'ACCOUNT',
  settings = 'SETTINGS',
  vaults = 'VAULTS',
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

export enum ActionCodes {
  // COLLATERAL
  ADD_COLLATERAL = 'Add Collateral',
  REMOVE_COLLATERAL = 'Remove Collateral',
  // BORROW
  BORROW = 'Borrow',
  REPAY = 'Repay',
  ROLL_DEBT = 'Roll Debt',
  // LEND
  LEND = 'Lend',
  CLOSE_POSITION = 'Close Position',
  ROLL_POSITION = 'Roll Position',
  REDEEM = 'Redeem',
  // POOL
  ADD_LIQUIDITY = 'Add Liquidity',
  REMOVE_LIQUIDITY = 'Remove Liquidity',
  ROLL_LIQUIDITY = 'Roll Liquidity',
  // VAULT
  DELETE_VAULT = 'Delete Vault',
  TRANSFER_VAULT = 'Transfer Vault',
  MERGE_VAULT = 'Merge Vault',
}

export interface IBaseHistItem {
  blockNumber: number;
  date: Date;
  transactionHash: string;
  series: ISeries;
  histType: ActionCodes;
  date_: string;
  primaryInfo: string;
  secondaryInfo?: string;
}

export interface IHistItemVault extends IBaseHistItem {
  ilkId: string;
  ink: BigNumber;
  art: BigNumber;
  ink_: String;
  art_: String;
}

export interface IHistItemPosition extends IBaseHistItem {
  bases: BigNumber;
  fyTokens: BigNumber;
  bases_: string;
  fyTokens_: string;
  poolTokens?: BigNumber;
  poolTokens_?: string;
}
