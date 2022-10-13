
export enum GA_Event {

    connect_wallet='connect_wallet',
    autoConnect_wallet='auto_connect_wallet',

    view_changed = 'view_change', // from and to

    asset_selected='asset_selected',
    collateral_selected='collateral_selected',
    
    max_clicked='max_clicked',
    next_step_clicked = 'next_step_clicked', // flow|stepIndex
    
    transaction_initiated='transaction_initiated', 
    
    transaction_failed='transaction_failed', 
    transaction_complete='transaction_complete',
    transaction_rejected='transaction_rejected',

    safe_collateralization_clicked = 'safe_collateralization_clicked',
    follow_on_clicked='follow_on_clicked',

    position_opened='position_opened', // flow | vaultId/seriesId
    position_action_selected ='position_action_selected',

}

export enum GA_View {
 
    /* Views mostly represent the screens */
    BORROW = 'borrow_view',
    LEND = 'lend_view',
    POOL= 'pool_view',
    DASHBOARD = 'dashboard_view',
    
    /* Non screen views */
    GENERAL = 'general'
  }

// export namespace GA_Event_Properties {
//     export type connect_wallet = { asset: string, view: string, chain_id: number };
// }