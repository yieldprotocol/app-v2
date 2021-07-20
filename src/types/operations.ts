import { BigNumberish } from 'ethers';

export namespace PoolRouterActions {
  export enum Fn {
    FORWARD_PERMIT = 'forwardPermit',
    FORWARD_DAI_PERMIT = 'forwardDaiPermit',
    JOIN_ETHER = 'joinEther',
    EXIT_ETHER = 'exitEther',
    TRANSFER_TO_POOL = 'transferToPool',
    ROUTE = 'route',
  }
  export namespace Args {
    export type JOIN_ETHER = [base: string, fyToken: string];
    export type EXIT_ETHER = [to: string];
    export type TRANSFER_TO_POOL = [base: string, fyToken: string, token: string, wad: BigNumberish];
    export type ROUTE = [base: string, fyToken: string, poolcall: string];

    export type FORWARD_PERMIT = [
      base: string,
      fyToken: string,
      token: string,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: Buffer,
      s: Buffer
    ];
    export type FORWARD_DAI_PERMIT = [
      base: string,
      fyToken: string,
      spender: string,
      nonce: BigNumberish,
      deadline: BigNumberish,
      allowed: boolean,
      v: BigNumberish,
      r: Buffer,
      s: Buffer
    ];
  }
}

export namespace LadleActions {
  export enum Fn {
    BUILD = 'build',
    TWEAK = 'tweak',
    GIVE = 'give',
    DESTROY = 'destroy',
    STIR = 'stir',
    POUR = 'pour',
    SERVE = 'serve',
    ROLL = 'roll',
    CLOSE = 'close',
    REPAY = 'repay',
    REPAY_VAULT = 'repayVault',
    REPAY_LADLE = 'repayLadle',
    RETRIEVE = 'retrieve',
    FORWARD_PERMIT = 'forwardPermit',
    FORWARD_DAI_PERMIT = 'forwardDaiPermit',
    JOIN_ETHER = 'joinEther',
    EXIT_ETHER = 'exitEther',
    TRANSFER_TO_POOL = 'transferToPool',
    ROUTE = 'route',
    TRANSFER_TO_FYTOKEN = 'transferToFyToken',
    REDEEM = 'redeem',
    MODULE = 'module',
  }
  export namespace Args {
    export type BUILD = [seriesId: string, ilkId: string];
    export type ROLL = [vaultId: string, newSeriesId: string, loan: BigNumberish, max: BigNumberish];
    export type TWEAK = [vaultId: string, seriesId: string, ilkId: string];
    export type GIVE = [vaultId: string, to: string];
    export type DESTROY = [vaultId: string];
    export type STIR = [from: string, to: string, ink: BigNumberish, art: BigNumberish];
    export type POUR = [vaultId: string, to: string, ink: BigNumberish, art: BigNumberish];
    export type SERVE = [vaultId: string, to: string, ink: BigNumberish, base: BigNumberish, max: BigNumberish];
    export type CLOSE = [vaultId: string, to: string, ink: BigNumberish, art: BigNumberish];
    export type REPAY = [vaultId: string, to: string, ink: BigNumberish, min: BigNumberish];
    export type REPAY_VAULT = [vaultId: string, to: string, ink: BigNumberish, max: BigNumberish];
    export type REPAY_LADLE = [vaultId: string];
    export type RETRIEVE = [assetId: string, isAsset: boolean, to: string];

    export type JOIN_ETHER = [etherId: string, overrides?: any];
    export type EXIT_ETHER = [to: string];
    export type TRANSFER_TO_POOL = [seriesId: string, base: boolean, wad: BigNumberish];
    export type ROUTE = [seriesId: string, poolCall: string];
    export type TRANSFER_TO_FYTOKEN = [seriesId: string, wad: BigNumberish];
    export type REDEEM = [seriesId: string, to: string, wad: BigNumberish];

    export type FORWARD_PERMIT = [
      id: string,
      isAsset: boolean,
      spender: string,
      amount: BigNumberish,
      deadline: BigNumberish,
      v: BigNumberish,
      r: Buffer,
      s: Buffer
    ];
    export type FORWARD_DAI_PERMIT = [
      id: string,
      isAsset: boolean,
      spender: string,
      nonce: BigNumberish,
      deadline: BigNumberish,
      approved: boolean,
      v: BigNumberish,
      r: Buffer,
      s: Buffer
    ];

    export type MODULE = [];
  }
}

export namespace ReroutedActions {
  export enum Fn {
    SELL_BASE = 'sellBase',
    SELL_FYTOKEN = 'sellFYToken',
    MINT_WITH_BASE = 'mintWithBase',
    BURN_FOR_BASE = 'burnForBase',
  }

  export namespace Args {
    export type SELL_BASE = [receiver: string, min: BigNumberish];
    export type SELL_FYTOKEN = [receiver: string, min: BigNumberish];
    export type MINT_WITH_BASE = [receiver: string, fyTokenToBuy: BigNumberish, minTokensMinted: BigNumberish];
    export type BURN_FOR_BASE = [receiver: string, minBaseOut: BigNumberish];
  }
}
