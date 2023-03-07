import { useContext } from 'react';
import { Box,  Layer, ResponsiveContext, Tip, Text } from 'grommet';

import { FiEye } from 'react-icons/fi';
import { useAccountModal } from '@rainbow-me/rainbowkit';
import { abbreviateHash, clearCachedItems } from '../utils/appUtils';
import BackButton from './buttons/BackButton';
import GeneralButton from './buttons/GeneralButton';
import ApprovalSetting from './settings/ApprovalSetting';
import NetworkSetting from './settings/NetworkSetting';
import SlippageSetting from './settings/SlippageSetting';
import ThemeSetting from './settings/ThemeSetting';
import UnwrapSetting from './settings/UnwrapSetting';
import BoxWrap from './wraps/BoxWrap';
import CopyWrap from './wraps/CopyWrap';
import YieldAvatar from './YieldAvatar';
import { useAccount,useEnsName, useNetwork } from 'wagmi';
import { FaWallet } from 'react-icons/fa';
import useAccountPlus from '../hooks/useAccountPlus';

const Sidebar = ({ settingsOpen, setSettingsOpen }: any) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  const { chain } = useNetwork();
  const { address, connector } = useAccountPlus();
  const { data: ensName } = useEnsName();

  const { openAccountModal } = useAccountModal();

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
        <Box flex={false}>
          {mobile && (
            <Box
              pad={{ top: 'large', horizontal: 'medium' }}
              background="gradient-transparent"
              gap="medium"
              flex={false}
            >
              <Box direction="row" gap="small" justify="between">
                <BackButton action={() => setSettingsOpen(false)} />
                {address && (
                  <CopyWrap hash={address}>
                    <Text size={mobile ? 'medium' : 'xlarge'}>{ensName || abbreviateHash(address, 6)}</Text>
                  </CopyWrap>
                )}
                <YieldAvatar address={address} size={2} />
              </Box>
              <Box direction="row" pad={{ top: 'large', horizontal: 'small' }} justify="between">
                <BoxWrap direction="row" gap="small" onClick={openAccountModal}>
                  {connector && <Text size="small">Connected with {connector.name}</Text>}
                </BoxWrap>
                <FiEye onClick={openAccountModal} />
              </Box>
              <Box pad={{ bottom: 'large', top: 'medium', horizontal: 'small' }}>
                <NetworkSetting />
              </Box>
            </Box>
          )}

          {!mobile && (
            <Box
              pad={{ horizontal: 'medium', vertical: 'medium' }}
              background="gradient-transparent"
              gap="medium"
              // height={{min: '200px'}}
            >
              <Box
                onClick={openAccountModal}
                style={{ position: 'fixed' }}
                margin={{ left: '-60px', top: '5%' }}
                animation="slideLeft"
                flex={false}
              >
                <YieldAvatar address={address} size={5} />
              </Box>

              {/* <Box direction="row" justify="end" gap="medium">
                <BoxWrap direction="row" gap="small" onClick={disconnect}>
                  <Text size="xsmall">Logout</Text>
                  <FiLogOut />
                </BoxWrap>
              </Box> */}

              <Box direction="row" justify="end">
                {address && (
                  <CopyWrap hash={address}>
                    <Text size="xlarge">{ensName || abbreviateHash(address, 6)}</Text>
                  </CopyWrap>
                )}
              </Box>

              <Box direction="row" justify="end">
                <BoxWrap direction="row" gap="small" pad="xsmall" onClick={openAccountModal} round>
                  {connector && <Text size="xsmall">Connected with {connector.name}</Text>}
                  <FaWallet />
                </BoxWrap>
              </Box>
            </Box>
          )}

          {!mobile && (
            <Box background="gradient-transparent" flex={false}>
              <Box pad="medium" background="gradient-transparent">
                  <NetworkSetting />
              </Box>
            </Box>
          )}
        </Box>

        <Box pad="medium" gap="medium" flex={false} style={{ overflow: 'auto' }}>
          <ThemeSetting />
          <ApprovalSetting />
          <UnwrapSetting />
          <SlippageSetting />
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
      </Box>
    </Layer>
  ) : null;
};

export default Sidebar;
