import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { SUPPORTED_CHAIN_IDS, SUPPORTED_RPC_URLS } from './chainData';
import MetamaskMark from '../components/logos/MetamaskMark';
import LedgerMark from '../components/logos/LedgerMark';
import WalletconnectMark from '../components/logos/WalletconnectMark';

export const CONNECTOR_INFO = new Map<string, { displayName: string; image: any }>();
CONNECTOR_INFO.set('metamask', { displayName: 'Metamask', image: MetamaskMark });
CONNECTOR_INFO.set('ledgerWithMetamask', { displayName: 'Hardware Wallet (with Metamask)', image: LedgerMark });
CONNECTOR_INFO.set('ledger', { displayName: 'Ledger', image: LedgerMark });
CONNECTOR_INFO.set('walletconnect', { displayName: 'WalletConnect', image: WalletconnectMark });

/* use cached connector as initial_injected connection or metamask if null */
export const INIT_INJECTED = 'metamask';

export const CONNECTORS = new Map();

CONNECTORS.set(
  'metamask',
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
