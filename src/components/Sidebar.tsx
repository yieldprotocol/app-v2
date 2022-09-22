import { useContext, useState } from 'react';
import { Box, Collapsible, Layer, ResponsiveContext, Tip, Text } from 'grommet';
import { useAccountModal, useChainModal, useConnectModal } from '@rainbow-me/rainbowkit';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { abbreviateHash, clearCachedItems } from '../utils/appUtils';
import BackButton from './buttons/BackButton';
import GeneralButton from './buttons/GeneralButton';
import ApprovalSetting from './settings/ApprovalSetting';
import NetworkSetting from './settings/NetworkSetting';
import SlippageSetting from './settings/SlippageSetting';
import TenderlyForkSetting from './settings/TenderlyForkSetting';
import ThemeSetting from './settings/ThemeSetting';
import UnwrapSetting from './settings/UnwrapSetting';
import TransactionItem from './TransactionItem';
import BoxWrap from './wraps/BoxWrap';
import CopyWrap from './wraps/CopyWrap';
import YieldAvatar from './YieldAvatar';
import { useAccount, useDisconnect, useEnsName, useNetwork } from 'wagmi';
import { TxContext } from '../contexts/TxContext';

const Sidebar = ({ settingsOpen, setSettingsOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const [transactionsOpen, setTransactionsOpen] = useState<boolean>(false);

  const {
    txState: { transactions },
  } = useContext(TxContext);

  const { chain } = useNetwork();
  const { address, connector } = useAccount();
  const { data } = useEnsName();

  const { disconnect } = useDisconnect();

  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();

  const handleResetApp = () => {
    clearCachedItems([]);
    // eslint-disable-next-line no-restricted-globals
    location.reload();
  };

  return address && chain && settingsOpen ? (
    <Layer
      modal={false}
      responsive={true}
      full="vertical"
      position="right"
      style={mobile ? { minWidth: undefined, maxWidth: undefined } : { minWidth: '400px', maxWidth: '400px' }}
      onClickOutside={() => setSettingsOpen(false)}
      onEsc={() => setSettingsOpen(false)}
    >
      <Box
        fill
        width={mobile ? undefined : '400px'}
        background="lightBackground"
        elevation="xlarge"
        justify="between"
        style={{ overflow: 'auto' }}
      >
        <Box gap="small" pad="medium" background="gradient-transparent" flex={false}>
          {mobile && <BackButton action={() => setSettingsOpen(false)} />}

          {!mobile && (
            <Box
              onClick={openAccountModal}
              gap="small"
              style={{ position: 'fixed' }}
              margin={{ left: '-60px', top: '10%' }}
              animation="slideLeft"
            >
              <YieldAvatar address={address} size={6} />
            </Box>
          )}

          <Box align="end" pad={{ vertical: 'small' }}>
            <Box direction="row" gap="small" fill align="center" justify={mobile ? 'between' : 'end'}>
              {mobile && <YieldAvatar address={address} size={4} />}
              <CopyWrap hash={address}>
                <Text size={mobile ? 'medium' : 'xlarge'}>{data || abbreviateHash(address, 6)}</Text>
              </CopyWrap>
            </Box>
          </Box>

          <Box gap="small">
            <Box
              direction="row"
              justify="end"
              // onClick={() => setConnectionSettingsOpen(!connectionSettingsOpen)}
              gap="medium"
              margin={{ top: 'medium' }}
            >
              <BoxWrap direction="row" gap="small">
                {connector && <Text size="xsmall">Connected with {connector.name}</Text>}
                {/* {connectionSettingsOpen ? <FiChevronUp /> : <FiChevronDown />} */}
              </BoxWrap>
            </Box>

            <Box direction="row" justify="end" onClick={() => disconnect()} gap="medium" margin={{ top: 'medium' }}>
              <BoxWrap direction="row" gap="small">
                <Text size="xsmall">Logout</Text>
              </BoxWrap>
            </Box>
            {/* <Collapsible open={connectionSettingsOpen}>
              <Box gap="xsmall">
                <GeneralButton action={handleChangeConnectType} background="gradient-transparent">
                  <Text size="xsmall">Change Connection</Text>
                </GeneralButton>

                <GeneralButton action={() => disconnect()} background="gradient-transparent">
                  <Text size="xsmall">Disconnect</Text>
                </GeneralButton>
              </Box>
            </Collapsible> */}
          </Box>
        </Box>

        {!mobile && (
          <Box background="gradient-transparent" flex={false}>
            <Box pad="medium" background="gradient-transparent">
              <NetworkSetting />
            </Box>
          </Box>
        )}

        <Box pad="medium" gap="medium" flex={false}>
          <ThemeSetting />
          <ApprovalSetting />
          <UnwrapSetting />
          <SlippageSetting />
          {process.env.ENV === 'development' && <TenderlyForkSetting />}
        </Box>

        <Box pad="medium" gap="small" flex={false}>
          <Text size="small"> Troubleshooting </Text>
          <GeneralButton action={handleResetApp} background="background">
            <Tip
              plain
              content={
                <Box
                  background="background"
                  pad="small"
                  width={{ max: '500px' }}
                  border={{ color: 'gradient-transparent' }}
                  elevation="small"
                  margin={{ vertical: 'small' }}
                  round="small"
                >
                  <Text size="xsmall">Having issues? Try resetting the app.</Text>
                </Box>
              }
              dropProps={{
                align: { right: 'left', top: 'bottom' },
              }}
            >
              <Text size="xsmall">Reset App</Text>
            </Tip>
          </GeneralButton>
        </Box>

        <Box
          margin={{ top: 'auto' }}
          pad="medium"
          gap="small"
          background="gradient-transparent"
          round={{ size: 'xsmall', corner: 'top' }}
        >
          <Box align="center" direction="row" justify="between" onClick={() => setTransactionsOpen(!transactionsOpen)}>
            <Text size="small">Recent Transactions</Text>
            {transactionsOpen ? <FiChevronDown size="1.25rem" /> : <FiChevronUp size="1.25rem" />}
          </Box>

          <Collapsible open={transactionsOpen}>
            {!transactions.size && <Text size="xsmall">Your transactions will appear here...</Text>}
            <Box>
              {[...transactions.values()].map((tx: any) => (
                <TransactionItem tx={tx} key={tx.tx.hash} wide={true} />
              ))}
            </Box>
          </Collapsible>
        </Box>
      </Box>
    </Layer>
  ) : (
    <div />
  );
};

export default Sidebar;
