import { ethers, BigNumber, BigNumberish, ContractTransaction, Contract } from 'ethers';
import React from 'react';
import { ERC20Permit, FYToken, Pool, Strategy } from '../contracts';

export { LadleActions, RoutedActions } from './operations';

export interface IChainContext {
  chainState: IChainContextState;
  chainActions: IChainContextActions;
}

export interface IChainContextState {
  appVersion: string;
  connection: IConnectionState;

  chainLoading: boolean;

  contractMap: Map<string, Contract>;
  assetRootMap: Map<string, IAssetRoot>;
  seriesRootMap: Map<string, ISeriesRoot>;
  strategyRootMap: Map<string, IStrategyRoot>;
}

export interface IConnectionState {
  provider: ethers.providers.JsonRpcProvider | null;
  chainId: number | null;
  fallbackProvider: ethers.providers.Web3Provider | null;
  fallbackChainId: number | null;
  signer: ethers.providers.JsonRpcSigner | null;
  account: string | null;
  web3Active: boolean;
  fallbackActive: boolean;
  connectorName: string | null;
}

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

export interface IChainContextActions {
  connect: (connection: string) => void;
  disconnect: () => void;
  isConnected: (connection: string) => void;
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

  assetPairMap: Map<string, IAssetPair>;

  vaultsLoading: boolean;
  seriesLoading: boolean;
  assetsLoading: boolean;
  strategiesLoading: boolean;
  assetPairLoading: boolean;

  selectedSeries: ISeries | null;
  selectedIlk: IAsset | null;
  selectedBase: IAsset | null;
  selectedVault: IVault | null;
  selectedStrategy: IStrategy | null;
}

export interface IUserContextActions {
  updateVaults: (vaultList: IVault[]) => void;
  updateSeries: (seriesList: ISeries[]) => void;
  updateAssets: (assetList: IAsset[]) => void;
  updateStrategies: (strategyList: IStrategy[]) => void;

  updateAssetPair: (baseId: string, ilkId: string) => Promise<IAssetPair>;

  setSelectedSeries: (series: ISeries | null) => void;
  setSelectedIlk: (ilk: IAsset | null) => void;
  setSelectedBase: (base: IAsset | null) => void;
  setSelectedVault: (vault: IVault | IDummyVault | null) => void;
  setSelectedStrategy: (strategy: IStrategy | null) => void;
}

export interface ISettingsContext {
  settingsState: ISettingsContextState;
  settingsActions: { updateSetting: (setting: string, value: string | number | boolean) => void };
}
export interface ISettingsContextState {
  /* User Settings ( getting from the cache first ) */
  slippageTolerance: number;
  darkMode: boolean;
  autoTheme: boolean;
  forceTransactions: boolean;
  approvalMethod: ApprovalType;
  approveMax: boolean;
  disclaimerChecked: boolean;
  powerUser: boolean;
  diagnostics: boolean;
  /* Token wrapping */
  showWrappedTokens: boolean;
  unwrapTokens: boolean;
  /* DashSettings */
  dashHideEmptyVaults: boolean;
  dashHideInactiveVaults: boolean;
  dashHideVaults: boolean;
  dashHideLendPositions: boolean;
  dashHidePoolPositions: boolean;
  dashCurrency: string;
}

export interface ISignable {
  name: string;
  version: string;
  address: string;
  symbol: string;
}

export interface ISeriesRoot extends ISignable {
  id: string;
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

export interface IAssetInfo {
  showToken: boolean;
  isWrappedToken: boolean; // Note: this is if it a token wrapped by the yield protocol (expect ETH - which is handled differently)

  color: string;
  digitFormat: number; // this is the 'resonable' number of digits to show. accuracy equavalent to +- 1 us cent.

  displaySymbol?: string; // override for symbol display
  wrapHandlerAddress?: string;

  wrappedTokenId?: string;
  unwrappedTokenId?: string;

  wrappedTokenAddress?: string;
  unwrappedTokenAddress?: string;
}

export interface IAssetRoot extends IAssetInfo, ISignable {
  // fixed/static:
  id: string;
  decimals: number;
  color: string;
  image: React.FC;
  displayName: string;
  displayNameMobile: string;
  joinAddress: string;

  digitFormat: number;
  baseContract: ERC20Permit;

  isYieldBase: boolean;
  idToUse: string;

  // baked in token fns
  getBalance: (account: string) => Promise<BigNumber>;
  getAllowance: (account: string, spender: string) => Promise<BigNumber>;
}

export interface IAssetPair {
  baseId: string;
  ilkId: string;
  
  baseDecimals: number;
  limitDecimals: number;
  minRatio: number;

  minDebtLimit: BigNumber;
  maxDebtLimit: BigNumber;
  pairPrice: BigNumber;
  pairTotalDebt: BigNumber;

  oracle?: string;
}

export interface IStrategyRoot extends ISignable {
  id: string;
  baseId: string;
  decimals: number;
  strategyContract: Strategy;
}

export interface IVaultRoot {
  id: string;
  ilkId: string;
  baseId: string;
  seriesId: string;
  displayName: string;
  decimals: number;
}

export interface ISeries extends ISeriesRoot {
  apr: string;
  baseReserves: BigNumber;
  baseReserves_: string;
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
  balance: BigNumber;
  balance_: string;
}

export interface IDummyVault extends IVaultRoot {}
export interface IVault extends IVaultRoot, IAssetPair {
  owner: string;
  isWitchOwner: boolean;
  isActive: boolean;
  ink: BigNumber;
  art: BigNumber;
  ink_: string;
  art_: string;
}

export interface IStrategy extends IStrategyRoot {
  currentSeriesId: string;
  currentPoolAddr: string;
  nextSeriesId: string;

  currentSeries: ISeries | undefined;
  nextSeries: ISeries | undefined;
  active: boolean;

  invariant?: string | BigNumber;
  histInvariant?: string | BigNumber;
  returnRate?: string;
  returnRate_?: string;

  strategyTotalSupply?: BigNumber;
  strategyTotalSupply_?: string;

  poolTotalSupply?: BigNumber;
  poolTotalSupply_?: string;

  strategyPoolBalance?: BigNumber;
  strategyPoolBalance_?: string;
  strategyPoolPercent?: string;

  accountBalance?: BigNumber;
  accountBalance_?: string;
  accountStrategyPercent?: string | undefined;

  accountPoolBalance?: BigNumber;
  accountPoolBalance_?: string;
  accountPoolPercent?: string | undefined;
}

export interface ICallData {
  args: (string | BigNumberish | boolean)[];
  operation: string | [number, string[]];

  /* optionals */
  targetContract?: ethers.Contract;
  fnName?: string;
  ignoreIf?: boolean;
  overrides?: ethers.CallOverrides;
}

export interface ISignData {
  target: ISignable;
  spender: string;

  /* optional Extention/advanced use-case options */
  amount?: BigNumberish;
  message?: string; // optional messaging for UI
  domain?: IDomain; // optional Domain if required
  ignoreIf?: boolean; // conditional for ignoring
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

export interface IYieldTx extends ContractTransaction {
  txCode: string;
  receipt: any | null;
  status: TxState;
}

export enum ProcessStage {
  'PROCESS_INACTIVE' = 0,
  'SIGNING_REQUESTED' = 1,
  'SIGNING_TRANSACTION_PENDING' = 2,
  'SIGNING_COMPLETE' = 3,
  'TRANSACTION_REQUESTED' = 4,
  'TRANSACTION_PENDING' = 5,
  'PROCESS_COMPLETE' = 6,
  'PROCESS_COMPLETE_TIMEOUT' = 7,
}

export interface IYieldProcess {
  txCode: string;
  stage: ProcessStage;
  tx: IYieldTx;
  txHash: string;
  timeout: boolean;
  processActive?: boolean;
  positionPath?: string | undefined;
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

export enum AddLiquidityType {
  BUY = 'BUY',
  BORROW = 'BORROW',
}

export enum ContractNames {}

export enum YieldColors {
  SUCCESS = 'success',
  FAILED = 'error',
  WARNING = 'warning',
  GRADIENT = '',
  GRADIENT_TRANSPARENT = '',
  PRIMARY = '',
  SECONDARY = '',
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
  CLOSE_POSITION = 'Redeem Position',
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
  actionCode: ActionCodes;
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

export interface IDashSettings {
  hideEmptyVaults: boolean;
  showInactiveVaults: boolean;
  hideInactiveVaults: boolean;
  hideVaultPositions: boolean;
  hideLendPositions: boolean;
  hidePoolPositions: boolean;
  currencySetting: string;
}
