import { ActionCodes } from '.';

export enum GA_Event {
  connect_wallet = 'connect_wallet',
  autoConnect_wallet = 'auto_connect_wallet',

  view_changed = 'view_change', // from and to

  asset_selected = 'asset_selected',
  collateral_selected = 'collateral_selected',

  max_clicked = 'max_clicked',
  next_step_clicked = 'next_step_clicked', // flow|stepIndex

  transaction_initiated = 'transaction_initiated',

  transaction_failed = 'transaction_failed',
  transaction_will_fail = 'transaction_will_fail',
  transaction_complete = 'transaction_complete',
  transaction_rejected = 'transaction_rejected',

  safe_collateralization_clicked = 'safe_collateralization_clicked',
  follow_on_clicked = 'follow_on_clicked',

  position_opened = 'position_opened', // flow | vaultId/seriesId
  position_action_selected = 'position_action_selected',
}

export enum GA_View {
  /* Views - mostly represent the screens */
  BORROW = 'borrow_view',
  LEND = 'lend_view',
  POOL = 'pool_view',
  DASHBOARD = 'dashboard_view',

  /* Non-screen views */
  GENERAL = 'general',
}

/* Properties on events */
export namespace GA_Properties {
  export type connect_wallet = { view?: GA_View };
  export type autoConnect_wallet = { view?: GA_View };

  export type view_changed = {  toView: GA_View };

  export type asset_selected = { asset: string; view?: GA_View};
  export type collateral_selected = { asset: string; view?: GA_View};
  
  export type next_step_clicked = { step_index: number; view?: GA_View};
  export type safe_collateralization_clicked = { view?: GA_View};

  export type max_clicked = { action_code: ActionCodes, view?: GA_View;  };

  export type transaction_initiated = {
    action_code: ActionCodes;
    series_id: string;
    supporting_collateral?: string;
  };

  export type transaction_failed = {  action_code: ActionCodes, series_id:string, error: string, view?: GA_View; };
  export type transaction_will_fail = {  action_code: ActionCodes, series_id:string, error: string, view?: GA_View; };
  export type transaction_rejected = {  action_code: ActionCodes, series_id:string, error: string, view?: GA_View; };
  export type transaction_complete = { action_code: ActionCodes, series_id:string, view?: GA_View; };

  export type follow_on_clicked = { view?: GA_View };

  export type position_opened = { id: string; view?: GA_View };
  export type position_action_selected = { action: string; id: string; view?: GA_View };
}
