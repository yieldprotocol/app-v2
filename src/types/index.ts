export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface IYieldSeries {
  // reqd/fixed:
  symbol: string;
  displayName: string;
  displayNameMobile: string;
  maturity: number;
  fyDaiAddress:string;
  poolAddress:string;
  // optional/calculated/mutable:
  maturityDate?: Date;
  apr?: string;
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
  collateralBalance: string;
  assetBalance: string;
}

export interface IMenuProps {
  toggleMenu: ()=>void;
}

export enum View {
  account = 'ACCOUNT',
  vaults = 'VAULTS',
}
