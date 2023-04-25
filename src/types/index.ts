import { AlchemyProvider, Block } from '@ethersproject/providers';
import { ethers, BigNumber, BigNumberish, ContractTransaction, Contract } from 'ethers';
import { ReactNode } from 'react';
import { IChainContextActions } from '../contexts/types/chain';
import { FYToken, Pool, Strategy } from '../contracts';

export { LadleActions, RoutedActions } from './operations';

export type Provider = ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider | AlchemyProvider;

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
  provider: ethers.providers.Web3Provider | null;
  chainId: number | null;
  fallbackProvider: ethers.providers.JsonRpcProvider | null;
  fallbackChainId: number | null;
  account: string | null;
  connectionName: string | null;
  useTenderlyFork: boolean;
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

export interface ISeriesRoot extends ISignable {
  id: string;
  displayName: string;
  displayNameMobile: string;
  maturity: number;
  showSeries: boolean;
  decimals: number;

  fullDate: string;
  fyTokenContract: FYToken;

  poolContract: Pool;
  poolAddress: string;
  poolName: string;
  poolVersion: string; // for signing
  poolSymbol: string; // for signing
  ts: string;
  g1: string;
  g2: string;

  // startBlock: Block; // pool init block
  baseId: string;

  color: string;
  textColor: string;
  startColor: string;
  endColor: string;

  oppStartColor: string;
  oppEndColor: string;

  seriesMark: ReactNode;

  allowActions: (ActionCodes | 'allow_all' | 'allow_none')[];
}

export enum TokenType {
  ERC20_,
  ERC20_Permit,
  ERC20_DaiPermit,
  ERC20_MKR,
  ERC1155_,
  ERC720_,
}
export enum TokenRole {
  BASE,
  COLLATERAL,
}

export interface IAssetStaticInfo {
  assetAddress: string;
  joinAddress: string;

  tokenType?: TokenType;
  tokenIdentifier?: number | string; // used for identifying tokens in a multitoken contract

  name: string;
  version: string;
  symbol: string;
  decimals: number;

  tokenRoles: TokenRole[];
  showToken: boolean; // Display/hide the token on the UI

  digitFormat: number; // this is the 'reasonable' number of digits to show. accuracy equivalent to +- 1 us cent.
  displaySymbol?: string; // override for symbol display

  wrapHandlerAddresses?: Map<number, string>; // mapping a chain id to the corresponding wrap handler address
  unwrapHandlerAddresses?: Map<number, string>; // mapping a chain id to the correpsonding unwrap handler address
  proxyId?: string;
}

export interface IAssetRoot extends IAssetStaticInfo, ISignable {
  // fixed/static:
  id: string;

  image: React.FC;
  displayName: string;
  displayNameMobile: string;
  joinAddress: string;
  joinAddressVR?: string; // for VR if we can't query - jacob b
  VYTokenAddress?: string; // for VR if we can't query - jacob b
  VYTokenProxyAddress?: string; // for VR if we can't query - jacob b

  digitFormat: number;
  assetContract: Contract;

  isWrappedToken: boolean; // Note: this is if is a token used in wrapped form by the yield protocol (except ETH - which is handled differently)
  wrappingRequired: boolean;
  proxyId: string; // id to use throughout app when referencing an asset id; uses the unwrapped asset id when the asset is wrapped (i.e: wstETH is the proxy id for stETH)

  // baked in token fns
  getAllowance: (account: string, spender: string) => Promise<BigNumber>;
  setAllowance?: (spender: string) => Promise<BigNumber | void>;
}
export interface IAsset extends IAssetRoot {
  balance: BigNumber;
  balance_: string;
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

  lastUpdate?: number;
}

export interface IStrategyRoot extends ISignable {
  id: string;
  baseId: string;
  decimals: number;
  strategyContract: Strategy;
  startBlock: Block;
  type: 'V1' | 'V2';
  associatedStrategy?: string;
}

export interface IVaultRoot {
  id: string;
  ilkId: string;
  baseId: string;
  seriesId?: string; // VR vaults won't have a series
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
  balance?: BigNumber | undefined; // fyToken balance
  balance_?: string | undefined; // fyToken balance

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
  startBlock: Block;

  // showSeries: boolean;
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
  currentSeries: ISeries | undefined;
  active: boolean;

  currentSeriesAddr?: string;
  currentPoolAddr?: string;

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

  accountRewards?: BigNumber;
  accountRewards_?: string;

  rewardsTokenAddress?: string;
  rewardsRate?: BigNumber;
  rewardsPeriod?: { start: number; end: number };
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
  LEND_FR = 'Lend_FR',
  CLOSE_POSITION = 'Redeem Position',
  ROLL_POSITION = 'Roll Position',
  REDEEM = 'Redeem',
  // POOL
  ADD_LIQUIDITY = 'Add Liquidity',
  REMOVE_LIQUIDITY = 'Remove Liquidity',
  ROLL_LIQUIDITY = 'Roll Liquidity',
  CLAIM_REWARDS = 'Claim Rewards',
  // VAULT
  DELETE_VAULT = 'Delete Vault',
  TRANSFER_VAULT = 'Transfer Vault',
  MERGE_VAULT = 'Merge Vault',
}

export interface IBaseHistItem {
  blockNumber: number;
  date: number;
  transactionHash: string;
  series?: ISeries;
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
