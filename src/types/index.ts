import { Block } from '@ethersproject/providers';
import { ethers, BigNumber, BigNumberish, ContractTransaction, Contract } from 'ethers';
import { ReactNode } from 'react';
import { FYToken, Pool, Strategy } from '../contracts';

export { LadleActions, RoutedActions } from './operations';

export interface IChainContext {
  chainState: IChainContextState;
  chainActions: IChainContextActions;
}

export interface IChainContextState {
  chainLoaded: boolean;
  contractMap: Map<string, Contract>;
  assetRootMap: Map<string, IAssetRoot>;
  seriesRootMap: Map<string, ISeriesRoot>;
  strategyRootMap: Map<string, IStrategyRoot>;
}

export interface IHistoryList {
  lastBlock: number;
  items: any[];
}

export interface IHistoryContext {
  historyState: IHistoryContextState;
  historyActions: IHistoryContextActions;
}

export interface IHistoryContextState {
  historyLoading: boolean;
  tradeHistory: IHistoryList;
  poolHistory: IHistoryList;
  vaultHistory: IHistoryList;
}

export interface IHistoryContextActions {
  updatePoolHistory: (seriesList: ISeries[]) => Promise<void>;
  updateStrategyHistory: (strategyList: IStrategy[]) => Promise<void>;
  updateVaultHistory: (vaultList: IVault[]) => Promise<void>;
  updateTradeHistory: (seriesList: ISeries[]) => Promise<void>;
}

export interface IChainContextActions {
  connect: (connection: string) => void;
  disconnect: () => void;
  isConnected: (connection: string) => void;
  useTenderly: (shouldUse: boolean) => void;

  exportContractAddresses: () => void;
}

export interface IPriceContextState {
  pairMap: Map<string, IAssetPair>;
  pairLoading: string[];
}

export interface IPriceContextActions {
  updateAssetPair: (baseId: string, ilkId: string) => Promise<void>;
}

export interface IPriceContext {
  priceState: IPriceContextState;
  priceActions: IPriceContextActions;
}

export interface IUserContext {
  userState: IUserContextState;
  userActions: IUserContextActions;
}

export interface IUserContextState {
  userLoading: boolean;

  assetMap: Map<string, IAsset> | undefined;
  seriesMap: Map<string, ISeries> | undefined;
  vaultMap: Map<string, IVault> | undefined;
  strategyMap: Map<string, IStrategy> | undefined;

  vaultsLoading: boolean;
  seriesLoading: boolean;
  assetsLoading: boolean;
  strategiesLoading: boolean;

  selectedSeries: ISeries | null;
  selectedIlk: IAsset | null;
  selectedBase: IAsset | null;
  selectedVault: IVault | null;
  selectedStrategy: IStrategy | null;
}

export interface IUserContextActions {
  updateVaults: (vaultList?: IVault[]) => void;
  updateSeries: (seriesList: ISeries[]) => void;
  updateAssets: (assetList: IAsset[]) => void;
  updateStrategies: (strategyList: IStrategy[]) => void;

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

  useTenderlyFork: boolean;

  /* DashSettings */
  dashHideEmptyVaults: boolean;
  dashHideInactiveVaults: boolean;
  dashHideVaults: boolean;
  dashHideLendPositions: boolean;
  dashHidePoolPositions: boolean;
  dashCurrency: string;

  useFork: boolean;
  forkUrl: string;
}

export interface ISignable {
  name: string;
  version: string;
  address: string;
  symbol: string;
  tokenType: TokenType;
}

export interface ISeriesRoot extends ISignable {
  id: string;
  displayName: string;
  displayNameMobile: string;
  maturity: number;
  showSeries: boolean;

  fullDate: string;
  fyTokenContract: FYToken;
  fyTokenAddress: string;
  poolContract: Pool;
  poolAddress: string;
  poolName: string;
  poolVersion: string; // for signing
  poolSymbol: string; // for signing

  startBlock: Block; // pool init block

  decimals: number;
  ts: BigNumber;
  g1: BigNumber;
  g2: BigNumber;

  baseId: string;

  color: string;
  textColor: string;
  startColor: string;
  endColor: string;

  oppositeColor: string;
  oppStartColor: string;
  oppEndColor: string;

  seriesMark: ReactNode;
  baseAddress: string;
}

export enum TokenType {
  ERC20_,
  ERC20_Permit,
  ERC20_DaiPermit,
  ERC20_MKR,
  ERC1155_,
  ERC720_,
}

export interface IAssetInfo {
  assetAddress: string;
  joinAddress: string;

  tokenType: TokenType;
  tokenIdentifier?: number | string; // used for identifying tokens in a multitoken contract

  name: string;
  version: string;
  symbol: string;
  decimals: number;
  isYieldBase?: boolean;

  showToken: boolean; // Display/hide the token on the UI

  digitFormat: number; // this is the 'reasonable' number of digits to show. accuracy equivalent to +- 1 us cent.
  displaySymbol?: string; // override for symbol display

  limitToSeries?: string[];

  wrapHandlerAddresses?: Map<number, string>; // mapping a chain id to the corresponding wrap handler address
  unwrapHandlerAddresses?: Map<number, string>; // mapping a chain id to the correpsonding unwrap handler address
  proxyId?: string;
}

export interface IAssetRoot extends IAssetInfo, ISignable {
  // fixed/static:
  id: string;

  image: React.FC;
  displayName: string;
  displayNameMobile: string;
  joinAddress: string;

  digitFormat: number;
  assetContract: Contract;
  oracleContract: Contract;

  isWrappedToken: boolean; // Note: this is if is a token used in wrapped form by the yield protocol (except ETH - which is handled differently)
  wrappingRequired: boolean;
  proxyId: string; // id to use throughout app when referencing an asset id; uses the unwrapped asset id when the asset is wrapped (i.e: wstETH is the proxy id for stETH)

  // baked in token fns
  getBalance: (account: string) => Promise<BigNumber>;
  getAllowance: (account: string, spender: string) => Promise<BigNumber>;
  setAllowance?: (spender: string) => Promise<BigNumber | void>;
}

export interface IAssetPair {
  baseId: string;
  ilkId: string;
  oracle: string;

  baseDecimals: number;
  limitDecimals: number;

  minRatio: number;
  minDebtLimit: BigNumber;
  maxDebtLimit: BigNumber;
  pairPrice: BigNumber;
  pairTotalDebt: BigNumber;

  lastUpdate?: number;
}

export interface IStrategyRoot extends ISignable {
  id: string;
  baseId: string;
  decimals: number;
  strategyContract: Strategy;
  startBlock?: Block;
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
  sharesReserves: BigNumber;
  sharesReserves_: string;
  fyTokenReserves: BigNumber;
  fyTokenRealReserves: BigNumber;
  totalSupply: BigNumber;
  totalSupply_: string;
  sharesAddress: string;

  poolTokens?: BigNumber | undefined;
  poolTokens_?: string | undefined;
  fyTokenBalance?: BigNumber | undefined;
  fyTokenBalance_?: string | undefined;

  poolPercent?: string | undefined;
  poolAPY?: string;
  seriesIsMature: boolean;

  // Yieldspace TV
  c: BigNumber | undefined;
  mu: BigNumber | undefined;
  getShares: (baseAmount: BigNumber) => BigNumber;
  getBase: (sharesAmount: BigNumber) => BigNumber;
  currentInvariant?: BigNumber;
  initInvariant?: BigNumber;
  // startBlock?: Block;
}

export interface IAsset extends IAssetRoot {
  balance: BigNumber;
  balance_: string;
}

export interface IDummyVault extends IVaultRoot {}
export interface IVault extends IVaultRoot {
  owner: string;

  isWitchOwner: boolean;
  hasBeenLiquidated: boolean;
  isVaultMature: boolean;

  isActive: boolean;
  ink: BigNumber;
  art: BigNumber;
  accruedArt: BigNumber;

  ink_: string;
  art_: string;

  rateAtMaturity: BigNumber;
  rate: BigNumber;
  rate_: string;

  accruedArt_: string;
}

export interface IStrategy extends IStrategyRoot {
  currentSeriesId: string;
  currentPoolAddr: string;
  nextSeriesId: string;

  currentSeries: ISeries | undefined;
  nextSeries: ISeries | undefined;
  active: boolean;

  initInvariant?: BigNumber;
  currentInvariant?: BigNumber;

  returnRate?: BigNumber | string;
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
  DAI_SIG = 'DAI_SIG',
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
  date: number;
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
