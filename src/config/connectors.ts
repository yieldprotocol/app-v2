import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { SUPPORTED_CHAIN_IDS, SUPPORTED_RPC_URLS } from './chainData';

// Map the provider connection url name to a nicer format
export const CONNECTOR_NAMES = new Map([
  ['metamask', 'Metamask'],
  ['ledgerWithMetamask', 'Ledger (with Metamask)'],
  ['ledger', 'Ledger'],
  ['walletconnect', 'WalletConnect'],
]);

export const INIT_INJECTED = 'metamask';

export const CONNECTORS = new Map();

CONNECTORS.set(
  INIT_INJECTED,
  new InjectedConnector({
    supportedChainIds: SUPPORTED_CHAIN_IDS,
  })
);

CONNECTORS.set(
  'walletconnect',
  new WalletConnectConnector({
    rpc: SUPPORTED_RPC_URLS,
    bridge: 'https://bridge.walletconnect.org',
    qrcode: true,
  })
);

CONNECTORS.set(
  'ledgerWithMetamask',
  new InjectedConnector({
    supportedChainIds: SUPPORTED_CHAIN_IDS,
  })
);
