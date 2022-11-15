import { Block } from '@ethersproject/providers';
import { ethers, BigNumber, BigNumberish, ContractTransaction, Contract } from 'ethers';
import { FYToken, Pool, Strategy } from '../contracts';

export { LadleActions, RoutedActions } from './operations';

export type Value = {
  value: BigNumber;
  formatted: string;
};

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

export interface ISignable {
  name: string;
  version: string;
  address: string;
  symbol: string;
  tokenType?: TokenType;
}

export interface ISeries extends ISignable {
  // ssr no fetch
  id: string;
  fyTokenAddress: string;
  poolAddress: string;

  // ssr but need to fetch
  baseId: string;
  maturity: number;
  decimals: number;
  poolVersion: string; // for signing
  poolName: string;
  poolSymbol: string; // for signing
  baseAddress: string;
  sharesAddress: string;

  fullDate: string;
  displayName: string;
  displayNameMobile: string;

  season: string;
  startColor: string;
  endColor: string;
  color: string;
  textColor: string;

  oppStartColor: string;
  oppEndColor: string;
  oppTextColor: string;
}

export interface ISeriesDynamic extends ISeries {
  // need to fetch client-side
  ts: BigNumber;
  g1: BigNumber;
  g2: BigNumber;

  // Yieldspace TV
  c: BigNumber | undefined;
  mu: BigNumber | undefined;

  apr: string;
  sharesReserves: Value;
  fyTokenReserves: Value;
  fyTokenRealReserves: Value;
  totalSupply: Value;
  poolAPY?: string;
  seriesIsMature: boolean;

  currentInvariant?: BigNumber;
  initInvariant?: BigNumber;
  startBlock?: Block;

  // user data
  poolTokens?: BigNumber | undefined;
  poolTokens_?: string | undefined;
  fyTokenBalance?: BigNumber | undefined;
  fyTokenBalance_?: string | undefined;

  getShares: (baseAmount: BigNumber) => BigNumber;
  getBase: (sharesAmount: BigNumber) => BigNumber;

  poolContract: Pool;
  fyTokenContract: FYToken;
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

  tokenType?: TokenType;
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
  getAllowance: (account: string, spender: string) => Promise<BigNumber>;
  setAllowance?: (spender: string) => Promise<BigNumber | void>;
}

export interface IAsset extends IAssetRoot {
  balance: Value;
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
}

export interface IStrategy extends IStrategyRoot {
  currentSeries: ISeries;
  currentSeriesId: string;
  currentPoolAddr: string;
  accountBalance?: Value;
}

export interface IStrategyDynamic extends IStrategy {
  accountBalance: Value;
  totalSupply: Value;
  poolTotalSupply: Value;
  strategyPoolBalance: Value;
}

export interface IVault {
  id: string;
  baseId: string;
  ilkId: string;
  owner: string;
  displayName: string;
  decimals: number;
  isActive: boolean;

  seriesId: string;
  series: ISeries | undefined;

  ink: Value;
  art: Value;

  isWitchOwner: boolean;
  hasBeenLiquidated: boolean;
  isVaultMature: boolean;

  accruedArt: Value;
  rate: Value;
  rateAtMaturity: BigNumber;
}

export interface IDummyVault extends IVault {}

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
