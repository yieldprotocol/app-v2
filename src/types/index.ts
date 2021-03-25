import { ContractFactory } from 'ethers';

export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface IYieldSeries {
  // reqd/fixed:
  id: string;
  symbol: string;
  displayName: string;
  displayNameMobile: string;
  maturity: number;
  fyDaiAddress:string;
  poolAddress:string;
  baseId: string;

  contract?: ContractFactory;
  // optional/calculated/mutable:
  maturityDate: Date;
  apr: string;
}

export interface IYieldAsset {
  // reqd/fixed:
  id: number;
  symbol: string;
  displayName: string;
  displayNameMobile: string;
  address: string;
  // optional/calculated/mutable:
}

export interface IYieldVault {
  id: string;
  asset: IYieldAsset;
  series: IYieldSeries;
  ink: string;
  art: string;
  image:string;
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
